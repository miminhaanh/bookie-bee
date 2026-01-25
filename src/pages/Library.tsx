import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Search, Grid, List, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import type { BookStatus } from "@/hooks/useBooks";

interface BookWithProgress {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  progress: number | null;
  status: BookStatus | null;
  format: string | null;
  total_pages: number | null;
  current_page: number | null;
}

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [books, setBooks] = useState<BookWithProgress[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<BookStatus | "all">("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    fetchBooks();
  }, [user, navigate]);

  const fetchBooks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("books")
        .select("id,title,author,cover_url,progress,status,format,total_pages,current_page")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const booksData = (data ?? []) as BookWithProgress[];
      setBooks(booksData);
      filterBooks(booksData, searchQuery, filterStatus);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sách",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = (
    booksToFilter: BookWithProgress[],
    query: string,
    status: BookStatus | "all"
  ) => {
    let filtered = booksToFilter;

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(q) ||
          (book.author?.toLowerCase() ?? "").includes(q)
      );
    }

    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((book) => book.status === status);
    }

    setFilteredBooks(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterBooks(books, query, filterStatus);
  };

  const handleStatusFilter = (status: BookStatus | "all") => {
    setFilterStatus(status);
    filterBooks(books, searchQuery, status);
  };

  const handleReadBook = (bookId: string) => {
    navigate(`/read/${bookId}`);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa sách này?")) return;

    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setBooks(books.filter((b) => b.id !== bookId));
      filterBooks(
        books.filter((b) => b.id !== bookId),
        searchQuery,
        filterStatus
      );

      toast({
        title: "Thành công",
        description: "Sách đã được xóa",
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa sách",
        variant: "destructive",
      });
    }
  };

  const statuses: Array<{ value: BookStatus | "all"; label: string }> = [
    { value: "all", label: "Tất cả" },
    { value: "reading", label: "Đang đọc" },
    { value: "completed", label: "Hoàn thành" },
    { value: "to_read", label: "Sẽ đọc" },
  ];

  return (
    <DashboardLayout mobileTitle="Thư viện">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-warm-pink" />
              Thư viện của tôi
            </h1>
            <p className="text-muted-foreground">
              Bạn có {books.length} cuốn sách trong thư viện
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-card/80 border-border/50 focus:border-warm-pink"
              />
            </div>

            {/* Status Filter and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-2 flex-wrap">
                {statuses.map((status) => (
                  <Button
                    key={status.value}
                    variant={filterStatus === status.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilter(status.value)}
                    className={
                      filterStatus === status.value
                        ? "bg-warm-pink text-white"
                        : "border-border/50"
                    }
                  >
                    {status.label}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-warm-pink" : ""}
                >
                  <Grid className="w-5 h-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-warm-pink" : ""}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Books Display */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-warm-pink" />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                {books.length === 0
                  ? "Bạn chưa có sách nào. Hãy thêm sách mới!"
                  : "Không tìm thấy sách phù hợp"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="group rounded-lg overflow-hidden border border-border/50 hover:border-warm-pink transition-all hover:shadow-lg"
                >
                  {/* Cover Image */}
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gradient-to-br from-warm-pink/20 to-coral/20 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-warm-pink/50" />
                    </div>
                  )}

                  {/* Book Info */}
                  <div className="p-4 bg-card space-y-2">
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-warm-pink transition-colors">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {book.author}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {book.status === "reading" && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">Tiến độ</span>
                          <span className="text-xs font-semibold text-warm-pink">
                            {Math.round((book.progress ?? 0) * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-warm-pink to-coral transition-all"
                            style={{ width: `${(book.progress ?? 0) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          book.status === "reading"
                            ? "bg-blue-100 text-blue-700"
                            : book.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {book.status === "reading"
                          ? "Đang đọc"
                          : book.status === "completed"
                            ? "Hoàn thành"
                            : "Sẽ đọc"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-warm-pink hover:bg-warm-pink/90 text-white"
                        onClick={() => handleReadBook(book.id)}
                      >
                        Đọc
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteBook(book.id)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-warm-pink group transition-all"
                >
                  {/* Cover Thumbnail */}
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gradient-to-br from-warm-pink/20 to-coral/20 rounded flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-warm-pink/50" />
                    </div>
                  )}

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-warm-pink transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    )}

                    {/* Progress */}
                    {book.status === "reading" && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Tiến độ</span>
                          <span className="text-xs font-semibold text-warm-pink">
                            {book.current_page}/{book.total_pages} trang
                            ({Math.round((book.progress ?? 0) * 100)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-warm-pink to-coral"
                            style={{ width: `${(book.progress ?? 0) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          book.status === "reading"
                            ? "bg-blue-100 text-blue-700"
                            : book.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {book.status === "reading"
                          ? "Đang đọc"
                          : book.status === "completed"
                            ? "Hoàn thành"
                            : "Sẽ đọc"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 justify-center">
                    <Button
                      size="sm"
                      className="bg-warm-pink hover:bg-warm-pink/90 text-white"
                      onClick={() => handleReadBook(book.id)}
                    >
                      Đọc
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBook(book.id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Library;
