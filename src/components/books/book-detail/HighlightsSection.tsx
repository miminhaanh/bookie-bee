import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { highlightBgByColor } from "./utils";
import type { Highlight } from "@/hooks/useHighlights";

interface HighlightsSectionProps {
  highlights: Highlight[];
  onDeleteHighlight: (id: string) => void;
}

export function HighlightsSection({ highlights, onDeleteHighlight }: HighlightsSectionProps) {
  if (highlights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Đoạn highlight ({highlights.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h) => {
            const colorClass = highlightBgByColor[h.color] || "bg-muted border-muted-foreground/30";
            return (
              <div
                key={h.id}
                className={`group relative rounded-lg border p-3 transition-shadow hover:shadow-md ${colorClass}`}
              >
                <p className="pr-8 text-sm leading-relaxed line-clamp-4">{h.content}</p>
                
                {h.note && (
                  <p className="mt-2 text-xs italic text-muted-foreground line-clamp-2">
                    {h.note}
                  </p>
                )}
                
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Trang {h.page_number || "?"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteHighlight(h.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
