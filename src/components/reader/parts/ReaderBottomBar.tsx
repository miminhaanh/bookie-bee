import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { ScrollMode } from "@react-pdf-viewer/core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReaderBottomBarProps {
  showUI: boolean;
  currentPage: number;
  totalPages: number | null;
  scrollMode: ScrollMode;
  numPages: number | null;
  currentPageInput: React.ReactNode;
  numberOfPagesComponent: React.ReactNode;
  zoomInButton: React.ReactNode;
  zoomOutButton: React.ReactNode;
  currentScaleComponent: React.ReactNode;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
}

export const ReaderBottomBar = ({
  showUI,
  currentPage,
  totalPages,
  scrollMode,
  numPages,
  currentPageInput,
  numberOfPagesComponent,
  zoomInButton,
  zoomOutButton,
  currentScaleComponent,
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
        "bg-background/80 backdrop-blur-sm border-t border-border"
      )}
    >
      <div className="px-2 py-1.5">
        {/* Progress */}
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
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

        {/* Navigation */}
        <div className="flex items-center gap-4">
          {scrollMode === ScrollMode.Horizontal ? (
            <div
              className="flex w-full items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="icon"
                aria-label="Trang trước"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviousPage?.();
                }}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {zoomOutButton}
                {currentScaleComponent}
                {zoomInButton}
              </div>

              <Button
                variant="outline"
                size="icon"
                aria-label="Trang sau"
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
            <div
              className="flex w-full items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {zoomOutButton}
                <div
                  className="flex h-9 items-center justify-center rounded-md border border-border bg-background px-2 text-xs"
                  aria-label="Nhảy đến trang"
                >
                  {currentPageInput}
                  <span className="mx-1 text-muted-foreground">/</span>
                  {numberOfPagesComponent}
                </div>
                {currentScaleComponent}
                {zoomInButton}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
