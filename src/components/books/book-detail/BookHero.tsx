import { Sparkles, BookOpen, User, Clock, Star } from "lucide-react";
import type { Book } from "@/hooks/useBooks";
import { ModernBookCover } from "../ModernBookCover";
import { useMemo } from "react";

interface BookHeroProps {
  book: Book;
}

export function BookHero({ book }: BookHeroProps) {
  const totalPages = book.total_pages || 0;
  const estimatedHours = totalPages ? Math.max(1, Math.round(totalPages / 60)) : null;

  const coverColor = useMemo(() => {
    const source = book?.id ?? "default";
    const hash = Array.from(source).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const colors = ["zinc", "slate", "indigo", "violet", "emerald", "rose"] as const;
    return colors[hash % colors.length];
  }, [book?.id]);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
      {/* Book Cover */}
      <div className="lg:col-span-1 flex justify-center lg:justify-start">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/25 via-accent/15 to-secondary/20 rounded-3xl blur-2xl opacity-70 group-hover:opacity-90 transition-opacity" />

          <div className="relative transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
            <ModernBookCover
              size="lg"
              radius="lg"
              color={coverColor}
              coverImage={book.cover_url}
              className="drop-shadow-2xl"
            >
              {!book.cover_url && (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm uppercase tracking-[0.3em] text-primary-foreground/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" strokeWidth={1.5} />
                    <BookOpen className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs">Chưa có bìa</span>
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
              {book.genre || "Văn học"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
            {book.title}
          </h1>
          <div className="flex items-center gap-2 text-lg text-muted-foreground">
            <User className="w-5 h-5 text-primary" />
            <span>{book.author || "Tác giả ẩn danh"}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          {totalPages > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-medium">{totalPages} trang</span>
            </div>
          )}
          {estimatedHours && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
              <Clock className="w-5 h-5 text-secondary" />
              <span className="font-medium">~{estimatedHours} giờ đọc</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur">
            <Star className="w-5 h-5 text-accent" />
            <span className="font-medium">4.8/5</span>
          </div>
        </div>

        {/* Tags */}
        {book.genre && (
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 text-sm bg-muted/80 text-muted-foreground rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
              #{book.genre}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
