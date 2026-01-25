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
  const [stats, setStats] = useState<ReadingStats>({
    totalBooks: 0,
    completedBooks: 0,
    readingBooks: 0,
    readingStreak: 0,
  });
  const [currentlyReading, setCurrentlyReading] = useState<BookWithProgress[]>([]);
  const [completedBooks, setCompletedBooks] = useState<BookWithProgress[]>([]);
  const [savedBooks, setSavedBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
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

  // Demo data when no real books
  const demoReadingBooks: BookWithProgress[] = [
    { id: "1", title: "Nhà Giả Kim", author: "Paulo Coelho", cover_url: null, progress: 65, status: "reading" },
    { id: "2", title: "Đắc Nhân Tâm", author: "Dale Carnegie", cover_url: null, progress: 30, status: "reading" },
    { id: "3", title: "Tâm Lý Học Tội Phạm", author: "Nhiều tác giả", cover_url: null, progress: 15, status: "reading" },
  ];

  const demoCompletedBooks: BookWithProgress[] = [
    { id: "4", title: "Sapiens", author: "Yuval Noah Harari", cover_url: null, progress: 100, status: "completed" },
    { id: "5", title: "Atomic Habits", author: "James Clear", cover_url: null, progress: 100, status: "completed" },
  ];

  const demoSavedBooks: BookWithProgress[] = [
    { id: "6", title: "The Alchemist", author: "Paulo Coelho", cover_url: null, progress: 0, status: "to_read" },
    { id: "7", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", cover_url: null, progress: 0, status: "to_read" },
  ];

  const demoExploreBooks: BookWithProgress[] = [
    { id: "8", title: "Deep Work", author: "Cal Newport", cover_url: null, progress: 0, status: "to_read" },
    { id: "9", title: "7 Habits", author: "Stephen Covey", cover_url: null, progress: 0, status: "to_read" },
    { id: "10", title: "Zero to One", author: "Peter Thiel", cover_url: null, progress: 0, status: "to_read" },
  ];

  const displayReadingBooks = currentlyReading.length > 0 ? currentlyReading : demoReadingBooks;
  const displayCompletedBooks = completedBooks.length > 0 ? completedBooks : demoCompletedBooks;
  const displaySavedBooks = savedBooks.length > 0 ? savedBooks : demoSavedBooks;

  // Filter books based on search query
  const filterBooks = (books: BookWithProgress[]) => {
    if (!searchQuery) return books;
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

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
                            level={5}
                            xp={350}
                            xpToNextLevel={500}
                            avatarUrl={profileAvatarUrl}
                            displayName={profileDisplayName}
                          />
                  </div>

                  {/* Stats Cards */}
                  <div>
                    <StatsCards
                      totalBooks={stats.totalBooks || displayReadingBooks.length + displayCompletedBooks.length}
                      streak={stats.readingStreak}
                    />
                  </div>
                </div>
              </section>

              {/* Toolbar Section */}
              <section className="mb-8">
                <DashboardToolbar onSearch={setSearchQuery} />
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