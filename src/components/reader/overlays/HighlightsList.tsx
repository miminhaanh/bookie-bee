import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Highlight as DbHighlight } from "@/hooks/useHighlights";
import { colorToBackground } from "../utils/readerUtils";

interface HighlightsListProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  highlights: DbHighlight[];
  isLoading: boolean;
  deletingId: string | null;
  isPdf: boolean;
  onJumpToPage: (pageNumber: number) => void;
  onDeleteHighlight: (highlightId: string) => Promise<void>;
}

export const HighlightsList = ({
  isOpen,
  onOpenChange,
  highlights,
  isLoading,
  deletingId,
  isPdf,
  onJumpToPage,
  onDeleteHighlight,
}: HighlightsListProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        <SheetHeader>
          <SheetTitle>Highlights</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : highlights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có highlight nào.</p>
          ) : (
            highlights.map((h) => (
              <button
                key={h.id}
                type="button"
                className="relative w-full rounded-lg border border-border border-l-4 p-3 text-left transition-colors hover:bg-muted"
                style={{ borderLeftColor: colorToBackground(h.color) }}
                onClick={() => {
                  if (!isPdf) return;
                  const pageNumberFromDb = h.page_number;
                  if (!pageNumberFromDb) return;
                  onJumpToPage(pageNumberFromDb);
                  onOpenChange(false);
                }}
              >
                <button
                  type="button"
                  className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground disabled:opacity-50"
                  aria-label="Xoá highlight"
                  disabled={deletingId === h.id}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await onDeleteHighlight(h.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Trang {h.page_number ?? "-"}</span>
                </div>
                <p className="mt-2 text-sm">{h.content}</p>
                {h.note ? <p className="mt-2 text-sm text-muted-foreground">{h.note}</p> : null}
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
