import { useParams, useLocation } from "react-router-dom";
import { useCallback, useMemo, useEffect, useRef } from "react";
import { Bookmark, History, List, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  SpecialZoomLevel,
  type DocumentLoadEvent,
  type PageChangeEvent,
} from "@react-pdf-viewer/core";
import {
  highlightPlugin,
  type RenderHighlightTargetProps,
  type RenderHighlightsProps,
} from "@react-pdf-viewer/highlight";
import { TextSelectionToolbar } from "@/components/books/HighlightSelectionToolbar";

import { useReaderCore } from "./hooks/useReaderCore";
import { PDFViewerContainer } from "./parts/PDFViewerContainer";
import { EpubViewerContainer } from "./parts/EpubViewerContainer";
import { ReaderTopBar } from "./parts/ReaderTopBar";
import { ReaderBottomBar } from "./parts/ReaderBottomBar";
import { TranslationDialog } from "./overlays/TranslationDialog";
import { HighlightsList } from "./overlays/HighlightsList";
import { TranslateHistorySheet } from "./overlays/TranslateHistorySheet";
import { TableOfContents } from "./overlays/TableOfContents";
import { ReaderSettings } from "./overlays/ReaderSettings";

const ReaderContainer = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const core = useReaderCore(id || "");

  const {
    book,
    fileUrl,
    isPdf,
    numPages,
    pdfBlobUrl,
    setPdfBlobUrl,
    setNumPages,
    user,
    authLoading,
    showUI,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    currentPage,
    setCurrentPage,
    scrollMode,
    setScrollMode,
    hasVisitedPage,
    setHasVisitedPage,
    pageHighlights,
    setPageHighlights,
    highlightsList,
    setHighlightsList,
    isHighlightsLoading,
    deletingHighlightId,
    setDeletingHighlightId,
    addHighlight,
    deleteHighlight,
    isHighlightsOpen,
    setIsHighlightsOpen,
    isTocOpen,
    setIsTocOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    isSettingsOpen,
    setIsSettingsOpen,
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
    translateHistory,
    setTranslateHistory,
    scrollModePluginInstance,
    bookmarkPluginInstance,
    pageNavigationPluginInstance,
    zoomPluginInstance,
    pdfWrapperRef,
    didJumpToInitialPageRef,
    handleTap,
    endSession,
    navigate,
    toast,
    updateBook,
    themeStyles,
    getHighlightAreasFromDb,
    findOverlappingHighlightIds,
    colorToBackground,
    translateText,
    deleteHighlightFromDb,
    saveTranslateHistory,
    totalPages,
    isBookLoading,
    bookLoadError,
  } = core;

  const { ZoomIn, ZoomOut, CurrentScale } = zoomPluginInstance;
  const { CurrentPageInput, NumberOfPages } = pageNavigationPluginInstance;
  const { Bookmarks } = bookmarkPluginInstance;

  const currentTheme = themeStyles[theme];
  const didJumpToQueryPageRef = useRef(false);
  const queryPageRef = useRef<number | null>(null);

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
            // Toolbar will call addHighlight via the hook
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

  return (
    <div
      className={cn(
        "relative h-dvh w-full overflow-hidden transition-colors duration-300",
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
        onBack={() => {
          endSession();
          navigate(`/book/${id}`);
        }}
        tocButton={
          <Sheet open={isTocOpen} onOpenChange={setIsTocOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <List className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </Sheet>
        }
        highlightsButton={
          <Sheet open={isHighlightsOpen} onOpenChange={setIsHighlightsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <Bookmark className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </Sheet>
        }
        translateHistoryButton={
          <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <History className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </Sheet>
        }
        settingsButton={
          <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </Sheet>
        }
      />

      {/* Overlays */}
      <TableOfContents
        isOpen={isTocOpen}
        onOpenChange={setIsTocOpen}
        isPdf={isPdf}
        bookmarksComponent={<Bookmarks />}
      />

      <HighlightsList
        isOpen={isHighlightsOpen}
        onOpenChange={setIsHighlightsOpen}
        highlights={highlightsList}
        isLoading={isHighlightsLoading}
        deletingId={deletingHighlightId}
        isPdf={isPdf}
        onJumpToPage={(pageNumber) => {
          if (!isPdf) return;
          pageNavigationPluginInstance.jumpToPage(Math.max(0, pageNumber - 1));
          setCurrentPage(pageNumber);
          setHasVisitedPage(true);
          setIsHighlightsOpen(false);
        }}
        onDeleteHighlight={async (highlightId) => {
          setDeletingHighlightId(highlightId);
          await deleteHighlightFromDb(highlightId);
          setHighlightsList((prev) => prev.filter((x) => x.id !== highlightId));
          setPageHighlights((prev) => prev.filter((x) => x.id !== highlightId));
          setDeletingHighlightId(null);
          toast({ title: "Đã xoá highlight" });
        }}
      />

      <TranslateHistorySheet
        isOpen={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        history={translateHistory}
        onClearAll={() => {
          if (!user?.id) return;
          saveTranslateHistory(user.id, []);
          setTranslateHistory([]);
          toast({ title: "Đã xoá lịch sử dịch" });
        }}
        onSelectItem={(item) => {
          setTranslateSourceText(item.originalText);
          setTranslatedText(item.translatedText);
          setTranslateError(null);
          setIsTranslating(false);
          setIsTranslateOpen(true);
          setIsHistoryOpen(false);
        }}
        onDeleteItem={(index) => {
          const updated = translateHistory.filter((_, i) => i !== Number(index));
          if (!user?.id) return;
          saveTranslateHistory(user.id, updated);
          setTranslateHistory(updated);
          toast({ title: "Đã xoá mục" });
        }}
      />

      <ReaderSettings
        isPdf={isPdf}
        scrollMode={scrollMode}
        theme={theme}
        fontFamily={fontFamily}
        fontSize={fontSize}
        lineHeight={lineHeight}
        onScrollModeChange={(mode) => {
          setScrollMode(mode);
          scrollModePluginInstance.switchScrollMode(mode);
          localStorage.setItem("readerScrollMode", mode.toString());
        }}
        onThemeChange={(newTheme) => {
          setTheme(newTheme);
          localStorage.setItem("readerTheme", newTheme);
        }}
        onFontFamilyChange={(newFamily) => {
          setFontFamily(newFamily);
          localStorage.setItem("readerFontFamily", newFamily);
        }}
        onFontSizeChange={(newSize) => {
          setFontSize(newSize);
          localStorage.setItem("readerFontSize", newSize.toString());
        }}
        onLineHeightChange={(newHeight) => {
          setLineHeight(newHeight);
          localStorage.setItem("readerLineHeight", newHeight.toString());
        }}
      />

      {/* Viewer */}
      {isPdf ? (
        pdfBlobUrl ? (
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
            defaultScale={SpecialZoomLevel.PageWidth as unknown as number}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )
      ) : (
        <EpubViewerContainer
          fileUrl={fileUrl}
          currentPage={currentPage}
          totalPages={totalPages}
          fontSize={fontSize}
          fontFamily={fontFamily}
          lineHeight={lineHeight}
          theme={currentTheme}
        />
      )}

      {/* Bottom Bar */}
      <ReaderBottomBar
        showUI={showUI}
        currentPage={currentPage}
        totalPages={totalPages}
        isPdf={isPdf}
        scrollMode={scrollMode}
        numPages={numPages}
        currentPageInput={<CurrentPageInput />}
        numberOfPagesComponent={<NumberOfPages />}
        zoomInButton={<ZoomIn>{(props) => <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); props.onClick(); }}>➕</Button>}</ZoomIn>}
        zoomOutButton={<ZoomOut>{(props) => <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); props.onClick(); }}>➖</Button>}</ZoomOut>}
        currentScaleComponent={<CurrentScale>{(props) => <div className="text-xs">{Math.round(props.scale * 100)}%</div>}</CurrentScale>}
        onPageChange={(v) => setCurrentPage(v)}
        onPreviousPage={
          isPdf
            ? () => pageNavigationPluginInstance.jumpToPreviousPage()
            : () => setCurrentPage((p) => Math.max(1, p - 1))
        }
        onNextPage={
          isPdf
            ? () => pageNavigationPluginInstance.jumpToNextPage()
            : () => setCurrentPage((p) => Math.min(totalPages || p, p + 1))
        }
      />
    </div>
  );
};

export default ReaderContainer;
