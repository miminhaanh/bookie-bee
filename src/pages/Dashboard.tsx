import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DashboardToolbar } from "@/components/dashboard/DashboardToolbar";
import { BookShelf } from "@/components/dashboard/BookShelf";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BookStatus } from "@/hooks/useBooks";
import { useReportsData } from "@/hooks/useReportsData";
import { UserTour } from "@/components/common/UserTour";
import AdPopup from "@/components/common/AdPopup";

interface BookWithProgress {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  progress: number | null;
  status: BookStatus | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: reportData } = useReportsData();

  const [booksReading, setBooksReading] = useState<BookWithProgress[]>([]);
  const [booksCompleted, setBooksCompleted] = useState<BookWithProgress[]>([]);
  const [booksSaved, setBooksSaved] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(
    null
  );

  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [runTour, setRunTour] = useState(false);

  /* ===================== AUTH GUARD ===================== */
  useEffect(() => {
    if (!user) {
      const returnUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      navigate(`/auth?returnUrl=${returnUrl}`, { replace: true });
    }
  }, [user, navigate]);

  /* ===================== FETCH DASHBOARD DATA ===================== */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // ✅ Use .limit(1) instead of .single()/.maybeSingle() - safer approach
        const [{ data: books }, { data: profileData, error: profileError }] = await Promise.all([
          supabase
            .from("books")
            .select("id,title,author,cover_url,progress,status")
            .eq("user_id", user.id),
          supabase
            .from("profiles")
            .select("avatar_url, display_name, current_streak, onboarding_completed")
            .eq("user_id", user.id)
            .limit(1),
        ]);

        if (profileError) {
          console.warn("Dashboard profile fetch warning:", profileError.message);
        }

        const profile = profileData?.[0] ?? null;
        const allBooks = books ?? [];

        setBooksReading(allBooks.filter((b) => b.status === "reading"));
        setBooksCompleted(
          allBooks
            .filter((b) => b.status === "completed")
            .map((b) => ({ ...b, progress: 100 }))
        );
        setBooksSaved(allBooks.filter((b) => b.status === "to_read"));

        setProfileAvatarUrl(profile?.avatar_url ?? null);
        setProfileDisplayName(profile?.display_name ?? null);

        // ✅ Use onboarding_completed from DB (after adding column)
        // Fallback: if column doesn't exist yet, use hasBooks as indicator
        const dbOnboarding = (profile as any)?.onboarding_completed;
        if (typeof dbOnboarding === "boolean") {
          setOnboardingCompleted(dbOnboarding);
        } else {
          // Fallback for migration period: user has books = completed onboarding
          setOnboardingCompleted(allBooks.length > 0);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  /* ===================== DERIVED DATA ===================== */
  const hasAnyBooks =
    booksReading.length + booksCompleted.length + booksSaved.length > 0;

  const filterBooks = (books: BookWithProgress[]) => {
    if (!searchQuery) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.author ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  /* ===================== HANDLERS ===================== */
  useEffect(() => {
    if (!user || loading) return;
    if (!onboardingCompleted && !hasAnyBooks) {
      const timer = setTimeout(() => {
        const targetsReady =
          !!document.querySelector(".profile-card-tour") &&
          !!document.querySelector(".sidebar-add-book") &&
          !!document.querySelector(".nav-reports");

        if (targetsReady) {
          setRunTour(true);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [user, loading, onboardingCompleted, hasAnyBooks]);

  const handleTourFinish = async () => {
    setRunTour(false);
    setOnboardingCompleted(true);
    
    // ✅ Persist onboarding_completed to DB (after adding column)
    if (user) {
      try {
        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              onboarding_completed: true,
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id" }
          );
      } catch (err) {
        console.warn("Failed to update onboarding_completed:", err);
        // Non-critical - continue anyway
      }
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <SidebarProvider>
      <UserTour run={runTour} onFinish={handleTourFinish} />
      <AdPopup />
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        {/* ===================== MAIN ===================== */}
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="lg:hidden h-16 border-b flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <span className="font-bold">🐝 Bookie Bee</span>
          </header>

          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
              {/* Top Section: Profile + Stats */}
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px] lg:gap-6">
                {/* Profile Card - Primary focus */}
                <ProfileCard
                  className="profile-card-tour"
                  level={reportData?.level.currentLevel ?? 1}
                  xp={reportData?.level.currentXP ?? 0}
                  xpToNextLevel={
                    reportData?.level.totalXPForNextLevel ?? 500
                  }
                  avatarUrl={profileAvatarUrl}
                  displayName={profileDisplayName}
                  isLoading={loading}
                />
                
                {/* Stats Cards - Secondary, stacked vertically on right */}
                <StatsCards
                  totalBooks={
                    booksReading.length +
                    booksCompleted.length +
                    booksSaved.length
                  }
                  completedBooks={booksCompleted.length}
                  streak={reportData?.streak ?? 0}
                />
              </section>

              {/* Search Section - Standalone */}
              <section>
                <DashboardToolbar onSearch={setSearchQuery} />
              </section>

              {/* Book Shelves - Clear separation */}
              <section className="space-y-8 pt-2">
                <BookShelf
                  title="Đang đọc"
                  books={filterBooks(booksReading)}
                  type="reading"
                  showAddButton
                />

                <BookShelf
                  title="Đã hoàn thành"
                  books={filterBooks(booksCompleted)}
                  type="completed"
                />

                <BookShelf
                  title="Sách muốn đọc"
                  books={filterBooks(booksSaved)}
                  type="saved"
                />
              </section>

              {loading && (
                <p className="text-sm text-muted-foreground mt-4">
                  Đang tải dữ liệu...
                </p>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;