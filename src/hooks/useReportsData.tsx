import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, addMonths, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ReportBadgeCategory = "genre" | "behavior";

export interface ReportBadge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: ReportBadgeCategory;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

export interface ReportsData {
  badges: ReportBadge[];
  level: {
    currentXP: number;
    totalXPForNextLevel: number;
    currentLevel: number;
    totalBooksRead: number;
    totalPagesRead: number;
  };
  honeycomb: {
    streakDays: boolean[];
    currentStreak: number;
    freezesAvailable: number;
  };
  readingStats: {
    hourlyData: { hour: number; minutes: number }[];
    weeklyData: { day: string; pages: number }[];
    readerType: "night_owl" | "early_bird" | "balanced";
  };
  wrapped: {
    month: string;
    year: number;
    totalWords: number;
    favoriteBook: { title: string; author: string; timeSpent: string };
    dominantColor: "pink" | "blue" | "green" | "orange";
    totalBooks: number;
    totalPages: number;
    streak: number;
  };
}

const safeString = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

const wordsCount = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

const formatDuration = (totalSeconds: number) => {
  const totalMinutes = Math.max(0, Math.round(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const computeReaderType = (hourly: { hour: number; minutes: number }[]) => {
  const total = hourly.reduce((sum, h) => sum + h.minutes, 0);
  if (total <= 0) return "balanced" as const;

  const night = hourly.filter((h) => h.hour >= 20 || h.hour <= 1).reduce((s, h) => s + h.minutes, 0);
  const morning = hourly.filter((h) => h.hour >= 5 && h.hour <= 10).reduce((s, h) => s + h.minutes, 0);

  if (night / total >= 0.45) return "night_owl" as const;
  if (morning / total >= 0.45) return "early_bird" as const;
  return "balanced" as const;
};

const dominantColorFromHighlights = (counts: Record<string, number>) => {
  const entries = Object.entries(counts);
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0]?.[0];
  switch (top) {
    case "blue":
      return "blue" as const;
    case "yellow":
      return "orange" as const;
    case "red":
      return "pink" as const;
    default:
      return "pink" as const;
  }
};

export const useReportsData = (opts?: { forDate?: Date }) => {
  const { user } = useAuth();

  const forDate = opts?.forDate ?? new Date();
  const monthStart = startOfMonth(forDate);
  const monthEnd = addMonths(monthStart, 1);

  const { data, isLoading, error } = useQuery<ReportsData>({
    queryKey: ["reports-data", user?.id, format(monthStart, "yyyy-MM")],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("No user");
      }

      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_streak")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentStreak = profile?.current_streak ?? 0;

      // Books (for totals + favorite book map)
      const { data: books, error: booksError } = await supabase
        .from("books")
        .select("id,title,author,status,total_pages,current_page")
        .eq("user_id", user.id);

      if (booksError) throw booksError;

      const booksById = new Map(
        (books ?? []).map((b) => [b.id as string, { title: b.title as string, author: (b.author as string | null) ?? "" }])
      );

      const totalBooksRead = (books ?? []).filter((b) => b.status === "completed").length;
      const totalPagesRead = (books ?? []).reduce((sum, b) => {
        const totalPages = typeof b.total_pages === "number" ? b.total_pages : 0;
        const currentPage = typeof b.current_page === "number" ? b.current_page : 0;
        if (b.status === "completed") return sum + totalPages;
        return sum + currentPage;
      }, 0);

      // XP/Level (simple deterministic formula)
      const currentXP = Math.max(0, totalPagesRead);
      const currentLevel = clamp(Math.floor(currentXP / 500) + 1, 1, 99);
      const totalXPForNextLevel = currentLevel * 500;

      // Daily reading for last 7 days (weekly pages)
      const today = new Date();
      const weekAgo = subDays(today, 6);

      const { data: daily7, error: daily7Error } = await supabase
        .from("daily_reading")
        .select("date,pages_read,total_seconds")
        .eq("user_id", user.id)
        .gte("date", format(weekAgo, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (daily7Error) throw daily7Error;

      const weeklyData: { day: string; pages: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        const dateStr = format(d, "yyyy-MM-dd");
        const found = daily7?.find((x) => x.date === dateStr);
        weeklyData.push({
          day: format(d, "EEE", { locale: vi }),
          pages: typeof found?.pages_read === "number" ? found.pages_read : 0,
        });
      }

      // Hourly reading chart: group reading_sessions (month)
      const { data: sessions, error: sessionsError } = await supabase
        .from("reading_sessions")
        .select("book_id,started_at,duration_seconds")
        .eq("user_id", user.id)
        .gte("started_at", monthStart.toISOString())
        .lt("started_at", monthEnd.toISOString());

      if (sessionsError) throw sessionsError;

      const minutesByHour = new Array<number>(24).fill(0);
      const secondsByBook = new Map<string, number>();

      for (const s of sessions ?? []) {
        const startedAt = new Date(s.started_at as string);
        const hour = Number.isNaN(startedAt.getTime()) ? 0 : startedAt.getHours();
        const seconds = typeof s.duration_seconds === "number" ? s.duration_seconds : 0;

        minutesByHour[hour] += Math.round(seconds / 60);

        const bookId = safeString(s.book_id);
        secondsByBook.set(bookId, (secondsByBook.get(bookId) ?? 0) + seconds);
      }

      const hourlyData = minutesByHour.map((minutes, hour) => ({ hour, minutes }));
      const readerType = computeReaderType(hourlyData);

      // Honeycomb streak days: days in current month based on daily_reading.total_seconds > 0
      const { data: monthDaily, error: monthDailyError } = await supabase
        .from("daily_reading")
        .select("date,total_seconds,pages_read")
        .eq("user_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lt("date", format(monthEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (monthDailyError) throw monthDailyError;

      const daysInMonth = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 0).getDate();
      const streakDays = new Array<boolean>(daysInMonth).fill(false);

      for (const row of monthDaily ?? []) {
        const d = new Date(`${row.date as string}T00:00:00`);
        const dayIndex = d.getDate() - 1;
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          const seconds = typeof row.total_seconds === "number" ? row.total_seconds : 0;
          streakDays[dayIndex] = seconds > 0;
        }
      }

      // Wrapped: highlights word count + dominant highlight color (month)
      const { data: monthHighlights, error: highlightsError } = await supabase
        .from("highlights")
        .select("content,color")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", monthEnd.toISOString());

      if (highlightsError) throw highlightsError;

      let totalWords = 0;
      const highlightColorCounts: Record<string, number> = { yellow: 0, blue: 0, red: 0 };

      for (const h of monthHighlights ?? []) {
        totalWords += wordsCount(safeString(h.content));
        const c = safeString(h.color);
        if (c) highlightColorCounts[c] = (highlightColorCounts[c] ?? 0) + 1;
      }

      const dominantColor = dominantColorFromHighlights(highlightColorCounts);

      // Favorite book by reading time
      let favoriteBookId = "";
      let favoriteSeconds = 0;
      for (const [bookId, seconds] of secondsByBook.entries()) {
        if (seconds > favoriteSeconds) {
          favoriteSeconds = seconds;
          favoriteBookId = bookId;
        }
      }
      const favorite = booksById.get(favoriteBookId);

      // Total pages this month
      const totalPagesThisMonth = (monthDaily ?? []).reduce(
        (sum, r) => sum + (typeof r.pages_read === "number" ? r.pages_read : 0),
        0
      );

      // Total books this month
      const totalBooks = new Set((sessions ?? []).map((s) => safeString(s.book_id)).filter(Boolean)).size;

      // Badges (new tables) - we use select('*') to tolerate schema differences.
      let badges: ReportBadge[] = [];
      try {
        const sb = supabase as any;

        const { data: badgeRows, error: badgeErr } = await sb.from("badges").select("*");
        if (badgeErr) throw badgeErr;

        const { data: userBadgeRows, error: userBadgeErr } = await sb
          .from("user_badges")
          .select("*")
          .eq("user_id", user.id);
        if (userBadgeErr) throw userBadgeErr;

        const userByBadgeId = new Map<string, any>();
        for (const ub of userBadgeRows ?? []) {
          const badgeId = safeString((ub as any).badge_id);
          if (badgeId) userByBadgeId.set(badgeId, ub);
        }

        badges = (badgeRows ?? []).map((b: any) => {
          const id = safeString(b.id);
          const ub = userByBadgeId.get(id);

          const categoryRaw = safeString(b.category, "behavior");
          const category: ReportBadgeCategory = categoryRaw === "genre" ? "genre" : "behavior";

          const progress = typeof ub?.progress === "number" ? ub.progress : typeof ub?.current_progress === "number" ? ub.current_progress : undefined;
          const total = typeof b.total === "number" ? b.total : typeof b.target === "number" ? b.target : undefined;

          const unlocked =
            ub?.unlocked === true ||
            typeof ub?.unlocked_at === "string" ||
            (typeof total === "number" && typeof progress === "number" ? progress >= total : !!ub);

          return {
            id,
            name: safeString(b.name),
            description: safeString(b.description),
            emoji: safeString(b.emoji, "🏅"),
            category,
            unlocked,
            progress,
            total,
          };
        });
      } catch {
        // If tables don't exist yet in the connected project, just show empty.
        badges = [];
      }

      const monthLabel = format(monthStart, "LLLL", { locale: vi });

      return {
        badges,
        level: {
          currentXP,
          totalXPForNextLevel,
          currentLevel,
          totalBooksRead,
          totalPagesRead,
        },
        honeycomb: {
          streakDays,
          currentStreak,
          freezesAvailable: 0,
        },
        readingStats: {
          hourlyData,
          weeklyData,
          readerType,
        },
        wrapped: {
          month: monthLabel,
          year: monthStart.getFullYear(),
          totalWords,
          favoriteBook: {
            title: favorite?.title ?? "(Chưa có)",
            author: favorite?.author ?? "",
            timeSpent: formatDuration(favoriteSeconds),
          },
          dominantColor,
          totalBooks,
          totalPages: totalPagesThisMonth,
          streak: currentStreak,
        },
      };
    },
  });

  return { data, isLoading, error };
};
