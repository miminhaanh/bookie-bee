import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Highlight } from "@/hooks/useHighlights";

interface HighlightsSectionProps {
  highlights: Highlight[];
  onDeleteHighlight: (id: string) => void;
}

export function HighlightsSection({ highlights, onDeleteHighlight }: HighlightsSectionProps) {
  if (highlights.length === 0) return null;

  return (
    <section className="space-y-4 border-b border-[#F0E6DB] pb-12">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#2D1F16]">Đoạn highlight</h3>
        <span className="text-sm text-[#9A7D65]">{highlights.length}</span>
      </div>
      <div className="space-y-4">
        {highlights.map((h) => (
          <div key={h.id} className="border-b border-[#F8ECE0] pb-4 last:border-none last:pb-0">
            <p className="text-sm leading-relaxed text-[#4C3A2F]">{h.content}</p>
            {h.note && <p className="mt-2 text-xs italic text-[#9D8775]">{h.note}</p>}
            <div className="mt-2 flex items-center justify-between text-xs text-[#BCA08A]">
              <span>Trang {h.page_number || "?"}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-[#9A7D65] hover:bg-[#FFF3E8]"
                onClick={() => onDeleteHighlight(h.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
