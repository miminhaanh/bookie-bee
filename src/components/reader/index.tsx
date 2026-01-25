import { useParams, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SpecialZoomLevel,
  type DocumentLoadEvent,
  type PageChangeEvent,
  ScrollMode,
  ViewMode,
} from "@react-pdf-viewer/core";
import {
  highlightPlugin,
  type RenderHighlightTargetProps,
  type RenderHighlightsProps,
} from "@react-pdf-viewer/highlight";
import { TextSelectionToolbar } from "@/components/books/HighlightSelectionToolbar";

import { useReaderCore } from "./hooks/useReaderCore";
import { PDFViewerContainer } from "./parts/PDFViewerContainer";
import { ReaderTopBar } from "./parts/ReaderTopBar";
import { ReaderBottomBar } from "./parts/ReaderBottomBar";
import { SettingsPanel } from "./parts/SettingsPanel";
import { TranslationDialog } from "./overlays/TranslationDialog";

const ReaderContainer = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const core = useReaderCore(id || "");

  const {
    book,
    fileUrl,
    numPages,
    pdfBlobUrl,
    setPdfBlobUrl,
    setNumPages,
    user,
    authLoading,
    showUI,
    theme,
    setTheme,
    currentPage,
    setCurrentPage,
    scrollMode,
    setScrollMode,
    hasVisitedPage,
    setHasVisitedPage,
    pageHighlights,
    setPageHighlights,
    isTranslateOpen,
    setIsTranslateOpen,
    translateSourceText,
    setTranslateSourceText,
    translatedText,
    setTranslatedText,
    isTranslating,
    setIsTranslating,
    translateError,
    setTranslateError,
    scrollModePluginInstance,
    bookmarkPluginInstance,
    pageNavigationPluginInstance,
    zoomPluginInstance,
    didJumpToInitialPageRef,
    handleTap,
    endSession,
    navigate,
    updateBook,
    themeStyles,
    getHighlightAreasFromDb,
    findOverlappingHighlightIds,
    colorToBackground,
    deleteHighlightFromDb,
    addHighlight,
    totalPages,
    isBookLoading,
    bookLoadError,
    hydratedPage,
    isHydrated,
  } = core;
  const currentTheme = themeStyles[theme];
  const isPdfFile = fileUrl.toLowerCase().endsWith(".pdf");
  const didJumpToQueryPageRef = useRef(false);
  const queryPageRef = useRef<number | null>(null);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentPage / (numPages ?? totalPages ?? 1)) * 100)));
  const [isNarrow, setIsNarrow] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [zoomLevel, setZoomLevel] = useState(1);
  const pdfLoadedRef = useRef(false);

  const effectiveViewMode = useMemo(() => {
    if (scrollMode !== ScrollMode.Horizontal) return ViewMode.SinglePage;
    if (isNarrow) return ViewMode.SinglePage;
    return ViewMode.DualPage;
  }, [scrollMode, isNarrow]);

  const effectiveScale = useMemo(() => {
    return SpecialZoomLevel.PageFit as unknown as number;
  }, []);

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const jumpSpread = useCallback(
    (direction: "next" | "prev") => {
      if (scrollMode === ScrollMode.Horizontal && !isNarrow && effectiveViewMode === ViewMode.DualPage) {
        const delta = direction === "next" ? 1 : -1;
        const target = Math.min(
          Math.max(currentPage + delta, 1),
          numPages ?? totalPages ?? currentPage
        );
        pageNavigationPluginInstance.jumpToPage(target - 1);
        return;
      }
      if (direction === "next") pageNavigationPluginInstance.jumpToNextPage();
      else pageNavigationPluginInstance.jumpToPreviousPage();
    },
    [scrollMode, isNarrow, effectiveViewMode, currentPage, numPages, totalPages, pageNavigationPluginInstance]
  );

  // Parse query page from URL
  useEffect(() => {
    const raw = new URLSearchParams(location.search).get("page");
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    queryPageRef.current = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    didJumpToQueryPageRef.current = false;
    didJumpToInitialPageRef.current = false;
  }, [location.search]);

  // Jump to saved page after BOTH: 1) PDF loaded, 2) hydration completed
  useEffect(() => {
    if (!pdfLoadedRef.current || !isHydrated || !numPages) return;
    if (didJumpToInitialPageRef.current) return;
    
    const requestedPage = queryPageRef.current;
    const target = requestedPage ?? hydratedPage;
    if (!target || target <= 1) return;

    const clamped = Math.min(Math.max(target, 1), numPages);
    try {
      pageNavigationPluginInstance.jumpToPage(clamped - 1);
      setCurrentPage(clamped);
      setHasVisitedPage(true);
      didJumpToInitialPageRef.current = true;
    } catch (err) {
      console.warn("Failed to jump to saved page:", err);
    }
  }, [isHydrated, hydratedPage, numPages, pageNavigationPluginInstance, setCurrentPage, setHasVisitedPage]);

  // Redirect to auth if needed
  const shouldRedirectToAuth = !authLoading && !user;
  useEffect(() => {
    if (!shouldRedirectToAuth) return;
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`/auth?returnUrl=${returnUrl}`, { replace: true });
  }, [navigate, shouldRedirectToAuth]);

  useEffect(() => {
    if (scrollMode !== ScrollMode.Horizontal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        jumpSpread("prev");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        jumpSpread("next");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scrollMode, jumpSpread]);

  // Prefetch PDF blob
  useEffect(() => {
    let objectUrl: string | null = null;
    let abort = false;

    const tryFetch = async () => {
      if (!fileUrl) return;
      const ext = fileUrl.split(".").pop()?.toLowerCase();
      if (ext !== "pdf") return;

      try {
        const isAbsolute = /^https?:\/\//i.test(fileUrl);
        let blob: Blob;

        if (!isAbsolute) {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data, error } = await supabase.storage.from("book-files").download(fileUrl);
          if (error) throw error;
          blob = data;
        } else {
          const res = await fetch(fileUrl, { credentials: "include" });
          if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
          blob = await res.blob();
        }

        objectUrl = URL.createObjectURL(blob);
        if (!abort && ext === "pdf") setPdfBlobUrl(objectUrl);
      } catch (err) {
        console.warn("File prefetch failed:", err);
      }
    };

    tryFetch();

    return () => {
      abort = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl, setPdfBlobUrl]);

  // Highlight rendering
  const renderHighlightTarget = useCallback(
    (props: RenderHighlightTargetProps) => {
      // Check if current selection overlaps with existing highlights
      const overlappingIds = findOverlappingHighlightIds(props.highlightAreas, pageHighlights);
      const hasOverlap = overlappingIds.length > 0;

      return (
        <TextSelectionToolbar
          {...props}
          hasOverlappingHighlights={hasOverlap}
          onHighlight={async (color) => {
            if (!user?.id || !id) return;
            try {
              await addHighlight.mutateAsync({
                book_id: id,
                content: props.selectedText,
                note: null,
                color,
                position: JSON.stringify({ highlightAreas: props.highlightAreas }),
                chapter: null,
                page_number: currentPage,
              });

              const newHighlights = await core.fetchPageHighlights(user.id, id, currentPage);
              setPageHighlights(newHighlights);
            } catch (err) {
              console.warn("Failed to add highlight:", err);
            }
          }}
          onDeleteHighlight={async () => {
            if (!user?.id) return;
            const overlappingIds = findOverlappingHighlightIds(props.highlightAreas, pageHighlights);
            for (const hid of overlappingIds) {
              await deleteHighlightFromDb(hid);
            }
            const newHighlights = await core.fetchPageHighlights(user.id, id, currentPage);
            setPageHighlights(newHighlights);
          }}
          onTranslateRequest={async (source: string, target: string) => {
            // Open translation dialog and start translating
            setTranslateSourceText(source);
            setTranslatedText("");
            setTranslateError(null);
            setIsTranslateOpen(true);
            setIsTranslating(true);

            try {
              const result = await core.translateText(source, target);
              if (result.error) {
                setTranslateError(result.error);
              } else if (result.translatedText) {
                setTranslatedText(result.translatedText);
                // Save to history
                const historyItem = core.createTranslateHistoryItem(source, result.translatedText, target);
                core.setTranslateHistory((prev) => [historyItem, ...prev.slice(0, 49)]);
              }
            } catch (err) {
              setTranslateError(err instanceof Error ? err.message : "Dịch thất bại");
            } finally {
              setIsTranslating(false);
            }
          }}
        />
      );
    },
    [user, id, currentPage, pageHighlights, core, setPageHighlights, findOverlappingHighlightIds, deleteHighlightFromDb, setTranslateSourceText, setTranslatedText, setTranslateError, setIsTranslateOpen, setIsTranslating]
  );

  const renderHighlights = useCallback(
    (props: RenderHighlightsProps) => (
      <div>
        {pageHighlights.map((h) => {
          const areas = getHighlightAreasFromDb(h);
          if (areas.length === 0) return null;

          const targetAreas = areas.filter((a) => a.pageIndex === props.pageIndex);
          if (targetAreas.length === 0) return null;

          return targetAreas.map((area, i) => (
            <div
              key={`${h.id}-${i}`}
              className="absolute pointer-events-none"
              style={{
                background: colorToBackground(h.color),
                left: `${area.left}%`,
                top: `${area.top}%`,
                width: `${area.width}%`,
                height: `${area.height}%`,
              }}
            />
          ));
        })}
      </div>
    ),
    [pageHighlights, getHighlightAreasFromDb, colorToBackground]
  );

  const highlightPluginInstance = highlightPlugin({ renderHighlightTarget, renderHighlights });

  const handlePdfDocumentLoad = useCallback(
    (e: DocumentLoadEvent) => {
      setNumPages(e.doc.numPages);
      pdfLoadedRef.current = true;

      if (book && (!book.total_pages || book.total_pages <= 0) && e.doc.numPages > 0) {
        updateBook.mutate({ id: book.id, total_pages: e.doc.numPages });
      }

      // Ensure scroll mode is synced after PDF loads
      scrollModePluginInstance.switchScrollMode(scrollMode);

      // Initial jump will be handled by the separate useEffect that waits for isHydrated
    },
    [setNumPages, book, updateBook, scrollModePluginInstance, scrollMode]
  );

  const handlePdfPageChange = useCallback(
    (e: PageChangeEvent) => {
      core.handleScroll();
      setHasVisitedPage(true);
      const newPage = e.currentPage + 1;

      setCurrentPage(newPage);

      // Auto-complete book when reaching the last page
      const totalPagesCount = numPages ?? totalPages;
      if (
        book &&
        book.status !== "completed" &&
        totalPagesCount &&
        newPage >= totalPagesCount
      ) {
        // Mark book as completed
        updateBook.mutate(
          { id: book.id, status: "completed", progress: 100, current_page: totalPagesCount },
          {
            onSuccess: () => {
              core.toast({
                title: "🎉 Chúc mừng!",
                description: `Bạn đã hoàn thành "${book.title}"`,
              });
            },
          }
        );
      }
    },
    [core, setHasVisitedPage, setCurrentPage, numPages, totalPages, book, updateBook]
  );

  if (authLoading || isBookLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          {bookLoadError ?? "Không tìm thấy thông tin sách để mở trình đọc."}
        </p>
        <Button onClick={() => navigate("/dashboard")}>Quay lại Dashboard</Button>
      </div>
    );
  }

  if (!isPdfFile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          Trình đọc Bookie Bee hiện chỉ hỗ trợ PDF. Vui lòng tải lại file PDF cho cuốn sách này.
        </p>
        <Button onClick={() => navigate(`/book/${id}`)}>Quay lại sách</Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative h-dvh w-full overflow-hidden transition-colors duration-300",
        currentTheme.bg,
        currentTheme.text
      )}
      onClick={handleTap}
    >
      {/* Translation Dialog */}
      <TranslationDialog
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        sourceText={translateSourceText}
        translatedText={translatedText}
        isTranslating={isTranslating}
        error={translateError}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        brightness={brightness}
        onBrightnessChange={setBrightness}
        theme={theme}
        onThemeChange={setTheme}
        scrollMode={scrollMode}
        onScrollModeChange={(mode) => {
          setScrollMode(mode);
          scrollModePluginInstance.switchScrollMode(mode);
          localStorage.setItem("readerScrollMode", mode.toString());
        }}
        zoomLevel={zoomLevel}
        onZoomChange={(level) => {
          setZoomLevel(level);
          zoomPluginInstance.zoomTo(level);
        }}
      />

      {/* Top Bar */}
      <ReaderTopBar
        showUI={showUI}
        bookTitle={book?.title ?? "Đang đọc"}
        onBack={() => {
          endSession();
          navigate(`/book/${id}`);
        }}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* Subtle progress indicator (vertical mode) */}
      {scrollMode === ScrollMode.Vertical && (
        <div className="pointer-events-none fixed right-4 top-20 bottom-24 hidden w-1.5 sm:block opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <div className="h-full w-full rounded-full bg-foreground/10">
            <div
              className="w-full rounded-full bg-foreground/20 transition-[height] duration-150"
              style={{ height: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Viewer - Fullscreen */}
      {pdfBlobUrl ? (
        <div 
          className="absolute inset-0"
          style={{ filter: `brightness(${brightness / 100})` }}
        >
          <div className="h-full w-full px-4 lg:px-8">
            <div className="mx-auto h-full w-full max-w-[1400px]">
              <PDFViewerContainer
                fileUrl={pdfBlobUrl}
                plugins={[
                  highlightPluginInstance,
                  scrollModePluginInstance,
                  bookmarkPluginInstance,
                  pageNavigationPluginInstance,
                  zoomPluginInstance,
                ]}
                onDocumentLoad={handlePdfDocumentLoad}
                onPageChange={handlePdfPageChange}
                viewMode={effectiveViewMode}
                defaultScale={effectiveScale}
              />
            </div>
          </div>

          {/* Tap zones for page navigation - only visible edges */}
          <div
            className="absolute left-0 top-0 h-full w-12 cursor-pointer z-20"
            onClick={(e) => {
              e.stopPropagation();
              jumpSpread("prev");
            }}
          />
          <div
            className="absolute right-0 top-0 h-full w-12 cursor-pointer z-20"
            onClick={(e) => {
              e.stopPropagation();
              jumpSpread("next");
            }}
          />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Bottom Bar */}
      <ReaderBottomBar
        showUI={showUI}
        currentPage={currentPage}
        totalPages={numPages ?? totalPages}
        onSeek={(page) => {
          const max = numPages ?? totalPages ?? 1;
          const clamped = Math.min(Math.max(page, 1), max);
          pageNavigationPluginInstance.jumpToPage(clamped - 1);
          setCurrentPage(clamped);
          setHasVisitedPage(true);
        }}
      />
    </div>
  );
};

export default ReaderContainer;
