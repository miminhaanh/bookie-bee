import { cn } from "@/lib/utils";

interface ReaderBottomBarProps {
  showUI: boolean;
  currentPage: number;
  totalPages: number | null;
  onSeek?: (page: number) => void;
}

export const ReaderBottomBar = ({
  showUI,
  currentPage,
  totalPages,
  onSeek,
}: ReaderBottomBarProps) => {
  const denomForProgress = totalPages ?? 1;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentPage / denomForProgress) * 100)));

  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 safe-area-bottom",
        showUI ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      {/* Gradient fade for smooth transition */}
      <div className="h-20 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Progress info and bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
        {/* Page info */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-white/90 drop-shadow">
            {currentPage} / {totalPages ?? "-"}
          </span>
          <span className="text-xs font-medium text-white/90 drop-shadow">
            {progressPercent}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative">
          <div className="h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-300 ease-out"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
          {/* Interactive range */}
          <input
            type="range"
            min={1}
            max={totalPages ?? 1}
            step={1}
            value={Math.min(Math.max(currentPage, 1), totalPages ?? 1)}
            onChange={(e) => onSeek?.(Number(e.target.value))}
            aria-label="Đi tới trang"
            className={cn(
              "absolute inset-0 w-full h-6 -top-2 opacity-0 cursor-pointer",
              !totalPages ? "pointer-events-none" : "pointer-events-auto"
            )}
          />
        </div>
      </div>
    </footer>
  );
};
