import { Sparkles, BookOpen } from "lucide-react";
import type { Book } from "@/hooks/useBooks";

interface BookHeroProps {
  book: Book;
}

export function BookHero({ book }: BookHeroProps) {
  const totalPages = book.total_pages || 0;
  const estimatedHours = totalPages ? Math.max(1, Math.round(totalPages / 60)) : null;

  return (
    <section className="grid gap-10 border-b border-[#F0E6DB] pb-12 md:grid-cols-[230px,1fr]">
      <div className="w-full max-w-[230px]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-[10px] border border-[#F1E4D4] bg-[#FEF8F0] shadow-[0_12px_30px_rgba(107,70,35,0.08)]">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm uppercase tracking-[0.3em] text-[#B08863]">
              <div className="flex items-center gap-2 text-[#D79C60]">
                <Sparkles className="h-5 w-5" strokeWidth={1.5} />
                <BookOpen className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span>Chưa có ảnh bìa</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#B37A5B]">Sách</p>
          <h1 className="mt-3 text-[30px] font-semibold leading-[1.25] text-[#2D1F16]">
            {book.title}
          </h1>
          <p className="text-base text-[#7B6658]">{book.author || "Tác giả ẩn danh"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-[#806E64]">
          {totalPages > 0 && <span className="font-medium text-[#2D1F16]">{totalPages} trang</span>}
          {totalPages > 0 && estimatedHours && (
            <>
              <span className="text-[#D8C7B4]">•</span>
              <span>~{estimatedHours} giờ đọc</span>
            </>
          )}
          {book.genre && (
            <>
              <span className="text-[#D8C7B4]">•</span>
              <span>{book.genre}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
