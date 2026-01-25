import { useParams, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SpecialZoomLevel,
  type DocumentLoadEvent,
  type PageChangeEvent,
  ScrollMode,
  ViewMode,
  type ZoomEvent,
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
    totalPages,
    isBookLoading,
    bookLoadError,
  } = core;
  const { ZoomIn, ZoomOut } = zoomPluginInstance;
  const { CurrentPageInput, NumberOfPages } = pageNavigationPluginInstance;
  const currentTheme = themeStyles[theme];
  const isPdfFile = fileUrl.toLowerCase().endsWith(".pdf");
  const didJumpToQueryPageRef = useRef(false);
  const queryPageRef = useRef<number | null>(null);
  const denomForProgress = numPages ?? totalPages ?? 1;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentPage / denomForProgress) * 100)));
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomInput, setZoomInput] = useState("100");
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [preferredViewMode, setPreferredViewMode] = useState<ViewMode>(ViewMode.DualPage);
  const [isNarrow, setIsNarrow] = useState(false);

  const effectiveViewMode = useMemo(() => {
    if (scrollMode !== ScrollMode.Horizontal) return ViewMode.SinglePage;
    if (isNarrow) return ViewMode.SinglePage;
    return preferredViewMode;
  }, [scrollMode, isNarrow, preferredViewMode]);

  useEffect(() => {
    const savedViewMode = localStorage.getItem("readerViewMode");
    if (savedViewMode === "single") setPreferredViewMode(ViewMode.SinglePage);
    if (savedViewMode === "dual") setPreferredViewMode(ViewMode.DualPage);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "readerViewMode",
      preferredViewMode === ViewMode.DualPage ? "dual" : "single"
    );
  }, [preferredViewMode]);

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Parse query page from URL
  useEffect(() => {
    const raw = new URLSearchParams(location.search).get("page");
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    queryPageRef.current = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    didJumpToQueryPageRef.current = false;
    didJumpToInitialPageRef.current = false;
  }, [location.search]);

  // Redirect to auth if needed
  const shouldRedirectToAuth = !authLoading && !user;
  useEffect(() => {
    if (!shouldRedirectToAuth) return;
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`/auth?returnUrl=${returnUrl}`, { replace: true });
  }, [navigate, shouldRedirectToAuth]);

  useEffect(() => {
    if (isEditingZoom) return;
    setZoomInput(String(Math.round(zoomScale * 100)));
  }, [zoomScale, isEditingZoom]);

  useEffect(() => {
    if (scrollMode !== ScrollMode.Horizontal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        pageNavigationPluginInstance.jumpToPreviousPage();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        pageNavigationPluginInstance.jumpToNextPage();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scrollMode, pageNavigationPluginInstance]);

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
        />
      );
    },
    [user, id, currentPage, pageHighlights, core, setPageHighlights, findOverlappingHighlightIds, deleteHighlightFromDb]
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

      if (book && (!book.total_pages || book.total_pages <= 0) && e.doc.numPages > 0) {
        updateBook.mutate({ id: book.id, total_pages: e.doc.numPages });
      }

      const requestedPage = queryPageRef.current;
      const target = requestedPage ?? core.hydratedPage;
      if (!target) return;
      if (requestedPage && didJumpToQueryPageRef.current) return;
      if (!requestedPage && didJumpToInitialPageRef.current) return;

      const clamped = Math.min(Math.max(target, 1), e.doc.numPages);
      try {
        pageNavigationPluginInstance.jumpToPage(clamped - 1);
        setCurrentPage(clamped);
        setHasVisitedPage(true);
        if (requestedPage) didJumpToQueryPageRef.current = true;
        else didJumpToInitialPageRef.current = true;
      } catch (err) {
        console.warn("Failed to jump to initial page:", err);
      }
    },
    [setNumPages, book, updateBook, core.hydratedPage, pageNavigationPluginInstance, setCurrentPage, setHasVisitedPage]
  );

  const handlePdfPageChange = useCallback(
    (e: PageChangeEvent) => {
      core.handleScroll();
      setHasVisitedPage(true);
      setCurrentPage(e.currentPage + 1);
    },
    [core, setHasVisitedPage, setCurrentPage]
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

      {/* Top Bar */}
      <ReaderTopBar
        showUI={showUI}
        bookTitle={book?.title ?? "Đang đọc"}
        bookAuthor={book?.author}
        onBack={() => {
          endSession();
          navigate(`/book/${id}`);
        }}
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

      {/* Viewer */}
      {pdfBlobUrl ? (
        <div className="absolute inset-0 flex justify-center px-4 pb-24 pt-16 sm:px-8">
          <div className="h-full w-full max-w-[920px]">
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
              onZoom={(e: ZoomEvent) => setZoomScale(e.scale)}
              viewMode={effectiveViewMode}
              defaultScale={SpecialZoomLevel.PageFit as unknown as number}
            />
          </div>

          {scrollMode === ScrollMode.Horizontal && (
            <>
              <button
                type="button"
                aria-label="Trang trước"
                className="absolute left-0 top-0 h-full w-14 cursor-pointer bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  pageNavigationPluginInstance.jumpToPreviousPage();
                }}
              />
              <button
                type="button"
                aria-label="Trang sau"
                className="absolute right-0 top-0 h-full w-14 cursor-pointer bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  pageNavigationPluginInstance.jumpToNextPage();
                }}
              />
            </>
          )}
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
        totalPages={totalPages}
        scrollMode={scrollMode}
        numPages={numPages}
        onScrollModeChange={(mode) => {
          setScrollMode(mode);
          scrollModePluginInstance.switchScrollMode(mode);
          localStorage.setItem("readerScrollMode", mode.toString());
        }}
        isDualPage={effectiveViewMode === ViewMode.DualPage}
        isDualPageDisabled={isNarrow}
        onViewModeChange={(isDual) => {
          setPreferredViewMode(isDual ? ViewMode.DualPage : ViewMode.SinglePage);
        }}
        currentPageInput={<CurrentPageInput />}
        numberOfPagesComponent={<NumberOfPages />}
        zoomInButton={
          <ZoomIn>
            {(props) => (
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl transition-all hover:scale-[1.02]"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onClick();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </ZoomIn>
        }
        zoomOutButton={
          <ZoomOut>
            {(props) => (
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl transition-all hover:scale-[1.02]"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onClick();
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
          </ZoomOut>
        }
        zoomInput={zoomInput}
        onZoomInputChange={setZoomInput}
        onZoomInputCommit={() => {
          const parsed = Number(zoomInput);
          if (!Number.isFinite(parsed)) return;
          const clamped = Math.min(400, Math.max(25, parsed));
          zoomPluginInstance.zoomTo(clamped / 100);
        }}
        onZoomInputFocus={() => setIsEditingZoom(true)}
        onZoomInputBlur={() => setIsEditingZoom(false)}
        onPreviousPage={() => pageNavigationPluginInstance.jumpToPreviousPage()}
        onNextPage={() => pageNavigationPluginInstance.jumpToNextPage()}
      />
    </div>
  );
};

export default ReaderContainer;
