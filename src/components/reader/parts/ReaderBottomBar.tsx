import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollMode } from "@react-pdf-viewer/core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReaderBottomBarProps {
  showUI: boolean;
  currentPage: number;
  totalPages: number | null;
  scrollMode: ScrollMode;
  numPages: number | null;
  onScrollModeChange: (mode: ScrollMode) => void;
  isDualPage: boolean;
  isDualPageDisabled?: boolean;
  onViewModeChange: (isDual: boolean) => void;
  currentPageInput: React.ReactNode;
  numberOfPagesComponent: React.ReactNode;
  zoomInButton: React.ReactNode;
  zoomOutButton: React.ReactNode;
  zoomInput: string;
  onZoomInputChange: (value: string) => void;
  onZoomInputCommit: () => void;
  onZoomInputFocus?: () => void;
  onZoomInputBlur?: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
}

export const ReaderBottomBar = ({
  showUI,
  currentPage,
  totalPages,
  scrollMode,
  numPages,
  onScrollModeChange,
  isDualPage,
  isDualPageDisabled,
  onViewModeChange,
  currentPageInput,
  numberOfPagesComponent,
  zoomInButton,
  zoomOutButton,
  zoomInput,
  onZoomInputChange,
  onZoomInputCommit,
  onZoomInputFocus,
  onZoomInputBlur,
  onPreviousPage,
  onNextPage,
}: ReaderBottomBarProps) => {
  const denomForProgress = numPages ?? totalPages ?? 1;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentPage / denomForProgress) * 100)));

  return (
    <footer
      className={cn(
        "fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 transition-transform duration-300 safe-area-bottom",
        showUI ? "translate-y-0" : "translate-y-full",
        "max-w-[980px] rounded-2xl border border-border/60 bg-background/85 shadow-sm backdrop-blur-md"
      )}
    >
      <div className="px-3 py-2">
        {/* Progress */}
        <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            Trang
            <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {currentPageInput}
              <span>/</span>
              {numberOfPagesComponent}
            </span>
          </span>
          <span>{progressPercent}%</span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onScrollModeChange(ScrollMode.Vertical)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                "hover:scale-[1.02]",
                scrollMode === ScrollMode.Vertical
                  ? "border-foreground/20 bg-foreground/10"
                  : "border-border bg-background"
              )}
            >
              Dọc
            </button>
            <button
              type="button"
              onClick={() => onScrollModeChange(ScrollMode.Horizontal)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                "hover:scale-[1.02]",
                scrollMode === ScrollMode.Horizontal
                  ? "border-foreground/20 bg-foreground/10"
                  : "border-border bg-background"
              )}
            >
              Ngang
            </button>

            {scrollMode === ScrollMode.Horizontal && (
              <div className="ml-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onViewModeChange(false)}
                  className={cn(
                    "rounded-xl border px-2.5 py-1 text-[11px] font-medium transition-all",
                    "hover:scale-[1.02]",
                    !isDualPage ? "border-foreground/20 bg-foreground/10" : "border-border bg-background"
                  )}
                >
                  1 trang
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange(true)}
                  disabled={isDualPageDisabled}
                  className={cn(
                    "rounded-xl border px-2.5 py-1 text-[11px] font-medium transition-all",
                    "hover:scale-[1.02]",
                    isDualPage ? "border-foreground/20 bg-foreground/10" : "border-border bg-background",
                    isDualPageDisabled ? "cursor-not-allowed opacity-50" : ""
                  )}
                >
                  2 trang
                </button>
              </div>
            )}
          </div>

          {scrollMode === ScrollMode.Horizontal ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Trang trước"
                className="rounded-xl transition-all hover:scale-[1.02]"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviousPage?.();
                }}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                {zoomOutButton}
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-2 py-1">
                  <input
                    value={zoomInput}
                    onChange={(e) => onZoomInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onZoomInputCommit();
                    }}
                    onFocus={onZoomInputFocus}
                    onBlur={() => {
                      onZoomInputCommit();
                      onZoomInputBlur?.();
                    }}
                    inputMode="numeric"
                    className="w-10 bg-transparent text-[11px] text-foreground/80 outline-none"
                    aria-label="Zoom"
                  />
                  <span className="text-[11px] text-muted-foreground">%</span>
                </div>
                {zoomInButton}
              </div>

              <Button
                variant="outline"
                size="icon"
                aria-label="Trang sau"
                className="rounded-xl transition-all hover:scale-[1.02]"
                onClick={(e) => {
                  e.stopPropagation();
                  onNextPage?.();
                }}
                disabled={!!numPages && currentPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {zoomOutButton}
              <div className="flex h-9 items-center justify-center rounded-xl border border-border bg-background px-2 text-xs" aria-label="Nhảy đến trang">
                {currentPageInput}
                <span className="mx-1 text-muted-foreground">/</span>
                {numberOfPagesComponent}
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-2 py-1">
                <input
                  value={zoomInput}
                  onChange={(e) => onZoomInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onZoomInputCommit();
                  }}
                  onFocus={onZoomInputFocus}
                  onBlur={() => {
                    onZoomInputCommit();
                    onZoomInputBlur?.();
                  }}
                  inputMode="numeric"
                  className="w-10 bg-transparent text-[11px] text-foreground/80 outline-none"
                  aria-label="Zoom"
                />
                <span className="text-[11px] text-muted-foreground">%</span>
              </div>
              {zoomInButton}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
