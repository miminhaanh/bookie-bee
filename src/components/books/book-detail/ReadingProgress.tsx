import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ReadingProgressProps {
  currentPage: number;
  totalPages: number;
}

export function ReadingProgress({ currentPage, totalPages }: ReadingProgressProps) {
  if (totalPages <= 0) return null;

  const percentage = Math.min(100, Math.round((currentPage / totalPages) * 100));

  return (
    <div className="rounded-3xl p-6 space-y-4 border border-border/60 bg-card/60 backdrop-blur mb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Tiến độ đọc
        </h3>
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {percentage}%
        </span>
      </div>

      <Progress value={percentage} className="h-3 bg-muted" />

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Trang {currentPage} / {totalPages}</span>
        <span>Còn {Math.max(0, totalPages - currentPage)} trang</span>
      </div>
    </div>
  );
}
