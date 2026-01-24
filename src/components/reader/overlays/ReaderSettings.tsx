import { Settings } from "lucide-react";
import { ScrollMode } from "@react-pdf-viewer/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ReaderTheme } from "../utils/readerUtils";
import { themeStyles } from "../utils/readerUtils";

interface ReaderSettingsProps {
  isPdf: boolean;
  scrollMode: ScrollMode;
  onScrollModeChange: (mode: ScrollMode) => void;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
  fontFamily: "sans" | "serif";
  onFontFamilyChange: (font: "sans" | "serif") => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  lineHeight: number;
  onLineHeightChange: (height: number) => void;
}

export const ReaderSettings = ({
  isPdf,
  scrollMode,
  onScrollModeChange,
  theme,
  onThemeChange,
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
  lineHeight,
  onLineHeightChange,
}: ReaderSettingsProps) => {
  return (
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
          {isPdf && (
            <div>
              <Label className="text-sm font-medium">Chế độ đọc</Label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onScrollModeChange(ScrollMode.Vertical)}
                  className={cn(
                    "flex-1 rounded-lg border-2 p-3 text-sm transition-all",
                    scrollMode === ScrollMode.Vertical
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                >
                  Cuộn dọc
                </button>
                <button
                  type="button"
                  onClick={() => onScrollModeChange(ScrollMode.Horizontal)}
                  className={cn(
                    "flex-1 rounded-lg border-2 p-3 text-sm transition-all",
                    scrollMode === ScrollMode.Horizontal
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                >
                  Lướt ngang
                </button>
              </div>
            </div>
          )}

          {/* Theme */}
          <div>
            <Label className="text-sm font-medium">Theme</Label>
            <div className="mt-2 flex gap-2">
              {(Object.entries(themeStyles) as [ReaderTheme, typeof themeStyles.light][]).map(
                ([key, style]) => (
                  <button
                    key={key}
                    onClick={() => onThemeChange(key)}
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
                onClick={() => onFontFamilyChange("sans")}
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
                onClick={() => onFontFamilyChange("serif")}
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
              onValueChange={([v]) => onFontSizeChange(v)}
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
              onValueChange={([v]) => onLineHeightChange(v)}
              min={1.4}
              max={2.4}
              step={0.1}
              className="mt-2"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
