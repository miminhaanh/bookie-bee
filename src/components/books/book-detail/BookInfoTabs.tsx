import { FileText, List, Loader2 } from "lucide-react";
import { normalizeTocItems, flattenToc, type TocRowV2 } from "./utils";

interface BookInfoTabsProps {
  description: string | null;
  tocData: unknown;
  tocLoading?: boolean;
}

export function BookInfoTabs({ description, tocData, tocLoading }: BookInfoTabsProps) {
  const items = normalizeTocItems(tocData);
  const rows = flattenToc(items);

  return (
    <div className="grid gap-8 md:grid-cols-2">
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage to-soft-sage flex items-center justify-center">
            <List className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Mục lục</h2>
        </div>
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
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all cursor-pointer"
                style={{ paddingLeft: `${r.depth * 1.25 + 0.75}rem` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {r.label}
                  </span>
                  <span className="text-foreground">{r.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{r.page}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">Chưa có mục lục</p>
        )}
      </div>
    </div>
  );
}
