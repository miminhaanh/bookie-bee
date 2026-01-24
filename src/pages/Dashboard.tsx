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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { BookStatus } from "@/hooks/useBooks";
import { useReportsData } from "@/hooks/useReportsData";

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
  const [welcomeBannerSeen, setWelcomeBannerSeen] = useState(false);

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
              "avatar_url, display_name, onboarding_completed, welcome_banner_seen, current_streak"
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
        setWelcomeBannerSeen(profile?.welcome_banner_seen ?? false);
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

  // Show onboarding only if:
  // 1. User has NOT completed onboarding (first time)
  // 2. User has NO books yet
  const shouldShowOnboarding =
    !onboardingCompleted && !hasAnyBooks;

  // Show welcome banner only if:
  // 1. Onboarding was completed
  // 2. Banner hasn't been seen yet
  // 3. User still has no books
  // 4. Not searching
  const shouldShowWelcomeBanner =
    onboardingCompleted &&
    !welcomeBannerSeen &&
    !hasAnyBooks &&
    !searchQuery;

  /* ===================== HANDLERS ===================== */
  const completeOnboarding = async () => {
    if (!user) return;
    await (supabase as any)
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);

    setOnboardingCompleted(true);
    navigate("/add-book");
  };

  const handleWelcomeBannerClick = async () => {
    if (!user) return;
    await (supabase as any)
      .from("profiles")
      .update({ welcome_banner_seen: true })
      .eq("user_id", user.id);

    setWelcomeBannerSeen(true);
    navigate("/add-book");
  };

  /* ===================== RENDER ===================== */
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        {/* ========== ONBOARDING DIALOG (FIRST LOGIN ONLY) ========== */}
        {shouldShowOnboarding && (
          <Dialog open>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl flex gap-2">
                  🎉 Chào mừng đến với Bookie Bee!
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <p>📚 Thêm sách của bạn</p>
                <p>📖 Bắt đầu đọc – tiến độ tự động lưu</p>
                <p>✨ Highlight & ghi chú</p>
              </div>

              <DialogFooter>
                <Button onClick={completeOnboarding} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Bắt đầu thêm sách
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* ===================== MAIN ===================== */}
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="lg:hidden h-16 border-b flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <span className="font-bold">🐝 Bookie Bee</span>
          </header>

          <ScrollArea className="flex-1">
            <div className="p-6 max-w-7xl mx-auto">
              <section className="mb-8 grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProfileCard
                    level={reportData?.level.currentLevel ?? 1}
                    xp={reportData?.level.currentXP ?? 0}
                    xpToNextLevel={
                      reportData?.level.totalXPForNextLevel ?? 500
                    }
                    avatarUrl={profileAvatarUrl}
                    displayName={profileDisplayName}
                  />
                </div>
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

              <DashboardToolbar onSearch={setSearchQuery} />

              {shouldShowWelcomeBanner && (
                <div className="mt-4 p-6 rounded-2xl bg-pink-50 border">
                  <h3 className="font-bold mb-2">
                    👋 Chào mừng bạn lần đầu!
                  </h3>
                  <Button onClick={handleWelcomeBannerClick}>
                    Thêm sách đầu tiên
                  </Button>
                </div>
              )}

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