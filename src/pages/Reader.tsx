import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import { useReadingSession } from "@/hooks/useReadingSession";
import { cn } from "@/lib/utils";

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
  
  const hideUITimeout = useRef<NodeJS.Timeout>();
  const { user, loading: authLoading } = useAuth();
  const { books, updateBook } = useBooks();
  const navigate = useNavigate();
  
  // Start reading session tracking
  const { endSession } = useReadingSession(id || "");

  const book = books.find((b) => b.id === id);
  const totalPages = book?.total_pages || 100;

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
    if (book && id) {
      const progress = (currentPage / totalPages) * 100;
      updateBook.mutate({ 
        id, 
        progress,
        current_page: currentPage,
      });
    }
  }, [currentPage, totalPages]);

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
            <span>Trang {currentPage}/{totalPages}</span>
            <span>{Math.round((currentPage / totalPages) * 100)}%</span>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Slider
              value={[currentPage]}
              onValueChange={([v]) => setCurrentPage(v)}
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
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={currentPage >= totalPages}
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