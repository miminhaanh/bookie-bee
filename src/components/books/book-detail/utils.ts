import type { TocItem } from "@/hooks/useBooks";

export type TocRowV2 = { label: string; title: string; page: number; depth: number };

export const toRoman = (num: number) => {
  if (!Number.isFinite(num) || num <= 0) return "";
  const romans: Array<{ value: number; symbol: string }> = [
    { value: 1000, symbol: "M" },
    { value: 900, symbol: "CM" },
    { value: 500, symbol: "D" },
    { value: 400, symbol: "CD" },
    { value: 100, symbol: "C" },
    { value: 90, symbol: "XC" },
    { value: 50, symbol: "L" },
    { value: 40, symbol: "XL" },
    { value: 10, symbol: "X" },
    { value: 9, symbol: "IX" },
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 1, symbol: "I" },
  ];

  let n = Math.floor(num);
  let out = "";
  for (const r of romans) {
    while (n >= r.value) {
      out += r.symbol;
      n -= r.value;
    }
  }
  return out;
};

export const formatViDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
};

export const normalizeTocItems = (raw: unknown): TocItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v): TocItem | null => {
      if (!v || typeof v !== "object") return null;
      const obj = v as { title?: unknown; page?: unknown; items?: unknown };
      if (typeof obj.title !== "string") return null;
      const page = typeof obj.page === "number" ? obj.page : null;
      const items = normalizeTocItems(obj.items);
      return { title: obj.title, page, items };
    })
    .filter((v): v is TocItem => !!v);
};

export const flattenToc = (items: TocItem[]): TocRowV2[] => {
  const rows: TocRowV2[] = [];
  const walk = (nodes: TocItem[], depth: number, prefix: string | null) => {
    let localIndex = 0;
    for (const n of nodes) {
      localIndex += 1;
      const label = depth === 0 ? toRoman(localIndex) : prefix ? `${prefix}.${localIndex}` : `${localIndex}`;
      if (typeof n.page === "number") {
        rows.push({ label, title: n.title, page: n.page, depth });
      }
      if (Array.isArray(n.items) && n.items.length > 0) {
        walk(n.items, depth + 1, depth === 0 ? null : label);
      }
    }
  };
  walk(items, 0, null);
  return rows;
};

export const highlightBgByColor: Record<string, string> = {
  yellow: "bg-highlight-yellow/30 border-highlight-yellow/40",
  blue: "bg-highlight-blue/30 border-highlight-blue/40",
  red: "bg-highlight-red/30 border-highlight-red/40",
};

export const GENRES = [
  "Văn học", "Self-help", "Kinh doanh", "Khoa học",
  "Lịch sử", "Tâm lý", "Truyện ngắn", "Tiểu thuyết",
] as const;
