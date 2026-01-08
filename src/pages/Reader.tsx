import { useState, useEffect, useCallback, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import { useReadingSession } from "@/hooks/useReadingSession";
import { useHighlights } from "@/hooks/useHighlights";
import { cn } from "@/lib/utils";
import ePub from "epubjs";
import { Document, Page, pdfjs } from "react-pdf";
// Local stylesheet with minimal rules for react-pdf text and annotation layers
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { supabase } from "@/integrations/supabase/client";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ReaderTheme = "light" | "dark" | "sepia" | "green";

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
  const [isPdf, setIsPdf] = useState(false);
  const [isEpub, setIsEpub] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const epubRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectionText, setSelectionText] = useState<string | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  
  const hideUITimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { books, updateBook } = useBooks();
  const navigate = useNavigate();
  
  // Start reading session tracking
  const { endSession } = useReadingSession(id || "");

  const book = books.find((b) => b.id === id);
  const totalPages = book?.total_pages || 100;
  const fileUrl = (book as any)?.file_url || (book as any)?.url || (book as any)?.file || "";

  // Auto-hide UI when scrolling
  const handleScroll = useCallback(() => {
    setShowUI(false);
    if (hideUITimeout.current) clearTimeout(hideUITimeout.current);
  }, []);

  const handleTap = useCallback(() => {
    setShowUI((prev) => !prev);
  }, []);

  // Update progress when page changes
  useEffect(() => {
    if (!book || !id) return;
    const denom = isPdf && numPages ? numPages : totalPages;
    const progress = denom ? (currentPage / denom) * 100 : 0;

    updateBook.mutate({ id, progress, current_page: currentPage });
  }, [currentPage, totalPages, isPdf, numPages]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  // Determine file type
  useEffect(() => {
    const ext = fileUrl.split(".").pop()?.toLowerCase();
    setIsPdf(ext === "pdf");
    setIsEpub(ext === "epub");
  }, [fileUrl]);

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
        rendition && rendition.destroy && rendition.destroy();
        bookObj && bookObj.destroy && bookObj.destroy();
      } catch (e) {
        // ignore
      }
    };
  }, [isEpub, fileUrl]);

  // Try to prefetch PDF into a blob URL to avoid CORS/authorization issues when loading in <Document />
  useEffect(() => {
    let objectUrl: string | null = null;
    let abort = false;

    const tryFetch = async () => {
      if (!isPdf || !fileUrl) return;
      try {
        // If fileUrl looks like a storage path (no protocol), request a signed URL
        const isAbsolute = /^https?:\/\//i.test(fileUrl);
        if (!isAbsolute) {
          // Try createSignedUrl first (works for private buckets). Fallback to public URL.
          const { data: signedData, error: signedError } = await supabase.storage
            .from("book-files")
            .createSignedUrl(fileUrl, 60);

          if (signedError) {
            console.warn("createSignedUrl failed, trying getPublicUrl:", signedError);
            const { data: pubData } = supabase.storage.from("book-files").getPublicUrl(fileUrl);
            if (pubData?.publicUrl) {
              if (!abort) setPdfBlobUrl(pubData.publicUrl);
              return;
            }
            throw signedError;
          }

          if (signedData?.signedUrl) {
            if (!abort) setPdfBlobUrl(signedData.signedUrl);
            return;
          }
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

  // Highlights hook for saving highlights
  const { addHighlight } = useHighlights(id);

  // Capture selection on PDF text layer via onMouseUp handler (attached to container)
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setShowSelectionToolbar(false);
        setSelectionText(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const saveSelection = async (color: "yellow" | "blue" | "red") => {
    if (!selectionText || !id) return;
    try {
      const position = JSON.stringify({ page: currentPage });
      await addHighlight.mutateAsync({
        book_id: id,
        content: selectionText,
        note: null,
        color,
        position,
        chapter: null,
        page_number: currentPage,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to save highlight:", err);
    } finally {
      setShowSelectionToolbar(false);
      setSelectionText(null);
    }
  };

  const cancelSelection = () => {
    setShowSelectionToolbar(false);
    setSelectionText(null);
    const sel = window.getSelection && window.getSelection();
    sel && sel.removeAllRanges();
  };

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
        "min-h-screen transition-colors duration-300",
        currentTheme.bg,
        currentTheme.text
      )}
      onClick={handleTap}
    >
      {/* Top bar */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 safe-area-top",
          showUI ? "translate-y-0" : "-translate-y-full",
          "bg-background/80 backdrop-blur-sm border-b border-border"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              endSession();
              navigate(-1);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-sm font-medium truncate max-w-[200px]">
            {book.title}
          </h1>

          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent onClick={(e) => e.stopPropagation()}>
              <SheetHeader>
                <SheetTitle>Cài đặt đọc</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
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
      </header>

      {/* Content */}
      <main 
        className="px-6 py-20"
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto">
          {isPdf && fileUrl ? (
            <div className="flex justify-center">
              <div ref={pdfContainerRef} className="w-full flex justify-center relative" onMouseUp={(e) => {
                try {
                  const sel = window.getSelection && window.getSelection();
                  if (!sel) return;
                  const text = sel.toString().trim();
                  if (!text || text.length < 2) return;

                  const range = sel.getRangeAt(0);
                  const container = pdfContainerRef.current;
                  if (!range || !container) return;

                  // Ensure selection is inside our PDF container
                  const common = range.commonAncestorContainer;
                  if (!container.contains(common.nodeType === 3 ? common.parentNode as Node : common)) return;

                  // Compute bounding rect relative to container
                  const rect = range.getBoundingClientRect();
                  const containerRect = container.getBoundingClientRect();
                  const top = rect.top - containerRect.top;
                  const left = rect.left - containerRect.left + rect.width / 2; // center toolbar

                  setSelectionText(text);
                  setSelectionRect({ top: Math.max(8, top), left });
                  setShowSelectionToolbar(true);
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn("Selection handler error:", err);
                }
              }}>
                <Document
                  file={pdfBlobUrl ?? fileUrl}
                  onLoadSuccess={(pdf) => {
                    setNumPages(pdf.numPages);
                    setCurrentPage(1);
                  }}
                  onLoadError={(err) => {
                    // helpful debug in console when PDF fails to load
                    // keep UI fallback intact
                    // eslint-disable-next-line no-console
                    console.error("PDF load error:", err);
                  }}
                >
                  <Page pageNumber={currentPage} width={800} renderTextLayer={true} />
                </Document>
                {showSelectionToolbar && selectionRect && (
                  <div
                    className="absolute z-50 flex items-center gap-2 rounded-md bg-white/95 p-2 shadow"
                    style={{ top: selectionRect.top, left: selectionRect.left, transform: "translate(-50%, -120%)" }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => saveSelection("yellow")} className="h-6 w-6 rounded bg-yellow-300" aria-label="Yellow" />
                    <button onClick={() => saveSelection("blue")} className="h-6 w-6 rounded bg-blue-300" aria-label="Blue" />
                    <button onClick={() => saveSelection("red")} className="h-6 w-6 rounded bg-red-300" aria-label="Red" />
                    <button onClick={cancelSelection} className="text-sm text-muted-foreground ml-2">Hủy</button>
                  </div>
                )}
              </div>
            </div>
          ) : isEpub && fileUrl ? (
            <div style={{ height: '80vh' }} ref={epubRef} />
          ) : (
            <article
              className={cn(
                "max-w-2xl mx-auto prose prose-lg",
                fontFamily === "serif" ? "font-serif" : "font-sans",
                currentTheme.text
              )}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
              }}
              dangerouslySetInnerHTML={{ __html: sampleContent }}
            />
          )}
        </div>
      </main>

      {/* Bottom bar */}
      <footer 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 safe-area-bottom",
          showUI ? "translate-y-0" : "translate-y-full",
          "bg-background/80 backdrop-blur-sm border-t border-border"
        )}
      >
        <div className="px-4 py-3">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Trang {currentPage}/{isPdf && numPages ? numPages : totalPages}</span>
            <span>{Math.round((currentPage / (isPdf && numPages ? numPages : totalPages)) * 100)}%</span>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (isPdf) setCurrentPage((p) => Math.max(1, p - 1));
                else if (isEpub && renditionRef.current) renditionRef.current.prev();
              }}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Slider
              value={[currentPage]}
              onValueChange={([v]) => setCurrentPage(v)}
              min={1}
              max={isPdf && numPages ? numPages : totalPages}
              step={1}
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (isPdf && numPages) setCurrentPage((p) => Math.min(numPages, p + 1));
                else if (isEpub && renditionRef.current) renditionRef.current.next();
                else setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={currentPage >= (isPdf && numPages ? numPages : totalPages)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Reader;