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
  // Convenience field để màn hình khác (Dashboard) có thể truy cập streak nhanh
  streak: number;
  moodStats?: {
    counts: Record<string, number>;
    total: number;
  };
  missions?: {
    id: string;
    description: string;
    target: number;
    progress: number;
    xpReward: number;
    isCompleted: boolean;
    isClaimed?: boolean;
    type: "daily" | "monthly" | "streak";
  }[];
}

const safeString = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

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
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("current_streak, bonus_xp") // bonus_xp added in migration
        .eq("user_id", user.id)
        .maybeSingle();

      const p = profile as any; // Cast to any to avoid type errors before codegen
      const currentStreak = p?.current_streak ?? 0;

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
      const currentXP = Math.max(0, totalPagesRead) + (p?.bonus_xp ?? 0);
      const currentLevel = clamp(Math.floor(currentXP / 500) + 1, 1, 99);
      const totalXPForNextLevel = currentLevel * 500;

      // Daily reading for last 7 days (weekly pages)
      const today = new Date();
      const weekAgo = subDays(today, 6);

      // Only fetch if we need weekly data. Removing detailed stats for faster load as requested.
      // Keeping weekly data for charts but removed other stats.
      const { data: daily7 } = await supabase
        .from("daily_reading")
        .select("date,pages_read,total_seconds")
        .eq("user_id", user.id)
        .gte("date", format(weekAgo, "yyyy-MM-dd"))
        .order("date", { ascending: true });

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

      // Hourly reading chart: group reading_sessions (limit to improve performance)
      // Removed full month sessions fetch or limited fields further if needed.
      // Already optimized fields above.
      const { data: sessions } = await supabase
        .from("reading_sessions")
        .select("started_at,duration_seconds")
        .eq("user_id", user.id)
        .gte("started_at", monthStart.toISOString())
        .lt("started_at", monthEnd.toISOString())
        .limit(500); // Add limit to prevent loading too many rows

      const minutesByHour = new Array<number>(24).fill(0);

      for (const s of sessions ?? []) {
        const startedAt = new Date(s.started_at as string);
        const hour = Number.isNaN(startedAt.getTime()) ? 0 : startedAt.getHours();
        const seconds = typeof s.duration_seconds === "number" ? s.duration_seconds : 0;

        minutesByHour[hour] += Math.round(seconds / 60);
      }

      const hourlyData = minutesByHour.map((minutes, hour) => ({ hour, minutes }));
      const readerType = computeReaderType(hourlyData);

      // Honeycomb streak days (optimized to fetch less data)
      const { data: monthDaily } = await supabase
        .from("daily_reading")
        .select("date,total_seconds,pages_read")
        .eq("user_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lt("date", format(monthEnd, "yyyy-MM-dd"));

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

      // Removed highlights query for performance optimization

      // Removed favorite book calculation for performance optimization

      // Removed moods query for performance optimization

      // Removed missions query for performance optimization

      // Removed totalPages and totalBooks calculation for performance optimization

      // Removed badges query for performance optimization

      const monthLabel = format(monthStart, "LLLL", { locale: vi });

      return {
        badges: [], // Empty - removed for performance
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
          totalWords: 0, // Removed for performance
          favoriteBook: {
            title: "(Chưa có)",
            author: "",
            timeSpent: "0m",
          },
          dominantColor: "pink" as const,
          totalBooks: 0, // Removed for performance
          totalPages: 0,
          streak: currentStreak,
        },
        moodStats: {
          counts: {},
          total: 0
        },
        missions: [], // Empty - removed for performance
        streak: currentStreak,
      };
    },
  });

  return { data, isLoading, error };
};