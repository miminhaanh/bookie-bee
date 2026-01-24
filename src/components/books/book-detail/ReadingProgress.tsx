interface ReadingProgressProps {
  currentPage: number;
  totalPages: number;
}

export function ReadingProgress({ currentPage, totalPages }: ReadingProgressProps) {
  if (totalPages <= 0) return null;

  const percentage = Math.min(100, Math.round((currentPage / totalPages) * 100));

  return (
    <section className="space-y-3 border-b border-[#E5E5E5] pb-8">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-[#111]">Tiến độ đọc</span>
        <span className="text-[#666]">{percentage}%</span>
      </div>

      <div className="h-[3px] w-full rounded-full bg-[#E5E5E5]">
        <div
          className="h-full rounded-full bg-[#111] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-[#666]">Đã đọc {currentPage} / {totalPages} trang</p>
    </section>
  );
}
