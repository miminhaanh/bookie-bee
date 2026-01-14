import { useEffect, useRef, useState } from "react";
import { Languages, Lightbulb, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type SelectionRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type HighlightColor = "yellow" | "blue" | "red";

export type TextSelectionToolbarProps = {
  selectionRegion: SelectionRegion;
  selectedText: string;
  hasOverlappingHighlights: boolean;
  initialTargetLanguage?: string;
  onHighlight: (color: HighlightColor) => void;
  onDeleteHighlight: () => void;
  onTranslateRequest?: (source: string, target: string) => void;
  onCancelSelection?: () => void;
};

const circleBtnBase = "h-5 w-5 rounded-full border border-border";

const LANGUAGES: Array<{ value: string; label: string }> = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

export const TextSelectionToolbar = ({
  selectionRegion,
  selectedText: selectedTextProp,
  hasOverlappingHighlights,
  initialTargetLanguage,
  onHighlightAdded,
  currentPage,
  bookId,
  onHighlight,
  onDeleteHighlight,
  onTranslateRequest,
  onCancelSelection,
}: TextSelectionToolbarProps & {
  // Kept for the requested “shape”; Reader can ignore these.
  bookId?: string;
  currentPage?: number;
  onHighlightAdded?: () => void;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("vi");

  const computePositionFromRect = (rect: DOMRect) => {
    const toolbarWidth = 260;
    const toolbarHeight = 44;
    const half = toolbarWidth / 2;
    const pad = 8;
    const x = Math.min(
      Math.max(rect.left + rect.width / 2, half + pad),
      window.innerWidth - half - pad,
    );

    // Keep it close to the selection.
    const below = rect.bottom + 4;
    const minTop = 12;
    const maxTop = Math.max(minTop, window.innerHeight - toolbarHeight - 12);
    const above = rect.top - (toolbarHeight + 4);
    const preferred = below + toolbarHeight > window.innerHeight ? above : below;
    const y = Math.min(Math.max(preferred, minTop), maxTop);

    return { x, y };
  };

  const pickRectFromRange = (range: Range): DOMRect | null => {
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (rects.length === 0) {
      const fallback = range.getBoundingClientRect();
      return fallback.width > 0 && fallback.height > 0 ? fallback : null;
    }

    // Prefer a rect that is currently visible, and bias toward the end of the selection.
    const inViewport = (r: DOMRect) => r.bottom >= 0 && r.top <= window.innerHeight;
    const visible = rects.filter(inViewport);
    const candidates = visible.length > 0 ? visible : rects;

    // Choose the one closest to the bottom (end) but still within view when possible.
    let best = candidates[0];
    for (const r of candidates) {
      if (r.bottom > best.bottom) best = r;
    }
    return best;
  };

  // Sync selection from caller (e.g. pdf-viewer highlight plugin)
  useEffect(() => {
    const text = (selectedTextProp ?? "").trim();
    if (!text) return;

    setSelectedText(text);

    // Prefer real DOM selection rect for positioning (matches the reference implementation)
    try {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const rect = range ? pickRectFromRange(range) : null;
      if (rect) {
        setPosition(computePositionFromRect(rect));
        setShowToolbar(true);
        return;
      }
    } catch {
      // ignore
    }

    // Fallback: approximate from provided selectionRegion
    setPosition({
      x: Math.min((selectionRegion.left / 100) * window.innerWidth, window.innerWidth - 16),
      y: Math.max(((selectionRegion.top + selectionRegion.height) / 100) * window.innerHeight + 4, 12),
    });
    setShowToolbar(true);
  }, [selectedTextProp, selectionRegion.left, selectionRegion.top, selectionRegion.height]);

  useEffect(() => {
    const initial = (initialTargetLanguage ?? "vi").toLowerCase();
    setTargetLanguage(LANGUAGES.some((l) => l.value === initial) ? initial : "vi");
  }, [initialTargetLanguage]);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text) return;

      setSelectedText(text);

      try {
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const rect = range ? pickRectFromRange(range) : null;
        if (rect) {
          setPosition(computePositionFromRect(rect));
          setShowToolbar(true);
        }
      } catch {
        // ignore
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current?.contains(e.target as Node)) return;

      setTimeout(() => {
        if (!window.getSelection()?.toString().trim()) {
          setShowToolbar(false);
        }
      }, 100);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const closeModals = () => {
    setShowToolbar(false);
    onCancelSelection?.();
  };

  const handleHighlight = async (color: HighlightColor) => {
    if (!user || !selectedText) {
      toast({ title: "Vui lòng đăng nhập để lưu highlight", variant: "destructive" });
      return;
    }

    try {
      // For PDF Reader: delegate to callback so we keep highlightAreas/position.
      onHighlight(color);

      // For other contexts (optional): caller can pass a hook via onHighlightAdded.
      onHighlightAdded?.();
      closeModals();
      window.getSelection()?.removeAllRanges();
    } catch {
      toast({ title: "Không thể lưu highlight", variant: "destructive" });
    }
  };

  const handleDeleteHighlight = async () => {
    try {
      onDeleteHighlight();
      closeModals();
      window.getSelection()?.removeAllRanges();
    } catch {
      toast({ title: "Không thể xoá highlight", variant: "destructive" });
    }
  };

  const handleTranslate = async () => {
    if (!selectedText) return;

    // NOTE: translate modal must live outside this component,
    // because renderHighlightTarget will unmount when selection clears.
    onTranslateRequest?.(selectedText, targetLanguage);
    closeModals();
  };

  const handleExplain = async () => {
    toast({
      title: "Chưa hỗ trợ",
      description: "Tính năng Giải thích chưa được triển khai ở backend.",
    });
  };

  const canTranslate = selectedText.length > 0;

  return (
    <div ref={toolbarRef}>
      {showToolbar ? (
        <div
          className="flex items-center gap-2 rounded-md border border-border bg-background/95 px-2 py-1 shadow-sm"
          style={{
            position: "fixed",
            left: position.x,
            top: Math.max(position.y, 12),
            transform: "translateX(-50%)",
            zIndex: 100,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {hasOverlappingHighlights ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 gap-2 px-2 text-xs"
              aria-label="Xoá highlight"
              onClick={() => void handleDeleteHighlight()}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xoá highlight
            </Button>
          ) : (
            <>
              <button
                type="button"
                aria-label="Highlight vàng"
                className={`${circleBtnBase} bg-highlight-yellow`}
                onClick={() => void handleHighlight("yellow")}
              />
              <button
                type="button"
                aria-label="Highlight xanh"
                className={`${circleBtnBase} bg-highlight-blue`}
                onClick={() => void handleHighlight("blue")}
              />
              <button
                type="button"
                aria-label="Highlight đỏ"
                className={`${circleBtnBase} bg-highlight-red`}
                onClick={() => void handleHighlight("red")}
              />
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleTranslate()}
            disabled={!canTranslate}
            className="h-7 rounded-md gap-1.5 px-2"
          >
            <Languages className="h-4 w-4" />
            <span className="text-xs font-medium">Dịch</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleExplain()}
            disabled={!canTranslate}
            className="h-7 rounded-md gap-1.5 px-2"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="text-xs font-medium">Giải thích</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
};

// Backward-compatible export name (Reader can migrate gradually)
export const HighlightSelectionToolbar = TextSelectionToolbar;
