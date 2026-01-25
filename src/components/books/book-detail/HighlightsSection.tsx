import { Button } from "@/components/ui/button";
import { Trash2, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Highlight } from "@/hooks/useHighlights";

interface HighlightsSectionProps {
  highlights: Highlight[];
  onDeleteHighlight: (id: string) => void;
}

const highlightBgByColor: Record<string, string> = {
  yellow: "bg-highlight-yellow/30 border-highlight-yellow/40",
  blue: "bg-highlight-blue/30 border-highlight-blue/40",
  red: "bg-highlight-red/30 border-highlight-red/40",
};

export function HighlightsSection({ highlights, onDeleteHighlight }: HighlightsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Highlighter className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Highlights</h2>
            <p className="text-sm text-muted-foreground">Lưu lại những đoạn bạn thích</p>
          </div>
        </div>
        <span className="px-3 py-1 text-sm font-medium bg-muted rounded-full">
          {highlights.length}
        </span>
      </div>

      {highlights.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">Chưa có highlight nào</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highlights.map((h) => (
            <div
              key={h.id}
              className={cn(
                "relative rounded-2xl border p-4",
                highlightBgByColor[h.color] ?? "bg-muted/30 border-border"
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={() => onDeleteHighlight(h.id)}
                aria-label="Xóa highlight"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <p className="text-sm leading-relaxed text-foreground pr-8">{h.content}</p>
              {h.note && <p className="mt-2 text-xs italic text-muted-foreground">{h.note}</p>}
              <div className="mt-3 text-xs text-muted-foreground">
                Trang {h.page_number || "?"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
