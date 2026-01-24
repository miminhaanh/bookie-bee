// ============================================
// TYPES & CONSTANTS
// ============================================

import type { Highlight as DbHighlight } from "@/hooks/useHighlights";
import type { HighlightArea } from "@react-pdf-viewer/highlight";

export type ReaderTheme = "light" | "dark" | "sepia" | "green";

export type TranslateHistoryItem = {
  id: string;
  originalText: string;  // Changed from sourceText
  sourceText: string;  // Alias for backward compatibility
  translatedText: string;
  target: string;
  createdAt: string;
};

export interface ThemeStyle {
  bg: string;
  text: string;
  name: string;
}

export const themeStyles: Record<ReaderTheme, ThemeStyle> = {
  light: { bg: "bg-[hsl(40,33%,98%)]", text: "text-[hsl(20,14%,15%)]", name: "Sáng" },
  dark: { bg: "bg-[hsl(220,20%,10%)]", text: "text-[hsl(40,20%,90%)]", name: "Tối" },
  sepia: { bg: "bg-[hsl(40,50%,90%)]", text: "text-[hsl(30,30%,20%)]", name: "Sepia" },
  green: { bg: "bg-[hsl(120,20%,8%)]", text: "text-[hsl(120,100%,50%)]", name: "Hacker" },
};

export const SUPPORTED_TRANSLATE_TARGETS = new Set(["vi", "en", "es", "fr", "de", "ja", "ko"]);

export const sampleContent = `
  <h2>Chương 1: Khởi đầu</h2>
  <p>Đây là nội dung mẫu để demo giao diện đọc sách. Trong ứng dụng thực tế, nội dung sẽ được parse từ file PDF.</p>
  <p>BookWorm cung cấp trải nghiệm đọc sách tối ưu với nhiều tùy chọn cá nhân hóa. Bạn có thể điều chỉnh font chữ, kích thước, khoảng cách dòng và theme theo sở thích.</p>
  <p>Tính năng highlight cho phép bạn đánh dấu những đoạn văn hay và thêm ghi chú cá nhân. Tất cả sẽ được lưu trữ và đồng bộ trên cloud.</p>
  <p>Hệ thống tracking thời gian đọc giúp bạn theo dõi tiến độ và duy trì thói quen đọc sách hàng ngày. Streak sẽ được cập nhật khi bạn đọc ít nhất 5 phút mỗi ngày.</p>
  <blockquote>"Đọc sách là hành trình khám phá thế giới qua từng trang giấy."</blockquote>
  <p>Hy vọng bạn có những phút giây thư giãn cùng BookWorm! 📚</p>
`;

// ============================================
// HIGHLIGHT UTILITIES
// ============================================

export const getHighlightAreasFromDb = (h: DbHighlight): HighlightArea[] => {
  if (!h.position) return [];
  try {
    const parsed = JSON.parse(h.position) as { highlightAreas?: HighlightArea[] };
    return Array.isArray(parsed?.highlightAreas) ? parsed.highlightAreas : [];
  } catch {
    return [];
  }
};

export const rectOverlapScore = (
  a: Pick<HighlightArea, "left" | "top" | "width" | "height">,
  b: Pick<HighlightArea, "left" | "top" | "width" | "height">
) => {
  const ax1 = a.left;
  const ay1 = a.top;
  const ax2 = a.left + a.width;
  const ay2 = a.top + a.height;
  const bx1 = b.left;
  const by1 = b.top;
  const bx2 = b.left + b.width;
  const by2 = b.top + b.height;

  const ix1 = Math.max(ax1, bx1);
  const iy1 = Math.max(ay1, by1);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);

  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const intersection = iw * ih;
  const areaA = Math.max(0, a.width) * Math.max(0, a.height);
  const areaB = Math.max(0, b.width) * Math.max(0, b.height);
  if (areaA <= 0 || areaB <= 0) return 0;

  const iou = intersection / (areaA + areaB - intersection);
  const overlapByMin = intersection / Math.min(areaA, areaB);
  return Math.max(iou, overlapByMin);
};

export const findOverlappingHighlightIds = (
  selectionAreas: HighlightArea[] | undefined,
  existing: DbHighlight[]
) => {
  if (!selectionAreas || selectionAreas.length === 0) return [] as string[];

  const ids: string[] = [];
  for (const h of existing) {
    const areas = getHighlightAreasFromDb(h);
    if (areas.length === 0) continue;

    let best = 0;
    for (const sel of selectionAreas) {
      for (const a of areas) {
        if (a.pageIndex !== sel.pageIndex) continue;
        best = Math.max(best, rectOverlapScore(sel, a));
      }
    }

    if (best >= 0.45) ids.push(h.id);
  }
  return ids;
};

export const colorToBackground = (color: DbHighlight["color"]) => {
  switch (color) {
    case "blue":
      return "hsl(var(--highlight-blue))";
    case "red":
      return "hsl(var(--highlight-red))";
    case "yellow":
    default:
      return "hsl(var(--highlight-yellow))";
  }
};

// ============================================
// HIGHLIGHT DATABASE OPERATIONS
// ============================================

import { supabase } from "@/integrations/supabase/client";

export const fetchPageHighlights = async (
  userId: string,
  bookId: string,
  pageNumber: number
): Promise<DbHighlight[]> => {
  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .eq("page_number", pageNumber)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Failed to load highlights:", error);
    return [];
  }
  return (data ?? []) as DbHighlight[];
};

export const fetchAllBookHighlights = async (
  userId: string,
  bookId: string
): Promise<DbHighlight[]> => {
  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .order("page_number", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Failed to load highlights list:", error);
    return [];
  }
  return (data ?? []) as DbHighlight[];
};

export const deleteHighlightFromDb = async (highlightId: string): Promise<void> => {
  const { error } = await supabase.from("highlights").delete().eq("id", highlightId);
  if (error) throw error;
};

// ============================================
// TRANSLATION UTILITIES
// ============================================

export const translateText = async (
  source: string,
  target: string
): Promise<{ translatedText: string | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke("translate", {
      body: {
        q: source,
        target,
      },
    });

    if (error) throw new Error(error.message);

    const payload = data as { translatedText?: string; translated_text?: string; error?: string } | null;
    if (payload?.error) throw new Error(payload.error);

    const t = (payload?.translatedText ?? payload?.translated_text ?? "").trim();
    if (!t) throw new Error("Không nhận được nội dung dịch");

    return { translatedText: t, error: null };
  } catch (err) {
    let msg = err instanceof Error ? err.message : "Dịch thất bại";
    if (msg.includes("Failed to send a request to the Edge Function")) {
      msg =
        "Không gọi được Edge Function. Hãy chắc chắn bạn đã deploy function 'translate' và đã set secret GEMINI_API_KEY trong Supabase.";
    }
    return { translatedText: null, error: msg };
  }
};

export const createTranslateHistoryItem = (
  source: string,
  translated: string,
  target: string
): TranslateHistoryItem => {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto.randomUUID() as string)
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    originalText: source,
    sourceText: source,
    translatedText: translated,
    target,
    createdAt: new Date().toISOString(),
  };
};

export const loadTranslateHistory = (userId: string): TranslateHistoryItem[] => {
  const key = `translate_history_${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((x) => x as Partial<TranslateHistoryItem>)
      .filter((x) => typeof x?.sourceText === "string" && typeof x?.translatedText === "string")
      .map((x) => ({
        id: typeof x.id === "string" ? x.id : String(Date.now()),
        originalText: x.sourceText ?? "",
        sourceText: x.sourceText ?? "",
        translatedText: x.translatedText ?? "",
        target: typeof x.target === "string" ? x.target : "vi",
        createdAt: typeof x.createdAt === "string" ? x.createdAt : new Date().toISOString(),
      }))
      .slice(0, 50);
  } catch {
    return [];
  }
};

export const saveTranslateHistory = (userId: string, history: TranslateHistoryItem[]): void => {
  const key = `translate_history_${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(history.slice(0, 50)));
  } catch {
    // ignore
  }
};
