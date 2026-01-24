interface ReadingProgressProps {
  currentPage: number;
  totalPages: number;
}

export function ReadingProgress({ currentPage, totalPages }: ReadingProgressProps) {
  if (totalPages <= 0) return null;

  const percentage = Math.min(100, Math.round((currentPage / totalPages) * 100));

  return (
    <section className="space-y-3 border-b border-[#F0E6DB] pb-9">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-[#3B2A1E]">Tiến độ đọc</span>
        <span className="text-[#9A7D65]">{percentage}%</span>
      </div>

      <div className="h-[4px] w-full rounded-full bg-[#F5E9DC]">
        <div
          className="h-full rounded-full bg-[#F26B3A] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-[#7B6658]">Đã đọc {currentPage} / {totalPages} trang</p>
    </section>
  );
}
