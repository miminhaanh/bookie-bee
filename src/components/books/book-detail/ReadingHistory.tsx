import { formatViDate } from "./utils";

interface ReadingHistoryProps {
  startedAt: string | null;
  lastReadAt: string | null;
  currentPage: number;
  totalPages: number;
}

export function ReadingHistory({
  startedAt,
  lastReadAt,
  currentPage,
  totalPages,
}: ReadingHistoryProps) {
  const remainingPages = totalPages > 0 ? Math.max(0, totalPages - currentPage) : null;
  const estimatedMinutes = remainingPages !== null ? remainingPages : 0;
  const hours = Math.floor(estimatedMinutes / 60);
  const mins = estimatedMinutes % 60;

  return (
    <section className="space-y-4 border-b border-[#E5E5E5] pb-10">
      <h3 className="text-base font-semibold text-[#111]">Lịch sử đọc</h3>
      <div className="grid gap-6 text-sm text-[#666] sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-[#999]">Bắt đầu</p>
          <p className="text-lg font-semibold text-[#111]">{formatViDate(startedAt)}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-[#999]">Gần nhất</p>
          <p className="text-lg font-semibold text-[#111]">{formatViDate(lastReadAt)}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-[#999]">Ước tính còn lại</p>
          <p className="text-lg font-semibold text-[#111]">
            {remainingPages === null
              ? "-"
              : remainingPages <= 0
                ? "Đã hoàn thành"
                : `${hours > 0 ? `${hours}h ` : ""}${mins > 0 ? `${mins}phút` : ""}`}
          </p>
        </div>
      </div>
    </section>
  );
}
