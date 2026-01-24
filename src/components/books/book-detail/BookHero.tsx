import type { Book } from "@/hooks/useBooks";

interface BookHeroProps {
  book: Book;
}

export function BookHero({ book }: BookHeroProps) {
  const totalPages = book.total_pages || 0;
  const estimatedHours = totalPages ? Math.max(1, Math.round(totalPages / 60)) : null;

  return (
    <section className="grid gap-8 border-b border-[#E5E5E5] pb-10 md:grid-cols-[220px,1fr]">
      <div className="w-full max-w-[220px]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-[4px] border border-[#E5E5E5] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-wider text-[#999]">
              Không có ảnh
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#666]">Sách</p>
          <h1 className="mt-2 text-[32px] font-semibold leading-[1.2] text-[#111]">
            {book.title}
          </h1>
          <p className="text-base text-[#666]">{book.author || "Tác giả ẩn danh"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[#666]">
          {totalPages > 0 && <span className="font-semibold text-[#111]">{totalPages} trang</span>}
          {totalPages > 0 && estimatedHours && (
            <>
              <span className="text-[#C7C7C7]">•</span>
              <span>~{estimatedHours} giờ đọc</span>
            </>
          )}
          {book.genre && (
            <>
              <span className="text-[#C7C7C7]">•</span>
              <span>{book.genre}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
