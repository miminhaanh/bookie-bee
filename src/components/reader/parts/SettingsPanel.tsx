import { X, Sun, Moon, Type, BookOpen, ZoomIn, ZoomOut, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ScrollMode } from "@react-pdf-viewer/core";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHighlights: () => void;
  highlightsCount: number;
  brightness: number;
  onBrightnessChange: (value: number) => void;
  theme: "light" | "sepia" | "dark";
  onThemeChange: (theme: "light" | "sepia" | "dark") => void;
  scrollMode: ScrollMode;
  onScrollModeChange: (mode: ScrollMode) => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
  onOpenHighlights,
  highlightsCount,
  brightness,
  onBrightnessChange,
  theme,
  onThemeChange,
  scrollMode,
  onScrollModeChange,
  zoomLevel,
  onZoomChange,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h2 className="font-serif font-semibold text-lg">Cài đặt đọc</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Settings content */}
        <div className="px-5 pb-8 space-y-6">
          {/* Highlights */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Highlighter className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Highlights</p>
                  <p className="text-xs text-muted-foreground">
                    {highlightsCount > 0 ? `${highlightsCount} ghi chú đã lưu` : "Chưa có highlight"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={onOpenHighlights}>
                Xem
              </Button>
            </div>
          </div>
          {/* Scroll Mode */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Chế độ đọc
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => onScrollModeChange(ScrollMode.Vertical)}
                className={cn(
                  "flex-1 h-12 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2",
                  scrollMode === ScrollMode.Vertical
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-muted-foreground"
                )}
              >
                <AlignVerticalJustifyCenter className="h-4 w-4" />
                <span className="text-sm font-medium">Dọc</span>
              </button>
              <button
                onClick={() => onScrollModeChange(ScrollMode.Horizontal)}
                className={cn(
                  "flex-1 h-12 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2",
                  scrollMode === ScrollMode.Horizontal
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-muted-foreground"
                )}
              >
                <AlignHorizontalJustifyCenter className="h-4 w-4" />
                <span className="text-sm font-medium">Ngang (Lật trang)</span>
              </button>
            </div>
          </div>

          {/* Zoom */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Thu phóng ({Math.round(zoomLevel * 100)}%)
            </label>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg"
                onClick={() => onZoomChange(Math.max(0.5, zoomLevel - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[zoomLevel * 100]}
                onValueChange={([value]) => onZoomChange(value / 100)}
                min={50}
                max={200}
                step={10}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg"
                onClick={() => onZoomChange(Math.min(2, zoomLevel + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Brightness */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Độ sáng
            </label>
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[brightness]}
                onValueChange={([value]) => onBrightnessChange(value)}
                min={30}
                max={100}
                step={5}
                className="flex-1"
              />
              <Sun className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Type className="h-4 w-4" />
              Giao diện
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => onThemeChange("light")}
                className={cn(
                  "flex-1 h-12 rounded-xl border-2 transition-all duration-200",
                  "bg-white",
                  theme === "light"
                    ? "border-primary shadow-md"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <span className="text-sm font-medium text-gray-800">Sáng</span>
              </button>
              <button
                onClick={() => onThemeChange("sepia")}
                className={cn(
                  "flex-1 h-12 rounded-xl border-2 transition-all duration-200",
                  "bg-amber-50",
                  theme === "sepia"
                    ? "border-primary shadow-md"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <span className="text-sm font-medium text-amber-900">Sepia</span>
              </button>
              <button
                onClick={() => onThemeChange("dark")}
                className={cn(
                  "flex-1 h-12 rounded-xl border-2 transition-all duration-200",
                  "bg-gray-900",
                  theme === "dark"
                    ? "border-primary shadow-md"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <span className="text-sm font-medium text-gray-100">Tối</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
