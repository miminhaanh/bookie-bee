import { Clock } from "lucide-react";
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
  const estimatedMinutes = remainingPages !== null ? Math.round(remainingPages * 1.5) : null;
  const estimatedHoursRaw = estimatedMinutes !== null ? estimatedMinutes / 60 : null;
  const estimatedHoursDisplay =
    typeof estimatedHoursRaw === "number"
      ? Math.max(0.1, estimatedHoursRaw >= 10 ? Math.round(estimatedHoursRaw) : Math.round(estimatedHoursRaw * 10) / 10)
      : null;

  return (
    <div>
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
  );
}
