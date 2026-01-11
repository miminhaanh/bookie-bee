import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Heart,
  Highlighter,
  List,
  Loader2,
  MoreVertical,
  Play,
  Share2,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { BookDescription, BookTitle, ModernBookCover } from "@/components/ModernBookCover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, type TocItem } from "@/hooks/useBooks";
import { useHighlights } from "@/hooks/useHighlights";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TocRow = { chapter: number; title: string; page: number };

const demoToc: TocRow[] = [
  { chapter: 1, title: "Mở đầu - Giấc mơ lặp lại", page: 1 },
  { chapter: 2, title: "Người phụ nữ Gypsy", page: 15 },
  { chapter: 3, title: "Gặp gỡ nhà vua", page: 35 },
  { chapter: 4, title: "Hành trình qua sa mạc", page: 65 },
  { chapter: 5, title: "Oasis và tình yêu", page: 98 },
  { chapter: 6, title: "Nhà Giả Kim", page: 130 },
  { chapter: 7, title: "Kho báu thực sự", page: 195 },
];

const highlightBgByColor: Record<string, string> = {
  yellow: "bg-highlight-yellow/30 border-highlight-yellow/40",
  blue: "bg-highlight-blue/30 border-highlight-blue/40",
  red: "bg-highlight-red/30 border-highlight-red/40",
};

const formatViDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
};

const normalizeTocItems = (raw: unknown): TocItem[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((v): TocItem | null => {
      if (!v || typeof v !== "object") return null;
      const obj = v as { title?: unknown; page?: unknown; items?: unknown };
      if (typeof obj.title !== "string") return null;
      const page = typeof obj.page === "number" ? obj.page : null;
      const items = normalizeTocItems(obj.items);
      return { title: obj.title, page, items };
    })
    .filter((v): v is TocItem => !!v);
};

const flattenToc = (items: TocItem[]): TocRow[] => {
  const rows: TocRow[] = [];
  const walk = (nodes: TocItem[]) => {
    for (const n of nodes) {
      if (typeof n.page === "number") {
        rows.push({ chapter: rows.length + 1, title: n.title, page: n.page });
      }
      if (Array.isArray(n.items) && n.items.length > 0) {
        walk(n.items);
      }
    }
  };

  walk(items);
  return rows;
};

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { books, deleteBook, updateBook, isLoading: booksLoading } = useBooks();
  const { highlights, isLoading: highlightsLoading, deleteHighlight } = useHighlights(id);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const book = useMemo(() => books.find((b) => b.id === id), [books, id]);

  const demoBook = useMemo(
    () => ({
      id: id || "1",
      title: "Nhà Giả Kim",
      author: "Paulo Coelho",
      cover_url: null as string | null,
      description:
        "Nhà giả kim là tiểu thuyết của nhà văn người Brasil Paulo Coelho. Cuốn sách viết về hành trình của chàng chăn cừu Santiago đến các Kim tự tháp Ai Cập trong hành trình tìm kiếm kho báu. Trên đường đi, anh gặp một người phụ nữ Gypsy, một người đàn ông tự xưng là vua, và một nhà giả kim thuật, tất cả đều chỉ dẫn anh theo những cách khác nhau.",
      category: "Văn học",
      total_pages: 228,
      tags: ["Triết học", "Tâm linh", "Phiêu lưu", "Cuộc sống"],
      created_at: "2024-01-01",
      updated_at: "2024-01-10",
    }),
    [id]
  );

  const title = book?.title ?? demoBook.title;
  const author = book?.author ?? demoBook.author;
  const coverUrl = book?.cover_url ?? demoBook.cover_url;
  const description = book?.description ?? demoBook.description;
  const category = book?.genre ?? demoBook.category;
  const totalPages = book?.total_pages ?? demoBook.total_pages;
  const currentPage = typeof book?.current_page === "number" ? book.current_page : 0;
  const progressPct = typeof book?.progress === "number" ? Math.max(0, Math.min(100, book.progress)) : 0;

  const startedAt = book?.created_at ?? demoBook.created_at;
  const lastReadAt = book?.updated_at ?? demoBook.updated_at;

  const estimatedMinutes = typeof book?.estimated_time_remaining === "number"
    ? Math.round(book.estimated_time_remaining / 60)
    : null;

  const tags = useMemo(() => {
    const fromBook = book?.genre ? [book.genre] : [];
    return fromBook.length > 0 ? fromBook : demoBook.tags;
  }, [book?.genre, demoBook.tags]);

  const tableOfContents = useMemo(() => {
    const normalized = normalizeTocItems(book?.toc);
    const flattened = flattenToc(normalized);
    return flattened.length > 0 ? flattened : demoToc;
  }, [book?.toc]);

  const handleDelete = async () => {
    if (!book) return;
    try {
      await deleteBook.mutateAsync(book.id);
      toast({
        title: "Đã xóa sách",
        description: `"${book.title}" đã được xóa khỏi thư viện`,
      });
      navigate("/");
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sách",
        variant: "destructive",
      });
    }
  };

  const handleStartReading = async () => {
    if (!book) {
      toast({
        title: "Không thể mở sách",
        description: "Sách không tồn tại trong thư viện của bạn.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (book.status === "to_read") {
        await updateBook.mutateAsync({ id: book.id, status: "reading" });
      }
      navigate(`/read/${book.id}`);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể mở trình đọc",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      const nav = navigator as Navigator & {
        share?: (data: { title?: string; url?: string }) => Promise<void>;
        clipboard?: { writeText?: (text: string) => Promise<void> };
      };

      if (typeof nav.share === "function") {
        await nav.share({ title, url });
        return;
      }

      if (typeof nav.clipboard?.writeText === "function") {
        await nav.clipboard.writeText(url);
        toast({ title: "Đã sao chép link", description: "Dán để chia sẻ với bạn bè." });
      }
    } catch {
      // Ignore share cancellation
    }
  };

  if (authLoading || booksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If we can't find the book in the user's library, still show the sample layout.
  const canRead = !!book && (!!book.file_url || !!book.is_from_library);

  const coverColor = useMemo(() => {
    const source = book?.id ?? demoBook.id;
    const hash = Array.from(source).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const colors = ["zinc", "slate", "indigo", "violet", "emerald", "rose"] as const;
    return colors[hash % colors.length];
  }, [book?.id, demoBook.id]);

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/25 to-accent/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-secondary/25 to-primary/10 rounded-full blur-3xl animate-pulse [animation-delay:250ms]" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-accent/25 to-secondary/10 rounded-full blur-3xl animate-pulse [animation-delay:500ms]" />
        <div className="absolute bottom-40 left-1/3 w-60 h-60 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>

          {book && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa sách
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Book Cover */}
          <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/25 via-accent/15 to-secondary/20 rounded-3xl blur-2xl opacity-70 group-hover:opacity-90 transition-opacity" />

              <div className="relative transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
                <ModernBookCover
                  size="lg"
                  radius="lg"
                  color={coverColor}
                  coverImage={coverUrl}
                  className="drop-shadow-2xl"
                >
                  {!coverUrl && (
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 opacity-90" />
                        <span className="text-[10px] uppercase tracking-wider opacity-90">
                          {category || "Văn học"}
                        </span>
                      </div>
                      <BookTitle className="text-xl text-white">{title}</BookTitle>
                      <BookDescription className="text-white/80">{author}</BookDescription>
                    </div>
                  )}
                </ModernBookCover>
              </div>
            </div>
          </div>

          {/* Book Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-primary/15 to-accent/10 text-primary rounded-full border border-primary/20">
                  {category || "Văn học"}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 leading-tight">{title}</h1>
              <div className="flex items-center gap-2 text-lg text-muted-foreground">
                <User className="w-5 h-5 text-primary" />
                <span>{author}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium">{totalPages} trang</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="font-medium">
                  {estimatedMinutes ? `~${Math.max(1, Math.round(estimatedMinutes / 60))} giờ đọc` : "~4 giờ đọc"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
                <Star className="w-5 h-5 text-accent" />
                <span className="font-medium">4.8/5</span>
              </div>
            </div>

            {/* Progress */}
            <div className="rounded-2xl p-6 space-y-4 border border-border/60 bg-card/60 backdrop-blur">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Tiến độ đọc
                </h3>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {Math.round(progressPct)}%
                </span>
              </div>

              <Progress value={progressPct} className="h-3 bg-muted" />

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Trang {currentPage} / {totalPages}
                </span>
                <span>Còn {Math.max(0, totalPages - currentPage)} trang</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={handleStartReading}
                disabled={!canRead}
              >
                <Play className="w-5 h-5" />
                Tiếp tục đọc
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "gap-2 rounded-xl transition-all",
                  isLiked && "bg-primary/10 border-primary/30 text-primary"
                )}
                onClick={() => setIsLiked((v) => !v)}
              >
                <Heart className={cn("w-5 h-5", isLiked && "fill-primary")}
                />
                {isLiked ? "Đã thích" : "Yêu thích"}
              </Button>
              <Button variant="outline" size="lg" className="gap-2 rounded-xl" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
                Chia sẻ
              </Button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm bg-muted/80 text-muted-foreground rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Introduction */}
          <div className="rounded-3xl p-6 space-y-4 border border-border/60 bg-card/60 backdrop-blur">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Giới thiệu</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                "Khi bạn thực sự khao khát một điều gì đó, cả vũ trụ sẽ hợp sức giúp bạn đạt được nó." - Paulo Coelho
              </p>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="rounded-3xl p-6 space-y-4 border border-border/60 bg-card/60 backdrop-blur">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                <List className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Mục lục</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {tableOfContents.map((item, i) => {
                const isCurrentChapter =
                  currentPage >= item.page &&
                  (i === tableOfContents.length - 1 || currentPage < tableOfContents[i + 1].page);

                return (
                  <div
                    key={`${item.chapter}-${item.page}`}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                      isCurrentChapter
                        ? "bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/25"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => navigate(`/read/${book?.id || demoBook.id}?page=${item.page}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                          isCurrentChapter
                            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.chapter}
                      </span>
                      <span className={cn("font-medium", isCurrentChapter ? "text-foreground" : "text-muted-foreground")}>
                        {item.title}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">Trang {item.page}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="rounded-3xl p-6 border border-border/60 bg-card/60 backdrop-blur mb-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Highlighter className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Highlights</h2>
                <p className="text-sm text-muted-foreground">Lưu lại những đoạn bạn thích</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => navigate(`/notes?bookId=${book?.id || demoBook.id}`)}
            >
              Xem tất cả ({highlights.length})
            </Button>
          </div>

          {highlightsLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải highlights…
            </div>
          ) : highlights.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Chưa có highlight nào</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highlights.slice(0, 6).map((h) => (
                <div
                  key={h.id}
                  className={cn(
                    "relative rounded-2xl border p-4",
                    highlightBgByColor[h.color] ?? "bg-muted/30 border-border"
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => deleteHighlight.mutate(h.id)}
                    aria-label="Xóa highlight"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <button
                    type="button"
                    className="text-left w-full"
                    onClick={() => {
                      if (!book) return;
                      const page = typeof h.page_number === "number" ? h.page_number : undefined;
                      navigate(`/read/${book.id}${page ? `?page=${page}` : ""}`);
                    }}
                  >
                    <p className="text-sm text-foreground leading-relaxed">“{h.content}”</p>
                    {h.note && <p className="mt-2 text-xs text-muted-foreground italic">📝 {h.note}</p>}
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{h.page_number ? `Trang ${h.page_number}` : ""}</span>
                      <span>{formatViDate(h.created_at)}</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reading History */}
        <div className="rounded-3xl p-6 border border-border/60 bg-card/60 backdrop-blur">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Lịch sử đọc</h2>
              <p className="text-sm text-muted-foreground">Theo dõi hành trình đọc của bạn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/15">
              <p className="text-sm text-muted-foreground mb-1">Bắt đầu</p>
              <p className="font-bold text-foreground">{formatViDate(startedAt)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/15">
              <p className="text-sm text-muted-foreground mb-1">Gần nhất</p>
              <p className="font-bold text-foreground">{formatViDate(lastReadAt)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/15">
              <p className="text-sm text-muted-foreground mb-1">Ước tính còn lại</p>
              <p className="font-bold text-foreground">
                {estimatedMinutes ? `${estimatedMinutes} phút` : "-"}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sách này?</AlertDialogTitle>
            <AlertDialogDescription>
              {book ? `"${book.title}" sẽ bị xóa khỏi thư viện của bạn. Hành động này không thể hoàn tác.` : "Hành động này không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookDetail;