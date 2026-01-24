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
        const [{ data: books }, { data: profile, error: profileError }] = await Promise.all([
          supabase
            .from("books")
            .select("id,title,author,cover_url,progress,status")
            .eq("user_id", user.id),
          (supabase as any)
            .from("profiles")
            .select(
              "avatar_url, display_name, onboarding_completed, current_streak"
            )
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (profileError) {
          console.warn("Dashboard profile fetch warning:", profileError.message);
        }

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

        setOnboardingCompleted(profile?.onboarding_completed ?? false);
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
      setRunTour(true);
    }
  }, [user, loading, onboardingCompleted, hasAnyBooks]);

  const handleTourFinish = async () => {
    setRunTour(false);
    if (!user) return;
    await (supabase as any)
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);
    setOnboardingCompleted(true);
  };

  /* ===================== RENDER ===================== */
  return (
    <SidebarProvider>
      <UserTour run={runTour} onFinish={handleTourFinish} />
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        {/* ===================== MAIN ===================== */}
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="lg:hidden h-16 border-b flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <span className="font-bold">🐝 Bookie Bee</span>
          </header>

          <ScrollArea className="flex-1">
            <div className="p-6 max-w-7xl mx-auto">
              <section className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2 lg:col-span-2">
                  <ProfileCard
                    className="profile-card-tour h-full"
                    level={reportData?.level.currentLevel ?? 1}
                    xp={reportData?.level.currentXP ?? 0}
                    xpToNextLevel={
                      reportData?.level.totalXPForNextLevel ?? 500
                    }
                    avatarUrl={profileAvatarUrl}
                    displayName={profileDisplayName}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                  <StatsCards
                    totalBooks={
                      booksReading.length +
                      booksCompleted.length +
                      booksSaved.length
                    }
                    completedBooks={booksCompleted.length}
                    streak={reportData?.streak ?? 0}
                  />
                </div>
              </section>

              <DashboardToolbar onSearch={setSearchQuery} />

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