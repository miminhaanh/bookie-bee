import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  History,
  List,
  Settings,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { TextSelectionToolbar } from "@/components/books/HighlightSelectionToolbar";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useReadingSession } from "@/hooks/useReadingSession";
import { useSaveReadingProgress } from "@/hooks/useSaveReadingProgress";
import { useHighlights, type Highlight as DbHighlight } from "@/hooks/useHighlights";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import ePub from "epubjs";
import { supabase } from "@/integrations/supabase/client";
import {
  ScrollMode,
  SpecialZoomLevel,
  Worker,
  Viewer,
  type DocumentLoadEvent,
  type PageChangeEvent,
} from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import {
  highlightPlugin,
  type HighlightArea,
  type RenderHighlightTargetProps,
  type RenderHighlightsProps,
} from "@react-pdf-viewer/highlight";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import { scrollModePlugin } from "@react-pdf-viewer/scroll-mode";
import { bookmarkPlugin } from "@react-pdf-viewer/bookmark";
import "@react-pdf-viewer/bookmark/lib/styles/index.css";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

type EpubTocItem = {
  label: string;
  href?: string;
  subitems?: EpubTocItem[];
};

type TranslateHistoryItem = {
  id: string;
  sourceText: string;
  translatedText: string;
  target: string;
  createdAt: string;
};

const getHighlightAreasFromDb = (h: DbHighlight): HighlightArea[] => {
  if (!h.position) return [];
  try {
    const parsed = JSON.parse(h.position) as { highlightAreas?: HighlightArea[] };
    return Array.isArray(parsed?.highlightAreas) ? parsed.highlightAreas : [];
  } catch {
    return [];
  }
};

const rectOverlapScore = (a: Pick<HighlightArea, "left" | "top" | "width" | "height">, b: Pick<HighlightArea, "left" | "top" | "width" | "height">) => {
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

const findOverlappingHighlightIds = (
  selectionAreas: HighlightArea[] | undefined,
  existing: DbHighlight[],
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

    // Tolerant threshold: a re-selection won't match 100%.
    if (best >= 0.45) ids.push(h.id);
  }
  return ids;
};

const colorToBackground = (color: DbHighlight["color"]) => {
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

type ReaderTheme = "light" | "dark" | "sepia" | "green";

const SUPPORTED_TRANSLATE_TARGETS = new Set(["vi", "en", "es", "fr", "de", "ja", "ko"]);

const themeStyles: Record<ReaderTheme, { bg: string; text: string; name: string }> = {
  light: { bg: "bg-[hsl(40,33%,98%)]", text: "text-[hsl(20,14%,15%)]", name: "Sáng" },
  dark: { bg: "bg-[hsl(220,20%,10%)]", text: "text-[hsl(40,20%,90%)]", name: "Tối" },
  sepia: { bg: "bg-[hsl(40,50%,90%)]", text: "text-[hsl(30,30%,20%)]", name: "Sepia" },
  green: { bg: "bg-[hsl(120,20%,8%)]", text: "text-[hsl(120,100%,50%)]", name: "Hacker" },
};

const Reader = () => {
  const { id } = useParams<{ id: string }>();
  const [showUI, setShowUI] = useState(true);
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<"sans" | "serif">("sans");
  const [lineHeight, setLineHeight] = useState(1.8);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollMode, setScrollMode] = useState<ScrollMode>(ScrollMode.Vertical);
  const [isPdf, setIsPdf] = useState(false);
  const [isEpub, setIsEpub] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [hasVisitedPage, setHasVisitedPage] = useState(false);
  const [deletingHighlightId, setDeletingHighlightId] = useState<string | null>(null);
  const [pageHighlights, setPageHighlights] = useState<DbHighlight[]>([]);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [epubToc, setEpubToc] = useState<EpubTocItem[]>([]);
  const [isEpubTocLoading, setIsEpubTocLoading] = useState(false);
  const [highlightsList, setHighlightsList] = useState<DbHighlight[]>([]);
  const [isHighlightsLoading, setIsHighlightsLoading] = useState(false);

  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [translateSourceText, setTranslateSourceText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [isTranslateHistoryOpen, setIsTranslateHistoryOpen] = useState(false);
  const [translateHistory, setTranslateHistory] = useState<TranslateHistoryItem[]>([]);
  const epubRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<unknown>(null);
  const bookRef = useRef<unknown>(null);
  const pdfWrapperRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef(currentPage);
  
  const hideUITimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { profile } = useProfile();
  const { books, updateBook } = useBooks();
  const navigate = useNavigate();
  const location = useLocation();
  const lastHighlightSelectionCrashAtRef = useRef(0);

  // Workaround: prevent a known @react-pdf-viewer/highlight crash when selection is extremely long.
  // This keeps the app usable and prompts the user to select a smaller range.
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const message = String(e?.message ?? "");
      const filename = String(e?.filename ?? "");

      const fromHighlightPlugin = filename.includes("@react-pdf-viewer_highlight");
      const isKnownSelectionCrash =
        message.includes("Invalid array length") ||
        message.includes("Cannot read properties of null") && message.includes("textContent");

      if (!fromHighlightPlugin || !isKnownSelectionCrash) return;

      const now = Date.now();
      if (now - lastHighlightSelectionCrashAtRef.current < 1200) {
        e.preventDefault();
        return;
      }
      lastHighlightSelectionCrashAtRef.current = now;

      e.preventDefault();
      try {
        window.getSelection()?.removeAllRanges();
      } catch {
        // ignore
      }
      toast({
        title: "Selection quá dài/khó xử lý",
        description: "Hãy thử bôi đậm ngắn hơn (ít dòng hơn, trong 1 đoạn/trang) rồi thao tác lại.",
        variant: "destructive",
      });
    };

    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("error", onError);
    };
  }, [toast]);

  // Load & persist translate history per user
  useEffect(() => {
    if (!user?.id) return;
    const key = `translate_history_${user.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      setTranslateHistory([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setTranslateHistory([]);
        return;
      }
      const safe = parsed
        .map((x) => x as Partial<TranslateHistoryItem>)
        .filter((x) => typeof x?.sourceText === "string" && typeof x?.translatedText === "string")
        .map((x) => ({
          id: typeof x.id === "string" ? x.id : String(Date.now()),
          sourceText: x.sourceText ?? "",
          translatedText: x.translatedText ?? "",
          target: typeof x.target === "string" ? x.target : "vi",
          createdAt: typeof x.createdAt === "string" ? x.createdAt : new Date().toISOString(),
        }))
        .slice(0, 50);
      setTranslateHistory(safe);
    } catch {
      setTranslateHistory([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const key = `translate_history_${user.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(translateHistory.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [translateHistory, user?.id]);
  
  // Start reading session tracking
  const { endSession } = useReadingSession(id || "");

  const book = books.find((b) => b.id === id);
  const totalPages = typeof book?.total_pages === "number" && book.total_pages > 0 ? book.total_pages : null;
  const fileUrl = book?.file_url || "";

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const currentTheme = themeStyles[theme];

  // Sample content for demo (in real app, this would be parsed from EPUB/PDF)
  const sampleContent = `
    <h2>Chương 1: Khởi đầu</h2>
    <p>Đây là nội dung mẫu để demo giao diện đọc sách. Trong ứng dụng thực tế, nội dung sẽ được parse từ file EPUB hoặc PDF.</p>
    <p>BookWorm cung cấp trải nghiệm đọc sách tối ưu với nhiều tùy chọn cá nhân hóa. Bạn có thể điều chỉnh font chữ, kích thước, khoảng cách dòng và theme theo sở thích.</p>
    <p>Tính năng highlight cho phép bạn đánh dấu những đoạn văn hay và thêm ghi chú cá nhân. Tất cả sẽ được lưu trữ và đồng bộ trên cloud.</p>
    <p>Hệ thống tracking thời gian đọc giúp bạn theo dõi tiến độ và duy trì thói quen đọc sách hàng ngày. Streak sẽ được cập nhật khi bạn đọc ít nhất 5 phút mỗi ngày.</p>
    <blockquote>"Đọc sách là hành trình khám phá thế giới qua từng trang giấy."</blockquote>
    <p>Hy vọng bạn có những phút giây thư giãn cùng BookWorm! 📚</p>
  `;

  // Auto-hide UI when scrolling
  const handleScroll = useCallback(() => {
    setShowUI(false);
    if (hideUITimeout.current) clearTimeout(hideUITimeout.current);
  }, []);

  const handleTap = useCallback(() => {
    setShowUI((prev) => !prev);
  }, []);

  const didJumpToInitialPageRef = useRef(false);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  // Determine file type
  useEffect(() => {
    const ext = fileUrl.split(".").pop()?.toLowerCase();
    setIsPdf(ext === "pdf");
    setIsEpub(ext === "epub");
  }, [fileUrl]);

  // Highlights hook for saving highlights
  const { addHighlight, deleteHighlight } = useHighlights(id);

  // Fetch highlights for the current page ONLY after user actually navigates to a page
  useEffect(() => {
    if (!user?.id || !id || !isPdf || !hasVisitedPage) return;

    let active = true;
    const run = async () => {
      const { data, error } = await supabase
        .from("highlights")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", id)
        .eq("page_number", currentPage)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load highlights:", error);
        setPageHighlights([]);
        return;
      }
      setPageHighlights((data ?? []) as DbHighlight[]);
    };

    void run();
    return () => {
      active = false;
    };
  }, [user?.id, id, isPdf, hasVisitedPage, currentPage]);

  // Fetch all highlights for the book when opening the bookmark list
  useEffect(() => {
    if (!isHighlightsOpen || !user?.id || !id) return;

    let active = true;
    setIsHighlightsLoading(true);

    const run = async () => {
      const { data, error } = await supabase
        .from("highlights")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", id)
        .order("page_number", { ascending: true })
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load highlights list:", error);
        setHighlightsList([]);
        setIsHighlightsLoading(false);
        return;
      }

      setHighlightsList((data ?? []) as DbHighlight[]);
      setIsHighlightsLoading(false);
    };

    void run();
    return () => {
      active = false;
    };
  }, [id, isHighlightsOpen, user?.id]);

  const savePdfHighlight = useCallback(
    async (
      props: Pick<RenderHighlightTargetProps, "highlightAreas" | "selectedText" | "selectionData" | "cancel">,
      color: DbHighlight["color"],
    ) => {
      if (!id) {
        props.cancel();
        return;
      }

      const text = (props.selectedText ?? "").trim();
      if (!text) {
        props.cancel();
        return;
      }

      const pageNumber = (props.highlightAreas?.[0]?.pageIndex ?? currentPageRef.current - 1) + 1;
      setHasVisitedPage(true);

      // If user re-selects an already-highlighted region, treat it as a toggle: delete old highlight(s).
      const overlappingIds = findOverlappingHighlightIds(props.highlightAreas, pageHighlights);
      if (overlappingIds.length > 0) {
        try {
          for (const hid of overlappingIds) {
            await deleteHighlight.mutateAsync(hid);
          }
          setPageHighlights((prev) => prev.filter((h) => !overlappingIds.includes(h.id)));
          setHighlightsList((prev) => prev.filter((h) => !overlappingIds.includes(h.id)));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("Failed to delete existing highlight:", err);
        } finally {
          props.cancel();
        }
        return;
      }

      try {
        const inserted = await addHighlight.mutateAsync({
          book_id: id,
          content: text,
          note: null,
          color,
          position: JSON.stringify({
            highlightAreas: props.highlightAreas,
            selectionData: props.selectionData ?? null,
          }),
          chapter: null,
          page_number: pageNumber,
        });

        if (inserted.page_number === currentPageRef.current) {
          setPageHighlights((prev) => [inserted, ...prev]);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Failed to save highlight:", err);
      } finally {
        props.cancel();
      }
    },
    [addHighlight, deleteHighlight, id, pageHighlights],
  );

  const renderHighlightTarget = useCallback(
    (props: RenderHighlightTargetProps) => {
      const overlappingIds = findOverlappingHighlightIds(props.highlightAreas, pageHighlights);
      const selectedText = (props.selectedText ?? "").trim();

      const addToTranslateHistory = (source: string, translated: string, target: string) => {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? (crypto.randomUUID() as string)
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const item: TranslateHistoryItem = {
          id,
          sourceText: source,
          translatedText: translated,
          target,
          createdAt: new Date().toISOString(),
        };

        setTranslateHistory((prev) => [item, ...prev].slice(0, 50));
      };

      return (
        <TextSelectionToolbar
          selectionRegion={props.selectionRegion}
          hasOverlappingHighlights={overlappingIds.length > 0}
          selectedText={selectedText}
          initialTargetLanguage={
            (() => {
              const rawLang = (profile?.language ?? "vi") as string;
              return SUPPORTED_TRANSLATE_TARGETS.has(rawLang) ? rawLang : "vi";
            })()
          }
          onCancelSelection={props.cancel}
          onHighlight={(color) => void savePdfHighlight(props, color)}
          onDeleteHighlight={() => void savePdfHighlight(props, "yellow")}
          onTranslateRequest={(source, target) => {
            setIsTranslateOpen(true);
            setTranslateSourceText(source);
            setTranslatedText("");
            setTranslateError(null);
            setIsTranslating(true);

            void (async () => {
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

                setTranslatedText(t);
                addToTranslateHistory(source, t, target);
              } catch (err) {
                let msg = err instanceof Error ? err.message : "Dịch thất bại";
                if (msg.includes("Failed to send a request to the Edge Function")) {
                  msg =
                    "Không gọi được Edge Function. Hãy chắc chắn bạn đã deploy function 'translate' và đã set secret GEMINI_API_KEY trong Supabase.";
                }
                setTranslateError(msg);
              } finally {
                setIsTranslating(false);
              }
            })();
          }}
        />
      );
    },
    [pageHighlights, profile, savePdfHighlight],
  );

  const renderHighlights = useCallback(
    (props: RenderHighlightsProps) => (
      <div>
        {pageHighlights.map((h) => {
          const areas = getHighlightAreasFromDb(h).filter((a) => a.pageIndex === props.pageIndex);
          if (areas.length === 0) return null;

          const bg = colorToBackground(h.color);
          return (
            <div key={h.id}>
              {areas.map((area, idx) => (
                <div
                  key={`${h.id}-${idx}`}
                  style={{
                    ...props.getCssProperties(area, props.rotation),
                    background: bg,
                    opacity: 0.45,
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    ),
    [pageHighlights],
  );

  // Plugin factories from @react-pdf-viewer can use hooks internally.
  // Call them at the top level (not inside useMemo/useEffect).
  const highlightPluginInstance = highlightPlugin({ renderHighlightTarget, renderHighlights });
  const scrollModePluginInstance = scrollModePlugin();
  const bookmarkPluginInstance = bookmarkPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();

  const { ZoomIn, ZoomOut, CurrentScale } = zoomPluginInstance;
  const { CurrentPageInput, NumberOfPages } = pageNavigationPluginInstance;
  const { Bookmarks } = bookmarkPluginInstance;

  const didJumpToQueryPageRef = useRef(false);
  const queryPageRef = useRef<number | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(location.search).get("page");
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    queryPageRef.current = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    didJumpToQueryPageRef.current = false;
    didJumpToInitialPageRef.current = false;
  }, [location.search]);

  const denomForProgress = isPdf && numPages ? numPages : totalPages;
  const { hydratedPage } = useSaveReadingProgress({
    bookId: id,
    enabled: !!user?.id && !!id,
    currentPage,
    denom: denomForProgress,
    debounceMs: 1200,
    updateBook,
    onHydratePage: (page) => {
      // If the URL explicitly requests a page, let it win.
      if (queryPageRef.current) return;
      setCurrentPage(page);
    },
  });

  const handlePdfDocumentLoad = useCallback(
    (e: DocumentLoadEvent) => {
      setNumPages(e.doc.numPages);

      // Persist total pages for PDFs if we don't have it yet.
      if (book && (!book.total_pages || book.total_pages <= 0) && e.doc.numPages > 0) {
        updateBook.mutate({ id: book.id, total_pages: e.doc.numPages });
      }

      const requestedPage = queryPageRef.current;
      const target = requestedPage ?? hydratedPage;

      if (!target) return;
      if (requestedPage && didJumpToQueryPageRef.current) return;
      if (!requestedPage && didJumpToInitialPageRef.current) return;

      const clamped = Math.min(Math.max(target, 1), e.doc.numPages);
      try {
        // jumpToPage uses zero-based index
        pageNavigationPluginInstance.jumpToPage(clamped - 1);
        setCurrentPage(clamped);
        setHasVisitedPage(true);
        if (requestedPage) didJumpToQueryPageRef.current = true;
        else didJumpToInitialPageRef.current = true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Failed to jump to initial page:", err);
      }
    },
    [pageNavigationPluginInstance, book, updateBook, hydratedPage],
  );

  // If DB hydration completes after the PDF has loaded, jump once.
  useEffect(() => {
    if (!isPdf || !numPages) return;
    if (queryPageRef.current) return;
    const target = hydratedPage;
    if (!target || didJumpToInitialPageRef.current) return;

    const clamped = Math.min(Math.max(target, 1), numPages);
    try {
      pageNavigationPluginInstance.jumpToPage(clamped - 1);
      setCurrentPage(clamped);
      setHasVisitedPage(true);
      didJumpToInitialPageRef.current = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to jump after hydration:", err);
    }
  }, [hydratedPage, isPdf, numPages, pageNavigationPluginInstance]);

  const handlePdfPageChange = useCallback(
    (e: PageChangeEvent) => {
      handleScroll();
      setHasVisitedPage(true);
      setCurrentPage(e.currentPage + 1);
    },
    [handleScroll],
  );

  const shouldRedirectToAuth = !authLoading && !user;

  useEffect(() => {
    if (!shouldRedirectToAuth) return;
    navigate("/auth", { replace: true });
  }, [navigate, shouldRedirectToAuth]);

  // Initialize EPUB rendering when needed
  useEffect(() => {
    if (!isEpub || !fileUrl || !epubRef.current) return;

    const bookObj = ePub(fileUrl);
    bookRef.current = bookObj;
    const rendition = bookObj.renderTo(epubRef.current, {
      width: "100%",
      height: "100%",
      spread: "none",
    });
    rendition.display();
    renditionRef.current = rendition;

    const onRelocated = () => {
      // We don't know exact page count for EPUB easily; navigation buttons call rendition.prev/next
    };

    rendition.on("relocated", onRelocated);

    return () => {
      try {
        if (rendition && typeof rendition.destroy === "function") rendition.destroy();
        if (bookObj && typeof (bookObj as unknown as { destroy?: unknown }).destroy === "function") {
          (bookObj as unknown as { destroy: () => void }).destroy();
        }
      } catch (e) {
        // ignore
      }
    };
  }, [isEpub, fileUrl]);

  // Load EPUB table of contents on demand
  useEffect(() => {
    if (!isTocOpen) return;
    if (!isEpub) return;
    if (epubToc.length > 0) return;
    if (!bookRef.current) return;

    let cancelled = false;
    setIsEpubTocLoading(true);

    const run = async () => {
      try {
        const bookObj = bookRef.current as unknown as {
          loaded?: { navigation?: Promise<unknown> };
          navigation?: { toc?: unknown[] };
        };

        // epubjs exposes navigation either via loaded.navigation or book.navigation
        if (bookObj.loaded?.navigation) {
          await bookObj.loaded.navigation;
        }

        const rawToc = (bookObj.navigation as { toc?: unknown[] } | undefined)?.toc;
        const normalize = (items: unknown[]): EpubTocItem[] => {
          return items
            .map((it) => {
              const x = it as { label?: string; href?: string; subitems?: unknown[]; subitems2?: unknown[] };
              const children = Array.isArray(x.subitems)
                ? x.subitems
                : Array.isArray(x.subitems2)
                  ? x.subitems2
                  : [];
              return {
                label: String(x.label ?? ""),
                href: x.href,
                subitems: children.length ? normalize(children) : [],
              } satisfies EpubTocItem;
            })
            .filter((x) => x.label.trim().length > 0);
        };

        const toc = Array.isArray(rawToc) ? normalize(rawToc) : [];
        if (!cancelled) setEpubToc(toc);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load EPUB TOC:", err);
        if (!cancelled) setEpubToc([]);
      } finally {
        if (!cancelled) setIsEpubTocLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [epubToc.length, isEpub, isTocOpen]);

  // Try to prefetch PDF into a blob URL to avoid CORS/authorization issues when loading in <Document />
  useEffect(() => {
    let objectUrl: string | null = null;
    let abort = false;

    const tryFetch = async () => {
      if (!isPdf || !fileUrl) return;
      try {
        const isAbsolute = /^https?:\/\//i.test(fileUrl);
        if (!isAbsolute) {
          // Prefer downloading via Supabase Storage API (works for private buckets and avoids signed URL expiry)
          const { data, error } = await supabase.storage.from("book-files").download(fileUrl);
          if (error) throw error;
          objectUrl = URL.createObjectURL(data);
          if (!abort) setPdfBlobUrl(objectUrl);
          return;
        }

        // If it's already an absolute URL or signed/public URL flow above didn't return, fetch and create blob URL
        const res = await fetch(fileUrl, { credentials: "include" });
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!abort) setPdfBlobUrl(objectUrl);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("PDF prefetch failed, will try direct URL in <Document>:", err);
      }
    };

    tryFetch();

    return () => {
      abort = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isPdf, fileUrl]);

  // Cleanup on unmount: clear timeout and revoke blob URL
  useEffect(() => {
    return () => {
      if (hideUITimeout.current) {
        clearTimeout(hideUITimeout.current);
        hideUITimeout.current = null;
      }
      if (pdfBlobUrl && pdfBlobUrl.startsWith && pdfBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  return (
    <div
      className={cn(
        "relative h-dvh w-full overflow-hidden transition-colors duration-300",
        currentTheme.bg,
        currentTheme.text,
      )}
      onClick={handleTap}
    >
      {isTranslateOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsTranslateOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-background/70 p-4 shadow-float backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Bản dịch"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Dịch từ đoạn bôi đậm</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{translateSourceText}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTranslateOpen(false)}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3">
              {isTranslating ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang dịch...
                </div>
              ) : translateError ? (
                <p className="text-sm text-destructive">{translateError}</p>
              ) : (
                <p className="text-base text-foreground">{translatedText}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Book layer (background) */}
      <div className="absolute inset-0 z-0">
        {shouldRedirectToAuth ? null : !book ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isPdf && fileUrl ? (
          <div ref={pdfWrapperRef} className="h-full w-full">
            <Worker workerUrl={pdfWorkerUrl}>
              <div className="h-full w-full">
                <Viewer
                  fileUrl={pdfBlobUrl ?? fileUrl}
                  onDocumentLoad={handlePdfDocumentLoad}
                  onPageChange={handlePdfPageChange}
                  scrollMode={scrollMode}
                  defaultScale={SpecialZoomLevel.PageFit}
                  plugins={[
                    highlightPluginInstance,
                    zoomPluginInstance,
                    scrollModePluginInstance,
                    bookmarkPluginInstance,
                    pageNavigationPluginInstance,
                  ]}
                />
              </div>
            </Worker>
          </div>
        ) : isEpub && fileUrl ? (
          <div className="h-full w-full" ref={epubRef} />
        ) : (
          <div className="h-full w-full overflow-auto px-4 py-14" onScroll={handleScroll}>
            <article
              className={cn(
                "max-w-2xl mx-auto prose prose-lg",
                fontFamily === "serif" ? "font-serif" : "font-sans",
                currentTheme.text,
              )}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
              }}
              dangerouslySetInnerHTML={{ __html: sampleContent }}
            />
          </div>
        )}
      </div>

      {/* Top bar */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 safe-area-top",
          showUI ? "translate-y-0" : "-translate-y-full",
          "bg-background/80 backdrop-blur-sm border-b border-border"
        )}
      >
        <div className="flex items-center justify-between px-2 py-1.5">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              endSession();
              navigate(-1);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="text-sm font-medium truncate max-w-[200px]">
            {book?.title ?? "Đang đọc"}
          </h1>

          <div className="flex items-center gap-2">
            <Sheet open={isTocOpen} onOpenChange={setIsTocOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Xem mục lục"
                >
                  <List className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                <SheetHeader>
                  <SheetTitle>Mục lục</SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex-1 overflow-y-auto pr-1">
                  {isPdf ? (
                    <div className="text-sm">
                      <Bookmarks />
                    </div>
                  ) : isEpub ? (
                    isEpubTocLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : epubToc.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sách này chưa có mục lục.</p>
                    ) : (
                      <div className="space-y-1">
                        {(() => {
                          const renderItems = (items: EpubTocItem[], depth = 0) => {
                            return items.map((item, idx) => (
                              <div key={`${depth}-${idx}-${item.href ?? item.label}`}>
                                <button
                                  type="button"
                                  className={cn(
                                    "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                                    depth > 0 ? "pl-" + String(Math.min(2 + depth * 2, 10)) : "",
                                  )}
                                  style={{ paddingLeft: depth ? `${8 + depth * 12}px` : undefined }}
                                  onClick={() => {
                                    const href = item.href;
                                    if (!href) return;
                                    const rendition = renditionRef.current as unknown as { display?: (target: string) => unknown };
                                    if (typeof rendition?.display === "function") {
                                      void rendition.display(href);
                                      setIsTocOpen(false);
                                    }
                                  }}
                                >
                                  {item.label}
                                </button>
                                {item.subitems && item.subitems.length ? (
                                  <div className="mt-1">{renderItems(item.subitems, depth + 1)}</div>
                                ) : null}
                              </div>
                            ));
                          };
                          return renderItems(epubToc);
                        })()}
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Mục lục chưa hỗ trợ cho định dạng này.</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={isHighlightsOpen} onOpenChange={setIsHighlightsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Xem highlights"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                <SheetHeader>
                  <SheetTitle>Highlights</SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
                  {isHighlightsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : highlightsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có highlight nào.</p>
                  ) : (
                    highlightsList.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        className="relative w-full rounded-lg border border-border border-l-4 p-3 text-left transition-colors hover:bg-muted"
                        style={{ borderLeftColor: colorToBackground(h.color) }}
                        onClick={() => {
                          if (!isPdf) return;
                          const pageNumberFromDb = h.page_number;
                          if (!pageNumberFromDb) return;

                          // jumpToPage uses a zero-based page index, while page_number in DB is usually 1-based
                          const zeroBasedPageIndex = Math.max(0, pageNumberFromDb - 1);
                          pageNavigationPluginInstance.jumpToPage(zeroBasedPageIndex);
                          setCurrentPage(pageNumberFromDb);
                          setHasVisitedPage(true);
                          setIsHighlightsOpen(false);
                        }}
                      >
                        <button
                          type="button"
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground disabled:opacity-50"
                          aria-label="Xoá highlight"
                          disabled={deletingHighlightId === h.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void (async () => {
                              try {
                                setDeletingHighlightId(h.id);
                                const { error } = await supabase
                                  .from("highlights")
                                  .delete()
                                  .eq("id", h.id);
                                if (error) throw error;

                                setHighlightsList((prev) => prev.filter((x) => x.id !== h.id));
                                setPageHighlights((prev) => prev.filter((x) => x.id !== h.id));
                              } catch (err) {
                                // eslint-disable-next-line no-console
                                console.warn("Failed to delete highlight:", err);
                              } finally {
                                setDeletingHighlightId(null);
                              }
                            })();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>Trang {h.page_number ?? "-"}</span>
                        </div>
                        <p className="mt-2 text-sm">{h.content}</p>
                        {h.note ? (
                          <p className="mt-2 text-sm text-muted-foreground">{h.note}</p>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={isTranslateHistoryOpen} onOpenChange={setIsTranslateHistoryOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Xem lịch sử dịch"
                >
                  <History className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                <SheetHeader>
                  <SheetTitle>Lịch sử dịch</SheetTitle>
                </SheetHeader>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Lưu trên thiết bị này</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTranslateHistory([])}
                    disabled={translateHistory.length === 0}
                  >
                    Xoá tất cả
                  </Button>
                </div>

                <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
                  {translateHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có bản dịch nào.</p>
                  ) : (
                    translateHistory.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="relative w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
                        onClick={() => {
                          setIsTranslateHistoryOpen(false);
                          setIsTranslateOpen(true);
                          setTranslateSourceText(item.sourceText);
                          setTranslatedText(item.translatedText);
                          setTranslateError(null);
                          setIsTranslating(false);
                        }}
                      >
                        <button
                          type="button"
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground"
                          aria-label="Xoá bản dịch"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTranslateHistory((prev) => prev.filter((x) => x.id !== item.id));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{item.target.toUpperCase()}</span>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm">{item.sourceText}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.translatedText}</p>
                      </button>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Cài đặt đọc"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent onClick={(e) => e.stopPropagation()}>
                <SheetHeader>
                  <SheetTitle>Cài đặt đọc</SheetTitle>
                </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Reading mode (PDF only) */}
                {isPdf ? (
                  <div>
                    <Label className="text-sm font-medium">Chế độ đọc</Label>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScrollMode(ScrollMode.Vertical);
                          scrollModePluginInstance.switchScrollMode(ScrollMode.Vertical);
                        }}
                        className={cn(
                          "flex-1 rounded-lg border-2 p-3 text-sm transition-all",
                          scrollMode === ScrollMode.Vertical
                            ? "border-primary bg-primary/10"
                            : "border-border",
                        )}
                      >
                        Cuộn dọc
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScrollMode(ScrollMode.Horizontal);
                          scrollModePluginInstance.switchScrollMode(ScrollMode.Horizontal);
                        }}
                        className={cn(
                          "flex-1 rounded-lg border-2 p-3 text-sm transition-all",
                          scrollMode === ScrollMode.Horizontal
                            ? "border-primary bg-primary/10"
                            : "border-border",
                        )}
                      >
                        Lướt ngang
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Theme */}
                <div>
                  <Label className="text-sm font-medium">Theme</Label>
                  <div className="mt-2 flex gap-2">
                    {(Object.entries(themeStyles) as [ReaderTheme, typeof themeStyles.light][]).map(
                      ([key, style]) => (
                        <button
                          key={key}
                          onClick={() => setTheme(key)}
                          className={cn(
                            "flex-1 rounded-lg border-2 p-3 text-xs font-medium transition-all",
                            style.bg,
                            style.text,
                            theme === key 
                              ? "border-primary ring-2 ring-primary/20" 
                              : "border-transparent"
                          )}
                        >
                          {style.name}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Font family */}
                <div>
                  <Label className="text-sm font-medium">Font</Label>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setFontFamily("sans")}
                      className={cn(
                        "flex-1 rounded-lg border-2 p-3 text-sm font-sans transition-all",
                        fontFamily === "sans" 
                          ? "border-primary bg-primary/10" 
                          : "border-border"
                      )}
                    >
                      Sans-serif
                    </button>
                    <button
                      onClick={() => setFontFamily("serif")}
                      className={cn(
                        "flex-1 rounded-lg border-2 p-3 text-sm font-serif transition-all",
                        fontFamily === "serif" 
                          ? "border-primary bg-primary/10" 
                          : "border-border"
                      )}
                    >
                      Serif
                    </button>
                  </div>
                </div>

                {/* Font size */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Cỡ chữ</Label>
                    <span className="text-sm text-muted-foreground">{fontSize}px</span>
                  </div>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([v]) => setFontSize(v)}
                    min={14}
                    max={28}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Line height */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Khoảng cách dòng</Label>
                    <span className="text-sm text-muted-foreground">{lineHeight}</span>
                  </div>
                  <Slider
                    value={[lineHeight]}
                    onValueChange={([v]) => setLineHeight(v)}
                    min={1.4}
                    max={2.4}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Bottom bar */}
      <footer 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 safe-area-bottom",
          showUI ? "translate-y-0" : "translate-y-full",
          "bg-background/80 backdrop-blur-sm border-t border-border"
        )}
      >
        <div className="px-2 py-1.5">
          {/* Progress */}
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              Trang
              {isPdf ? (
                <span
                  className="inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CurrentPageInput />
                  <span>/</span>
                  <NumberOfPages />
                </span>
              ) : (
                <span>
                  {currentPage}/{totalPages}
                </span>
              )}
            </span>
            <span>{Math.round((currentPage / (isPdf && numPages ? numPages : totalPages)) * 100)}%</span>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-4">
            {isPdf ? (
              scrollMode === ScrollMode.Horizontal ? (
                <div
                  className="flex w-full items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Trang trước"
                    onClick={(e) => {
                      e.stopPropagation();
                      pageNavigationPluginInstance.jumpToPreviousPage();
                    }}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <ZoomOut>
                      {(props) => (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Thu nhỏ"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onClick();
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </ZoomOut>

                    <CurrentScale>
                      {(props) => (
                        <div
                          className="flex h-9 min-w-14 items-center justify-center rounded-md border border-border bg-background px-2 text-xs tabular-nums"
                          aria-label="Mức zoom"
                        >
                          {Math.round(props.scale * 100)}%
                        </div>
                      )}
                    </CurrentScale>

                    <ZoomIn>
                      {(props) => (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Phóng to"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onClick();
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </ZoomIn>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Trang sau"
                    onClick={(e) => {
                      e.stopPropagation();
                      pageNavigationPluginInstance.jumpToNextPage();
                    }}
                    disabled={!!numPages && currentPage >= numPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <ZoomOut>
                      {(props) => (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Thu nhỏ"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onClick();
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </ZoomOut>

                    <div
                      className="flex h-9 items-center justify-center rounded-md border border-border bg-background px-2 text-xs"
                      aria-label="Nhảy đến trang"
                    >
                      <CurrentPageInput />
                      <span className="mx-1 text-muted-foreground">/</span>
                      <NumberOfPages />
                    </div>

                    <CurrentScale>
                      {(props) => (
                        <div
                          className="flex h-9 min-w-14 items-center justify-center rounded-md border border-border bg-background px-2 text-xs tabular-nums"
                          aria-label="Mức zoom"
                        >
                          {Math.round(props.scale * 100)}%
                        </div>
                      )}
                    </CurrentScale>

                    <ZoomIn>
                      {(props) => (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Phóng to"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onClick();
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </ZoomIn>
                  </div>
                </div>
              )
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      isEpub &&
                      renditionRef.current &&
                      typeof (renditionRef.current as { prev?: unknown }).prev === "function"
                    ) {
                      (renditionRef.current as { prev: () => void }).prev();
                    }
                  }}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Slider
                  value={[currentPage]}
                  onValueChange={([v]) => {
                    setCurrentPage(v);
                  }}
                  min={1}
                  max={totalPages}
                  step={1}
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      isEpub &&
                      renditionRef.current &&
                      typeof (renditionRef.current as { next?: unknown }).next === "function"
                    ) {
                      (renditionRef.current as { next: () => void }).next();
                    } else {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }
                  }}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Reader;