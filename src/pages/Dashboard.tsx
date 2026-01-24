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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { BookStatus } from "@/hooks/useBooks";

import { useReportsData } from "@/hooks/useReportsData";

interface ReadingStats {
  totalBooks: number;
  completedBooks: number;
  readingBooks: number;
  readingStreak: number;
}

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
  const { data: reportData } = useReportsData(); // Fetch real gamification data
  const [currentlyReading, setCurrentlyReading] = useState<BookWithProgress[]>([]);
  const [completedBooks, setCompletedBooks] = useState<BookWithProgress[]>([]);
  const [savedBooks, setSavedBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [stats, setStats] = useState<ReadingStats>({
    totalBooks: 0,
    completedBooks: 0,
    readingBooks: 0,
    readingStreak: 0,
  });
  const [hasSeenWelcomeBanner, setHasSeenWelcomeBanner] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('onboarding_done') !== 'true';
  });

  // Track per-account whether the in-dashboard welcome banner has been shown
  useEffect(() => {
    if (!user?.id) return;
    const key = `welcome_banner_shown_${user.id}`;
    const seen = localStorage.getItem(key) === 'true';
    setHasSeenWelcomeBanner(seen);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/auth?returnUrl=${returnUrl}`, { replace: true });
      return;
    }

    void fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [{ data: booksData, error: booksError }, { data: profileData }] =
        await Promise.all([
          supabase
            .from("books")
            .select("id,title,author,cover_url,progress,status")
            .eq("user_id", user.id),
          supabase
            .from("profiles")
            .select("current_streak, avatar_url, display_name")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

      if (booksError) throw booksError;

      const allBooks = (booksData ?? []) as BookWithProgress[];
      const reading = allBooks.filter((b) => b.status === "reading");
      const completed = allBooks
        .filter((b) => b.status === "completed")
        .map((b) => ({ ...b, progress: 100 }));
      const saved = allBooks.filter((b) => b.status === "to_read");

      setCurrentlyReading(reading);
      setCompletedBooks(completed);
      setSavedBooks(saved);

      setStats({
        totalBooks: allBooks.length,
        completedBooks: completed.length,
        readingBooks: reading.length,
        readingStreak: profileData?.current_streak ?? 0,
      });

      setProfileAvatarUrl(profileData?.avatar_url ?? null);
      setProfileDisplayName(profileData?.display_name ?? null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const demoExploreBooks: BookWithProgress[] = [
    { id: "8", title: "Deep Work", author: "Cal Newport", cover_url: null, progress: 0, status: "to_read" },
    { id: "9", title: "7 Habits", author: "Stephen Covey", cover_url: null, progress: 0, status: "to_read" },
    { id: "10", title: "Zero to One", author: "Peter Thiel", cover_url: null, progress: 0, status: "to_read" },
  ];

  // Logic hiển thị: Nếu không có sách thật, KHÔNG hiển thị sách demo ở mục cá nhân.
  // Chỉ hiển thị sách demo ở mục "Khám phá"
  const displayReadingBooks = currentlyReading;
  const displayCompletedBooks = completedBooks;
  const displaySavedBooks = savedBooks;

  // Filter books based on search query
  const filterBooks = (books: BookWithProgress[]) => {
    if (!searchQuery) return books;
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const hasAnyRealBooks =
    currentlyReading.length + completedBooks.length + savedBooks.length > 0;

  const booksForStats = hasAnyRealBooks
    ? [...currentlyReading, ...completedBooks, ...savedBooks]
    : [];

  // Consider a book "read" if it's completed OR progress is near the end (98% - 100%).
  const booksReadCount = booksForStats.filter(
    (b) => b.status === "completed" || (b.progress ?? 0) >= 98
  ).length;

  const totalBooksCount = booksForStats.length;

  const handleWelcomeBannerClick = () => {
    if (user?.id) {
      const key = `welcome_banner_shown_${user.id}`;
      localStorage.setItem(key, 'true');
      setHasSeenWelcomeBanner(true);
    }
    navigate('/add-book');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        {/* Onboarding Dialog for new users */}
        {showOnboarding && !hasAnyRealBooks && (
          <Dialog open={true} onOpenChange={(open) => {
            if (!open) {
              localStorage.setItem('onboarding_done', 'true');
              setShowOnboarding(false);
            }
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <span>🎉</span>
                  Chào mừng đến với Bookie Bee!
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">📚</div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg mb-1">Bước 1: Thêm sách của bạn</p>
                    <p className="text-sm text-muted-foreground">Tải lên file PDF hoặc EPUB để bắt đầu đọc</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-3xl">📖</div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg mb-1">Bước 2: Bắt đầu đọc</p>
                    <p className="text-sm text-muted-foreground">Tiến độ sẽ tự động được lưu</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-3xl">✨</div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg mb-1">Bước 3: Highlight & ghi chú</p>
                    <p className="text-sm text-muted-foreground">Lưu lại những đoạn yêu thích</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    <span className="font-semibold">👉 Lưu ý:</span> Các sách bên dưới chỉ là mẫu. Bắt đầu thêm sách của bạn để trải nghiệm đọc sách thú vị nhé!
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  localStorage.setItem('onboarding_done', 'true');
                  setShowOnboarding(false);
                  navigate('/add-book');
                }} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Bắt đầu thêm sách
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header with Sidebar Trigger */}
          <header className="lg:hidden h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center px-4 sticky top-0 z-40">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐝</span>
              <span className="font-bold text-lg">Bookie Bee</span>
            </div>
          </header>

          <ScrollArea className="flex-1">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {/* Header Section - Profile & Stats */}
              <section className="mb-8">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Profile Card - Takes 2 columns on large screens */}
                  <div className="lg:col-span-2">
                    <ProfileCard
                      level={reportData?.level.currentLevel ?? 1}
                      xp={reportData?.level.currentXP ?? 0}
                      xpToNextLevel={reportData?.level.totalXPForNextLevel ?? 500}
                      avatarUrl={profileAvatarUrl}
                      displayName={profileDisplayName}
                    />
                  </div>

                  {/* Stats Cards */}
                  <div>
                    <StatsCards
                      totalBooks={totalBooksCount}
                      completedBooks={booksReadCount}
                      streak={stats.readingStreak}
                    />
                  </div>
                </div>
              </section>

              {/* Toolbar Section */}
              <section className="mb-8">
                <DashboardToolbar onSearch={setSearchQuery} />

                {/* Welcome banner for new users (only show once per account/browser) */}
                {!hasAnyRealBooks && !searchQuery && !hasSeenWelcomeBanner && (
                  <div className="mt-4 p-6 rounded-2xl bg-gradient-to-r from-warm-pink/20 to-coral/20 border-2 border-warm-pink/30">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">👋</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2">Chào mừng đến với Bookie Bee!</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Các sách bên dưới chỉ là mẫu. Bắt đầu thêm sách của bạn để trải nghiệm đọc sách thú vị nhé! 📚
                        </p>
                        <Button onClick={handleWelcomeBannerClick} className="gap-2">
                          <Plus className="w-4 h-4" />
                          Thêm sách đầu tiên của bạn
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search results feedback */}
                {searchQuery && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm">
                      {(() => {
                        const totalResults =
                          filterBooks(displayReadingBooks).length +
                          filterBooks(displayCompletedBooks).length +
                          filterBooks(displaySavedBooks).length;
                        return totalResults > 0
                          ? `🔍 Tìm thấy ${totalResults} kết quả cho "${searchQuery}"`
                          : `😔 Không tìm thấy sách nào cho "${searchQuery}"`;
                      })()}
                    </p>
                    {filterBooks(displayReadingBooks).length +
                      filterBooks(displayCompletedBooks).length +
                      filterBooks(displaySavedBooks).length === 0 && (
                        <Button
                          variant="link"
                          className="mt-2 p-0 h-auto text-primary"
                          onClick={() => setSearchQuery("")}
                        >
                          Xóa tìm kiếm
                        </Button>
                      )}
                  </div>
                )}
              </section>

              {/* Book Shelves */}
              <BookShelf
                title="Đang đọc"
                subtitle={`${filterBooks(displayReadingBooks).length} cuốn sách`}
                books={filterBooks(displayReadingBooks)}
                type="reading"
                showAddButton={true}
              />

              <BookShelf
                title="Đã hoàn thành"
                subtitle={`${filterBooks(displayCompletedBooks).length} cuốn sách`}
                books={filterBooks(displayCompletedBooks)}
                type="completed"
              />

              <BookShelf
                title="Sách muốn đọc"
                subtitle={`${filterBooks(displaySavedBooks).length} cuốn sách`}
                books={filterBooks(displaySavedBooks)}
                type="saved"
              />

              <BookShelf
                title="Khám phá từ cộng đồng"
                subtitle="Gợi ý sách phổ biến"
                books={demoExploreBooks}
                type="explore"
                showViewAll={true}
              />

              {loading && (
                <div className="text-sm text-muted-foreground mt-4">
                  Đang tải dữ liệu...
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;