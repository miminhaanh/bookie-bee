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
  MessageCircle,
  MoreVertical,
  Pencil,
  Play,
  Share2,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { BookDescription, BookTitle, ModernBookCover } from "@/components/books/ModernBookCover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type TocRowV2 = { label: string; title: string; page: number; depth: number };

const toRoman = (num: number) => {
  if (!Number.isFinite(num) || num <= 0) return "";
  const romans: Array<{ value: number; symbol: string }> = [
    { value: 1000, symbol: "M" },
    { value: 900, symbol: "CM" },
    { value: 500, symbol: "D" },
    { value: 400, symbol: "CD" },
    { value: 100, symbol: "C" },
    { value: 90, symbol: "XC" },
    { value: 50, symbol: "L" },
    { value: 40, symbol: "XL" },
    { value: 10, symbol: "X" },
    { value: 9, symbol: "IX" },
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 1, symbol: "I" },
  ];

  let n = Math.floor(num);
  let out = "";
  for (const r of romans) {
    while (n >= r.value) {
      out += r.symbol;
      n -= r.value;
    }
  }
  return out;
};

const highlightBgByColor: Record<string, string> = {
  yellow: "bg-highlight-yellow/30 border-highlight-yellow/40",
  blue: "bg-highlight-blue/30 border-highlight-blue/40",
  red: "bg-highlight-red/30 border-highlight-red/40",
};

const GENRES = [
  "Văn học", "Self-help", "Kinh doanh", "Khoa học",
  "Lịch sử", "Tâm lý", "Truyện ngắn", "Tiểu thuyết",
] as const;

type BookPrivacy = "private" | "link" | "public";
const PRIVACY_OPTIONS: Array<{ value: BookPrivacy; label: string; desc: string }> = [
  { value: "private", label: "Riêng tư", desc: "Chỉ mình bạn xem được" },
  { value: "link", label: "Chia sẻ link", desc: "Ai có link đều xem được" },
  { value: "public", label: "Công khai", desc: "Hiển thị trong cộng đồng" },
];

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

const flattenToc = (items: TocItem[]): TocRowV2[] => {
  const rows: TocRowV2[] = [];
  const walk = (nodes: TocItem[], depth: number, prefix: string | null) => {
    let localIndex = 0;
    for (const n of nodes) {
      localIndex += 1;
      const label = depth === 0 ? toRoman(localIndex) : prefix ? `${prefix}.${localIndex}` : `${localIndex}`;
      if (typeof n.page === "number") {
        rows.push({ label, title: n.title, page: n.page, depth });
      }
      if (Array.isArray(n.items) && n.items.length > 0) {
        walk(n.items, depth + 1, depth === 0 ? null : label);
      }
    }
  };
  walk(items, 0, null);
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGenre, setEditGenre] = useState<string>("none");
  const [editPrivacy, setEditPrivacy] = useState<BookPrivacy>("private");

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/auth?returnUrl=${returnUrl}`, { replace: true });
    }
  }, [authLoading, user, navigate]);

  const book = useMemo(() => books.find((b) => b.id === id), [books, id]);

  const title = book?.title ?? "Sách không tên";
  const author = book?.author ?? "Tác giả ẩn danh";
  const coverUrl = book?.cover_url ?? null;
  const description = book?.description ?? "Chưa có giới thiệu.";
  const category = book?.genre ?? "Khác";
  const rawTotalPages = typeof book?.total_pages === "number" ? book.total_pages : null;
  const totalPages = rawTotalPages && rawTotalPages > 0 ? rawTotalPages : null;
  const currentPage = typeof book?.current_page === "number" ? book.current_page : 0;
  const progressPct = typeof book?.progress === "number" ? Math.max(0, Math.min(100, book.progress)) : 0;

  const startedAt = book?.created_at;
  const lastReadAt = book?.updated_at;

  const remainingPages = typeof totalPages === "number" ? Math.max(0, totalPages - currentPage) : null;
  const estimatedMinutes = typeof remainingPages === "number" ? Math.round(remainingPages * 1.5) : null;
  const estimatedHoursRaw = typeof estimatedMinutes === "number" ? estimatedMinutes / 60 : null;
  const estimatedHoursDisplay =
    typeof estimatedHoursRaw === "number"
      ? Math.max(
        0.1,
        estimatedHoursRaw >= 10 ? Math.round(estimatedHoursRaw) : Math.round(estimatedHoursRaw * 10) / 10,
      )
      : null;

  const tags = useMemo(() => {
    return book?.genre ? [book.genre] : [];
  }, [book?.genre]);

  const tableOfContents = useMemo(() => {
    const normalized = normalizeTocItems(book?.toc);
    return flattenToc(normalized);
  }, [book?.toc]);

  const openEditDialog = () => {
    if (!book) return;

    setEditTitle(book.title ?? "");
    setEditAuthor(book.author ?? "");
    setEditDescription(book.description ?? "");
    setEditGenre(book.genre ? book.genre : "none");

    const validPrivacy = ["private", "link", "public"];
    const currentVis = book.visibility as BookPrivacy | null;
    setEditPrivacy(currentVis && validPrivacy.includes(currentVis) ? currentVis : "private");

    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!book) return;

    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập Tên sách.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateBook.mutateAsync({
        id: book.id,
        title: nextTitle,
        author: editAuthor.trim() ? editAuthor.trim() : null,
        description: editDescription.trim() ? editDescription.trim() : null,
        genre: editGenre !== "none" && editGenre.trim() ? editGenre.trim() : null,
        visibility: editPrivacy,
      });

      toast({
        title: "Đã cập nhật",
        description: "Thông tin sách đã được lưu.",
      });
      setIsEditOpen(false);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật sách.",
        variant: "destructive",
      });
    }
  };

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

  const coverColor = useMemo(() => {
    const source = book?.id ?? "unknown";
    const hash = Array.from(source).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const colors = ["zinc", "slate", "indigo", "violet", "emerald", "rose"] as const;
    return colors[hash % colors.length];
  }, [book?.id]);

  if (authLoading || booksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const canRead = !!book && (!!book.file_url || !!book.is_from_library);

  if (!book && !booksLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Không tìm thấy sách</h2>
        <p className="text-muted-foreground mb-6">Cuốn sách này có thể đã bị xóa hoặc không tồn tại.</p>
        <Button onClick={() => navigate("/")} variant="default">Quay về trang chủ</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-warm-pink/30 to-coral/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-lavender/30 to-sky/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-sage/30 to-soft-sage/20 rounded-full blur-3xl animate-bounce-soft" />
        <div className="absolute bottom-40 left-1/3 w-60 h-60 bg-gradient-to-br from-peach/30 to-soft-pink/20 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-4 py-6">
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
                <DropdownMenuItem onClick={openEditDialog}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa sách
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
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

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium">{typeof totalPages === "number" ? `${totalPages} trang` : "- trang"}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="font-medium">
                  {typeof estimatedHoursDisplay === "number" ? `~${estimatedHoursDisplay} giờ đọc` : "~4 giờ đọc"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
                <Star className="w-5 h-5 text-accent" />
                <span className="font-medium">4.8/5</span>
              </div>
            </div>

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
                  Trang {currentPage} / {typeof totalPages === "number" ? totalPages : "-"}
                </span>
                <span>
                  Còn {typeof totalPages === "number" ? Math.max(0, totalPages - currentPage) : "-"} trang
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={handleStartReading}
                disabled={!canRead}
              >
                <Play className="w-5 h-5" />
                {!canRead ? "Thêm file để đọc" : "Tiếp tục đọc"}
              </Button>
              {!canRead && (
                <div className="w-full">
                  <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Sách này chưa có file. Vui lòng tải lên file PDF/EPUB để đọc.</span>
                  </p>
                </div>
              )}
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
              <Button
                variant="outline"
                size="lg"
                className="gap-2 rounded-xl"
                onClick={openEditDialog}
                disabled={!book}
              >
                <Pencil className="w-5 h-5" />
                Chỉnh sửa
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="gap-2 rounded-xl text-muted-foreground hover:text-red-500"
                onClick={() => navigate('/help')}
              >
                <MessageCircle className="w-5 h-5" />
                Báo lỗi
              </Button>
            </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="rounded-3xl p-6 space-y-4 border border-border/60 bg-card/60 backdrop-blur">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender to-sky flex items-center justify-center">
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

          <div className="rounded-3xl p-6 space-y-4 border border-border/60 bg-card/60 backdrop-blur">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage to-soft-sage flex items-center justify-center">
                <List className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Mục lục</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {tableOfContents.length > 0 ? tableOfContents.map((item, i) => {
                const isCurrentChapter =
                  currentPage >= item.page &&
                  (i === tableOfContents.length - 1 || currentPage < tableOfContents[i + 1].page);

                return (
                  <div
                    key={`${item.label}-${item.page}`}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                      item.depth > 0 && "pl-10",
                      isCurrentChapter
                        ? "bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/25"
                        : item.depth === 0
                          ? "bg-warm-pink/10 border border-warm-pink/20 hover:bg-warm-pink/15"
                          : "hover:bg-muted/50"
                    )}
                    onClick={() => navigate(`/read/${book?.id}?page=${item.page}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-lg flex items-center justify-center font-bold",
                          item.depth === 0 ? "w-8 h-8 text-sm tracking-wide" : "w-7 h-7 text-xs",
                          isCurrentChapter
                            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          item.depth > 0 && "pl-1",
                          isCurrentChapter ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">Trang {item.page}</span>
                  </div>
                );
              }) : (
                <p className="text-muted-foreground text-center py-4">Chưa có mục lục.</p>
              )}
            </div>
          </div>
        </div>

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
              onClick={() => navigate(`/notes?bookId=${book?.id}`)}
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
            <div className="p-4 rounded-xl bg-gradient-to-br from-soft-pink/50 to-transparent border border-warm-pink/20">
              <p className="text-sm text-muted-foreground mb-1">Bắt đầu</p>
              <p className="font-bold text-foreground">{formatViDate(startedAt)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-soft-sage/50 to-transparent border border-sage/20">
              <p className="text-sm text-muted-foreground mb-1">Gần nhất</p>
              <p className="font-bold text-foreground">{formatViDate(lastReadAt)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-lavender/30 to-transparent border border-lavender/20">
              <p className="text-sm text-muted-foreground mb-1">Ước tính còn lại</p>
              <p className="font-bold text-foreground">
                {typeof estimatedHoursDisplay === "number" ? `~${estimatedHoursDisplay} giờ` : "-"}
              </p>
            </div>
          </div>
        </div>
      </main>

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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sách</DialogTitle>
            <DialogDescription>Cập nhật thông tin sách của bạn.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-foreground font-semibold">
                Tên sách *
              </Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Nhập tên sách..."
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-author" className="text-foreground font-semibold">
                  Tác giả
                </Label>
                <Input
                  id="edit-author"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  placeholder="Tên tác giả..."
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Thể loại</Label>
                <Select value={editGenre} onValueChange={setEditGenre}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Chọn thể loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn</SelectItem>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-foreground font-semibold">
                Mô tả
              </Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Viết vài dòng giới thiệu..."
                className="min-h-[120px] rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Quyền riêng tư</Label>
              <Select value={editPrivacy} onValueChange={(v) => setEditPrivacy(v as BookPrivacy)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Chọn quyền riêng tư" />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="rounded-xl"
              disabled={!book || !editTitle.trim() || updateBook.isPending}
            >
              {updateBook.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookDetail;