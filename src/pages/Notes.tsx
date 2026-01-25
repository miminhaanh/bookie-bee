import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Loader2,
  Palette,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useHighlights } from "@/hooks/useHighlights";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const colorLabels: Record<string, { label: string; description: string }> = {
  yellow: { label: "Quan trọng", description: "Những đoạn cần ghi nhớ" },
  blue: { label: "Ghi nhớ", description: "Những câu trích dẫn hay" },
  red: { label: "Cảnh báo", description: "Những điểm cần lưu ý" },
};

const Notes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialBookId = searchParams.get("bookId") || "";

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterBook, setFilterBook] = useState<string | null>(initialBookId || null);

  const { books } = useBooks();
  const { highlights, isLoading, deleteHighlight } = useHighlights();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    // Keep deep-linking consistent: /notes?bookId=...
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (filterBook) next.set("bookId", filterBook);
      else next.delete("bookId");
      return next;
    });
  }, [filterBook, setSearchParams]);

  const bookById = useMemo(() => {
    const map = new Map<string, { title: string; author: string | null }>();
    for (const b of books) {
      map.set(b.id, { title: b.title, author: b.author ?? null });
    }
    return map;
  }, [books]);

  const highlightsWithBooks = useMemo(() => {
    return highlights.map((h) => {
      const book = bookById.get(h.book_id);
      return {
        ...h,
        book_title: book?.title ?? "Không rõ",
        book_author: book?.author ?? "Không rõ",
      };
    });
  }, [highlights, bookById]);

  const filteredHighlights = useMemo(() => {
    let filtered = [...highlightsWithBooks];

    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.content.toLowerCase().includes(q) ||
          h.note?.toLowerCase().includes(q) ||
          h.book_title?.toLowerCase().includes(q)
      );
    }

    if (filterColor) {
      filtered = filtered.filter((h) => h.color === filterColor);
    }

    if (filterBook) {
      filtered = filtered.filter((h) => h.book_id === filterBook);
    }

    return filtered;
  }, [highlightsWithBooks, searchKeyword, filterColor, filterBook]);

  const countsByColor = useMemo(() => {
    const counts: Record<string, number> = { yellow: 0, blue: 0, red: 0 };
    for (const h of filteredHighlights) {
      counts[h.color] = (counts[h.color] ?? 0) + 1;
    }
    return counts;
  }, [filteredHighlights]);

  const getColorClasses = (color: string) => {
    switch (color) {
      case "yellow":
        return "bg-highlight-yellow/30 border-highlight-yellow/40";
      case "blue":
        return "bg-highlight-blue/30 border-highlight-blue/40";
      case "red":
        return "bg-highlight-red/30 border-highlight-red/40";
      default:
        return "bg-muted/50 border-border";
    }
  };

  const getColorBadgeClasses = (color: string) => {
    switch (color) {
      case "yellow":
        return "bg-highlight-yellow text-foreground";
      case "blue":
        return "bg-highlight-blue text-foreground";
      case "red":
        return "bg-highlight-red text-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout mobileTitle="Highlights">
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 safe-area-top">
        <main className="container mx-auto px-4 pt-10 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/15 to-accent/10 mb-4 border border-border/60">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Bộ sưu tập của bạn</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-warm-pink via-coral to-peach bg-clip-text text-transparent mb-2">
            📝 Ghi chú & Highlight
          </h1>
          <p className="text-muted-foreground">Lưu giữ những khoảnh khắc đọc sách đáng nhớ</p>
        </div>

        {/* Color Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(colorLabels).map(([color, { label, description }]) => (
            <div
              key={color}
              className={cn(
                "p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md",
                getColorClasses(color),
                filterColor === color && "ring-2 ring-offset-2 ring-primary"
              )}
              onClick={() => setFilterColor((prev) => (prev === color ? null : color))}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full",
                    color === "yellow"
                      ? "bg-highlight-yellow"
                      : color === "blue"
                        ? "bg-highlight-blue"
                        : "bg-highlight-red"
                  )}
                />
                <span className="font-semibold text-foreground">{label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 mb-8 shadow-sm border border-border/60">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo nội dung, ghi chú..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <Select value={filterBook ?? "all"} onValueChange={(v) => setFilterBook(v === "all" ? null : v)}>
              <SelectTrigger className="w-full md:w-72 rounded-xl">
                <BookOpen className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tất cả sách" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sách</SelectItem>
                {books.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchKeyword || filterColor || filterBook) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchKeyword("");
                  setFilterColor(null);
                  setFilterBook(null);
                }}
                className="rounded-xl"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <StickyNote className="w-4 h-4" />
            <span>{filteredHighlights.length} ghi chú</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Palette className="w-4 h-4" />
            <span>Phân loại theo màu</span>
          </div>
          {Object.keys(colorLabels).map((color) => (
            <div key={color} className="flex items-center gap-2 text-sm">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  color === "yellow"
                    ? "bg-highlight-yellow"
                    : color === "blue"
                      ? "bg-highlight-blue"
                      : "bg-highlight-red"
                )}
              />
              <span className="text-muted-foreground">{countsByColor[color] ?? 0}</span>
            </div>
          ))}
        </div>

        {/* Highlights Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {highlights.length === 0 ? "Chưa có ghi chú nào" : "Không tìm thấy kết quả"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {highlights.length === 0
                ? "Bắt đầu đọc sách và highlight những đoạn hay nhé!"
                : "Thử thay đổi bộ lọc để xem thêm ghi chú"}
            </p>
            <Button onClick={() => navigate("/")} className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Khám phá thư viện
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className={cn(
                  "group p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                  getColorClasses(highlight.color)
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={cn("px-2 py-1 rounded-lg text-xs font-medium", getColorBadgeClasses(highlight.color))}>
                    {colorLabels[highlight.color]?.label || highlight.color}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteHighlight.mutate(highlight.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Xóa highlight"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm leading-relaxed mb-3 line-clamp-4 text-foreground">"{highlight.content}"</p>

                {highlight.note && (
                  <div className="bg-background/50 rounded-lg p-2 mb-3 border border-border/50">
                    <p className="text-xs italic text-muted-foreground">💭 {highlight.note}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-border/60 space-y-1">
                  <div
                    className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => navigate(`/book/${highlight.book_id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span className="truncate">{highlight.book_title}</span>
                    {highlight.page_number ? <span>• Trang {highlight.page_number}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(highlight.created_at), "dd MMM yyyy", { locale: vi })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Notes;