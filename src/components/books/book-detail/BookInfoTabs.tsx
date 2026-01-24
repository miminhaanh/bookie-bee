import { BookOpen, ListTree } from "lucide-react";
import { normalizeTocItems, flattenToc, type TocRowV2 } from "./utils";

interface BookInfoTabsProps {
  description: string | null;
  tocData: unknown;
}

export function BookInfoTabs({ description, tocData }: BookInfoTabsProps) {
  const items = normalizeTocItems(tocData);
  const rows = flattenToc(items);

  return (
    <section className="grid gap-12 border-b border-[#F0E6DB] pb-12 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[#B37A5B]">
          <BookOpen className="h-4 w-4" strokeWidth={1.6} />
          <h3 className="text-base font-semibold text-[#2D1F16]">Giới thiệu</h3>
        </div>
        {description ? (
          <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-[#4C3A2F]">
            {description}
          </p>
        ) : (
          <p className="text-sm italic text-[#9D8775]">Chưa có mô tả</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[#B37A5B]">
          <ListTree className="h-4 w-4" strokeWidth={1.6} />
          <h3 className="text-base font-semibold text-[#2D1F16]">Mục lục</h3>
        </div>
        {rows.length > 0 ? (
          <div className="space-y-1.5 text-sm text-[#4C3A2F]">
            {rows.map((r: TocRowV2, idx: number) => (
              <div
                key={`${r.title}-${idx}`}
                className="flex items-center gap-3 border-b border-[#F8ECE0] py-1"
                style={{ paddingLeft: `${r.depth * 1.25}rem` }}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-[#BCA08A]">
                  {r.label}
                </span>
                <span className="flex-1">{r.title}</span>
                <span className="text-xs text-[#BCA08A]">{r.page}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-[#9D8775]">Chưa có mục lục</p>
        )}
      </div>
    </section>
  );
}
