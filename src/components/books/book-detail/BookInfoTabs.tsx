import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeTocItems, flattenToc, type TocRowV2 } from "./utils";

interface BookInfoTabsProps {
  description: string | null;
  tocData: unknown;
}

export function BookInfoTabs({ description, tocData }: BookInfoTabsProps) {
  const items = normalizeTocItems(tocData);
  const rows = flattenToc(items);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Giới thiệu</CardTitle>
        </CardHeader>
        <CardContent>
          {description ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">Chưa có mô tả</p>
          )}
        </CardContent>
      </Card>

      {/* TOC */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mục lục</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {rows.map((r: TocRowV2, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-sm hover:bg-accent/50 rounded px-2 py-1.5 transition-colors"
                  style={{ paddingLeft: `${r.depth * 1.25 + 0.5}rem` }}
                >
                  <span className="shrink-0 font-medium text-primary min-w-[2.5rem]">
                    {r.label}
                  </span>
                  <span className="flex-1 text-muted-foreground">{r.title}</span>
                  <span className="shrink-0 text-muted-foreground/70">{r.page}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">Chưa có mục lục</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
