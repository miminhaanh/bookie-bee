import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  // Ước tính thời gian còn lại (tốc độ 250 từ/phút, mỗi trang ~250 từ → 1 phút/trang)
  const remainingPages = totalPages > 0 ? totalPages - currentPage : 0;
  const estimatedMinutes = remainingPages;
  const hours = Math.floor(estimatedMinutes / 60);
  const mins = estimatedMinutes % 60;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lịch sử đọc</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Bắt đầu</p>
            <p className="text-base font-semibold">{formatViDate(startedAt)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Gần nhất</p>
            <p className="text-base font-semibold">{formatViDate(lastReadAt)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Ước tính còn</p>
            <p className="text-base font-semibold">
              {hours > 0 && `${hours}h `}
              {mins > 0 && `${mins}phút`}
              {remainingPages <= 0 && "Đã hoàn thành"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
