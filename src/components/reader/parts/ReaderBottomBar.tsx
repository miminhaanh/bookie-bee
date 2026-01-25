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
        "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 safe-area-bottom",
        showUI ? "translate-y-0" : "translate-y-full",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="glass-card border-t border-border/50 px-4 py-3">
        <div className="container mx-auto">
          {/* Progress bar */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Trang {currentPage}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{numPages ?? totalPages ?? "-"}</span>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 items-center text-sm" onClick={(e) => e.stopPropagation()}>
            {/* Left: Scroll mode */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onScrollModeChange(ScrollMode.Vertical)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                  "hover:scale-[1.02]",
                  scrollMode === ScrollMode.Vertical
                    ? "border-primary/30 bg-primary/10 text-primary"
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
                    ? "border-primary/30 bg-primary/10 text-primary"
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
                      !isDualPage ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background"
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
                      isDualPage ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background",
                      isDualPageDisabled ? "cursor-not-allowed opacity-50" : ""
                    )}
                  >
                    2 trang
                  </button>
                </div>
              )}
            </div>

            {/* Center: Page navigation */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Trang trước"
                className="h-8 w-8 rounded-xl transition-all hover:scale-[1.02]"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviousPage?.();
                }}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 rounded-xl border border-border bg-background/80 px-2 py-1 backdrop-blur">
                {currentPageInput}
                <span className="mx-1 text-muted-foreground">/</span>
                {numberOfPagesComponent}
              </div>

              <Button
                variant="outline"
                size="icon"
                aria-label="Trang sau"
                className="h-8 w-8 rounded-xl transition-all hover:scale-[1.02]"
                onClick={(e) => {
                  e.stopPropagation();
                  onNextPage?.();
                }}
                disabled={!!numPages && currentPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Zoom controls */}
            <div className="flex items-center justify-end gap-2">
              {zoomOutButton}
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background/80 px-2 py-1 backdrop-blur">
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
                  className="w-10 bg-transparent text-[11px] text-center text-foreground/80 outline-none"
                  aria-label="Zoom"
                />
                <span className="text-[11px] text-muted-foreground">%</span>
              </div>
              {zoomInButton}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
