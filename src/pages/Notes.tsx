import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Loader2, Filter, BookOpen, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { useHighlights, type Highlight } from "@/hooks/useHighlights";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const colorMap = {
  yellow: "bg-highlight-yellow",
  blue: "bg-highlight-blue",
  red: "bg-highlight-red",
};

const Notes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const initialSelectedBookId = searchParams.get("bookId") ?? "all";
  const [selectedBookId, setSelectedBookId] = useState<string>(initialSelectedBookId);
  
  const { user, loading: authLoading } = useAuth();
  const { highlights, isLoading: highlightsLoading, deleteHighlight } = useHighlights();
  const { books } = useBooks();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  // Filter highlights
  const filteredHighlights = highlights.filter((h) => {
    const matchesSearch = h.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.note?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBook = selectedBookId === "all" || h.book_id === selectedBookId;
    return matchesSearch && matchesBook;
  });

  // Group by date
  const groupedHighlights = filteredHighlights.reduce((acc, highlight) => {
    const date = format(new Date(highlight.created_at), "dd MMMM yyyy", { locale: vi });
    if (!acc[date]) acc[date] = [];
    acc[date].push(highlight);
    return acc;
  }, {} as Record<string, Highlight[]>);

  const getBookTitle = (bookId: string) => {
    return books.find((b) => b.id === bookId)?.title || "Sách không xác định";
  };

  return (
    <div className="min-h-screen bg-background pb-20 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Ghi chú của tôi</h1>
          <p className="text-sm text-muted-foreground">
            {highlights.length} highlights đã lưu
          </p>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm trong ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedBookId} onValueChange={setSelectedBookId}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Lọc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {books.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.title.slice(0, 20)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4">
        {highlightsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              {searchQuery ? "Không tìm thấy ghi chú" : "Chưa có ghi chú"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery 
                ? "Thử tìm kiếm với từ khóa khác" 
                : "Highlight văn bản khi đọc sách để lưu lại!"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHighlights).map(([date, items]) => (
              <div key={date}>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  {date}
                </h2>
                <div className="space-y-3">
                  {items.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="rounded-xl bg-card p-4 shadow-sm border border-border"
                    >
                      <div
                        className={cn(
                          "relative rounded-lg p-3 mb-3",
                          colorMap[highlight.color]
                        )}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-8 w-8"
                          onClick={() => deleteHighlight.mutate(highlight.id)}
                          aria-label="Xóa highlight"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <p className="text-sm text-foreground leading-relaxed">
                          "{highlight.content}"
                        </p>
                      </div>
                      
                      {highlight.note && (
                        <p className="text-sm text-muted-foreground mb-2 italic">
                          📝 {highlight.note}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">
                          {getBookTitle(highlight.book_id)}
                        </span>
                        {highlight.chapter && (
                          <span>Chương: {highlight.chapter}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Notes;