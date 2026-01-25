import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollMode } from "@react-pdf-viewer/core";
import { scrollModePlugin } from "@react-pdf-viewer/scroll-mode";
import { bookmarkPlugin } from "@react-pdf-viewer/bookmark";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { highlightPlugin, type HighlightArea } from "@react-pdf-viewer/highlight";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import type { Book } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useReadingSession } from "@/hooks/useReadingSession";
import { useSaveReadingProgress } from "@/hooks/useSaveReadingProgress";
import { useHighlights, type Highlight as DbHighlight } from "@/hooks/useHighlights";
import { supabase } from "@/integrations/supabase/client";
import {
  type ReaderTheme,
  type TranslateHistoryItem,
  themeStyles,
  SUPPORTED_TRANSLATE_TARGETS,
  getHighlightAreasFromDb,
  findOverlappingHighlightIds,
  colorToBackground,
  translateText,
  createTranslateHistoryItem,
  loadTranslateHistory,
  saveTranslateHistory,
  fetchPageHighlights,
  fetchAllBookHighlights,
  deleteHighlightFromDb,
} from "../utils/readerUtils";

export const useReaderCore = (bookId: string) => {
  // Auth & Profile
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { books, updateBook } = useBooks();
  const navigate = useNavigate();
  
  // Reading session
  const { endSession } = useReadingSession(bookId);

  // Book data
  const [bookFallback, setBookFallback] = useState<Book | null>(null);
  const [isBookLoading, setIsBookLoading] = useState(false);
  const [bookLoadError, setBookLoadError] = useState<string | null>(null);

  const bookFromQuery = books.find((b) => b.id === bookId);
  const book = bookFromQuery ?? bookFallback ?? null;
  const totalPages = typeof book?.total_pages === "number" && book.total_pages > 0 ? book.total_pages : null;
  const fileUrl = book?.file_url || "";

  // UI State
  const [showUI, setShowUI] = useState(true);
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<"sans" | "serif">("sans");
  const [lineHeight, setLineHeight] = useState(1.8);
  
  // Page & Navigation
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollMode, setScrollMode] = useState<ScrollMode>(ScrollMode.Vertical);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [hasVisitedPage, setHasVisitedPage] = useState(false);
  
  // Reading progress
  const denomForProgress = numPages ?? totalPages;
  const { hydratedPage, saveNow, isHydrated } = useSaveReadingProgress({
    bookId,
    enabled: !!user?.id && !!bookId,
    currentPage,
    denom: denomForProgress,
    debounceMs: 1200,
    updateBook,
    onHydratePage: (page) => {
      setCurrentPage(page);
    },
  });
  
  // Highlights
  const [deletingHighlightId, setDeletingHighlightId] = useState<string | null>(null);
  const [pageHighlights, setPageHighlights] = useState<DbHighlight[]>([]);
  const [highlightsList, setHighlightsList] = useState<DbHighlight[]>([]);
  const [isHighlightsLoading, setIsHighlightsLoading] = useState(false);
  
  // Overlays
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Translation
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [translateSourceText, setTranslateSourceText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateHistory, setTranslateHistory] = useState<TranslateHistoryItem[]>([]);

  // Refs
  const pdfWrapperRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef(currentPage);
  const hideUITimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHighlightSelectionCrashAtRef = useRef(0);
  const didJumpToInitialPageRef = useRef(false);

  // Plugins (call directly at top-level; plugin factories use hooks internally)
  const scrollModePluginInstance = scrollModePlugin();
  const bookmarkPluginInstance = bookmarkPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();

  // Hooks
  const { addHighlight, deleteHighlight } = useHighlights(bookId);

  useEffect(() => {
    if (!user?.id || !bookId) return;

    if (bookFromQuery) {
      if (bookFallback) setBookFallback(null);
      if (bookLoadError) setBookLoadError(null);
      if (isBookLoading) setIsBookLoading(false);
      return;
    }

    if (bookFallback || isBookLoading || bookLoadError) return;

    let cancelled = false;
    const fetchBook = async () => {
      setIsBookLoading(true);
      setBookLoadError(null);
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", bookId)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        setBookLoadError(error.message);
      } else if (data) {
        setBookFallback(data as Book);
      } else {
        setBookLoadError("Không tìm thấy sách của bạn.");
      }
      setIsBookLoading(false);
    };

    fetchBook();

    return () => {
      cancelled = true;
    };
  }, [user?.id, bookId, bookFromQuery, bookFallback, isBookLoading, bookLoadError]);

  // Load settings from localStorage
  useEffect(() => {
    const savedScrollMode = localStorage.getItem("readerScrollMode");
    const savedTheme = localStorage.getItem("readerTheme");
    const savedFontSize = localStorage.getItem("readerFontSize");
    const savedFontFamily = localStorage.getItem("readerFontFamily");
    const savedLineHeight = localStorage.getItem("readerLineHeight");

    if (savedScrollMode) {
      const mode = parseInt(savedScrollMode) as unknown as ScrollMode;
      setScrollMode(mode);
      // Sync plugin with loaded scroll mode
      scrollModePluginInstance.switchScrollMode(mode);
    }
    if (savedTheme) setTheme(savedTheme as ReaderTheme);
    if (savedFontSize) setFontSize(Number(savedFontSize));
    if (savedFontFamily) setFontFamily(savedFontFamily as "sans" | "serif");
    if (savedLineHeight) setLineHeight(Number(savedLineHeight));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load translate history
  useEffect(() => {
    if (!user?.id) return;
    const history = loadTranslateHistory(user.id);
    setTranslateHistory(history);
  }, [user?.id]);

  // Save translate history
  useEffect(() => {
    if (!user?.id) return;
    saveTranslateHistory(user.id, translateHistory);
  }, [translateHistory, user?.id]);

  // Track current page
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Fetch page highlights
  useEffect(() => {
    if (!user?.id || !bookId || !hasVisitedPage) return;

    let active = true;
    const run = async () => {
      const highlights = await fetchPageHighlights(user.id, bookId, currentPage);
      if (!active) return;
      setPageHighlights(highlights);
    };

    void run();
    return () => {
      active = false;
    };
  }, [user?.id, bookId, hasVisitedPage, currentPage]);

  // Fetch all highlights when opening list
  useEffect(() => {
    if (!isHighlightsOpen || !user?.id || !bookId) return;

    let active = true;
    const run = async () => {
      setIsHighlightsLoading(true);
      const highlights = await fetchAllBookHighlights(user.id, bookId);
      if (!active) return;
      setHighlightsList(highlights);
      setIsHighlightsLoading(false);
    };

    void run();
    return () => {
      active = false;
    };
  }, [isHighlightsOpen, user?.id, bookId]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  // Error handler for highlight crash
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const message = String(e?.message ?? "");
      const filename = String(e?.filename ?? "");

      const fromHighlightPlugin = filename.includes("@react-pdf-viewer_highlight");
      const isKnownSelectionCrash =
        message.includes("Invalid array length") ||
        (message.includes("Cannot read properties of null") && message.includes("textContent"));

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

  // Auto-hide UI
  const handleScroll = useCallback(() => {
    setShowUI(false);
    if (hideUITimeout.current) clearTimeout(hideUITimeout.current);
  }, []);

  const handleTap = useCallback(() => {
    setShowUI((prev) => !prev);
  }, []);

  return {
    // Book data
    book,
    bookId,
    fileUrl,
    totalPages,
    numPages,
    pdfBlobUrl,
    setPdfBlobUrl,
    setNumPages,
    
    // User & Profile
    user,
    profile,
    authLoading,
    
    // UI State
    showUI,
    setShowUI,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    
    // Navigation
    currentPage,
    setCurrentPage,
    scrollMode,
    setScrollMode,
    hasVisitedPage,
    setHasVisitedPage,
    
    // Highlights
    pageHighlights,
    setPageHighlights,
    highlightsList,
    setHighlightsList,
    isHighlightsLoading,
    deletingHighlightId,
    setDeletingHighlightId,
    addHighlight,
    deleteHighlight,
    
    // Overlays
    isHighlightsOpen,
    setIsHighlightsOpen,
    isTocOpen,
    setIsTocOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    
    // Translation
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
    
    // Reading progress
    hydratedPage,
    saveNow,
    isHydrated,
    
    // Plugins
    scrollModePluginInstance,
    bookmarkPluginInstance,
    pageNavigationPluginInstance,
    zoomPluginInstance,
    
    // Refs
    pdfWrapperRef,
    currentPageRef,
    didJumpToInitialPageRef,
    
    // Handlers
    handleScroll,
    handleTap,
    endSession,
    navigate,
    toast,
    updateBook,
    
    // Utils
    themeStyles,
    SUPPORTED_TRANSLATE_TARGETS,
    getHighlightAreasFromDb,
    findOverlappingHighlightIds,
    colorToBackground,
    translateText,
    createTranslateHistoryItem,
    loadTranslateHistory,
    saveTranslateHistory,
    fetchPageHighlights,
    fetchAllBookHighlights,
    deleteHighlightFromDb,

    // Book loading helpers
    isBookLoading,
    bookLoadError,
  };
};
