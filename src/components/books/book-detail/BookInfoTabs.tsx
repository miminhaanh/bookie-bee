import { useState } from "react";
import { FileText, List, Loader2, ChevronDown, ChevronUp, Play } from "lucide-react";
import { normalizeTocItems, flattenToc, type TocRowV2 } from "./utils";

interface BookInfoTabsProps {
  description: string | null;
  tocData: unknown;
  tocLoading?: boolean;
  bookId?: string;
  onTocItemClick?: (page: number | null) => void;
}

export function BookInfoTabs({ description, tocData, tocLoading, bookId, onTocItemClick }: BookInfoTabsProps) {
  const items = normalizeTocItems(tocData);
  const rows = flattenToc(items);
  const [tocOpen, setTocOpen] = useState(true);

  return (
    <div className="grid gap-8 md:grid-cols-[1.35fr_0.9fr]">
      {/* Introduction */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender to-sky flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Giới thiệu</h2>
        </div>
        {description ? (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Chưa có mô tả</p>
        )}
      </div>

      {/* Table of Contents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sage to-soft-sage flex items-center justify-center">
              <List className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Mục lục</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setTocOpen((v) => !v)}
          >
            {tocOpen ? "Thu gọn" : "Mở"}
            {tocOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        {tocOpen && (
          <>
            {tocLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang trích xuất mục lục từ PDF...</span>
              </div>
            ) : rows.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {rows.map((r: TocRowV2, idx: number) => (
                  <div
                    key={`${r.title}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all ${onTocItemClick ? 'cursor-pointer group' : ''}`}
                    style={{ paddingLeft: `${r.depth * 1.25 + 0.75}rem` }}
                    onClick={() => onTocItemClick?.(r.page)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {r.label}
                      </span>
                      <span className="text-foreground text-sm truncate">{r.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.page ?? '-'}</span>
                      {onTocItemClick && r.page && (
                        <Play className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">Chưa có mục lục</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
