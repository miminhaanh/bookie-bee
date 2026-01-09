import { useState, useEffect } from "react";
import { Moon, Sun, Type, AlignJustify, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AppearanceSettings {
  theme: "light" | "dark";
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

const FONT_OPTIONS = [
  { value: "system", label: "Hệ thống", family: "ui-sans-serif, system-ui, sans-serif" },
  { value: "roboto", label: "Roboto", family: "'Roboto', sans-serif" },
  { value: "opensans", label: "Open Sans", family: "'Open Sans', sans-serif" },
  { value: "lora", label: "Lora", family: "'Lora', serif" },
  { value: "merriweather", label: "Merriweather", family: "'Merriweather', serif" },
  { value: "sourcesans", label: "Source Sans 3", family: "'Source Sans 3', sans-serif" },
  { value: "playfair", label: "Playfair Display", family: "'Playfair Display', serif" },
  { value: "notosans", label: "Noto Sans", family: "'Noto Sans', sans-serif" },
];

const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: "light",
  fontFamily: "system",
  fontSize: 16,
  lineHeight: 1.6,
};

const PREVIEW_TEXT = `Đọc sách là một trong những thói quen tuyệt vời nhất mà con người có thể phát triển. Khi đọc sách, bạn không chỉ tiếp thu kiến thức mà còn mở rộng tầm nhìn và khám phá những thế giới mới.

Mỗi cuốn sách là một cánh cửa dẫn đến những chân trời mới. Hãy để những trang sách dẫn dắt bạn trên hành trình khám phá tri thức vô tận.`;

const AppearanceSettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<AppearanceSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;500;700&family=Lora:wght@400;500;700&family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;500;700&family=Playfair+Display:wght@400;500;700&family=Noto+Sans:wght@400;500;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem(`appearance_settings_${user?.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings(parsed);
          setOriginalSettings(parsed);
          
          // Apply theme immediately
          if (parsed.theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // Update setting
  const updateSetting = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Apply theme immediately
    if (key === "theme") {
      if (value === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Get font family CSS
  const getFontFamily = (fontValue: string) => {
    const font = FONT_OPTIONS.find(f => f.value === fontValue);
    return font?.family || FONT_OPTIONS[0].family;
  };

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(
        `appearance_settings_${user?.id}`,
        JSON.stringify(settings)
      );

      setOriginalSettings(settings);
      setHasChanges(false);

      toast({
        title: "Đã lưu!",
        description: "Cài đặt giao diện đã được cập nhật",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Giao diện & Trải nghiệm
          </h1>
          <p className="text-sm text-muted-foreground">
            Tùy chỉnh giao diện đọc sách
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Theme Selection */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Chủ đề
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Chọn giao diện sáng hoặc tối
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateSetting("theme", "light")}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                settings.theme === "light"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Sun className="h-6 w-6 text-amber-600" />
              </div>
              <span className="font-medium text-foreground">Sáng</span>
            </button>
            
            <button
              onClick={() => updateSetting("theme", "dark")}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                settings.theme === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                <Moon className="h-6 w-6 text-slate-300" />
              </div>
              <span className="font-medium text-foreground">Tối</span>
            </button>
          </div>
        </div>

        {/* Font Family */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Type className="h-4 w-4" />
            Kiểu chữ
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Chọn font chữ cho trải nghiệm đọc tốt nhất
          </p>
          <Select
            value={settings.fontFamily}
            onValueChange={(value) => updateSetting("fontFamily", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn font chữ" />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem 
                  key={font.value} 
                  value={font.value}
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Type className="h-4 w-4" />
            Cỡ chữ
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Điều chỉnh kích thước chữ khi đọc
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nhỏ</span>
              <span className="font-medium text-foreground">{settings.fontSize}px</span>
              <span className="text-sm text-muted-foreground">Lớn</span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={(value) => updateSetting("fontSize", value[0])}
              min={12}
              max={28}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>12px</span>
              <span>20px</span>
              <span>28px</span>
            </div>
          </div>
        </div>

        {/* Line Height */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <AlignJustify className="h-4 w-4" />
            Khoảng cách dòng
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Điều chỉnh khoảng cách giữa các dòng
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hẹp</span>
              <span className="font-medium text-foreground">{settings.lineHeight.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">Rộng</span>
            </div>
            <Slider
              value={[settings.lineHeight * 10]}
              onValueChange={(value) => updateSetting("lineHeight", value[0] / 10)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1.2</span>
              <span>1.8</span>
              <span>2.4</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Xem trước
          </h3>
          <div 
            className="p-4 rounded-lg bg-muted/30 border border-border"
            style={{
              fontFamily: getFontFamily(settings.fontFamily),
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
            }}
          >
            <p className="text-foreground whitespace-pre-line">
              {PREVIEW_TEXT}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Đoạn văn trên hiển thị với cài đặt bạn đã chọn
          </p>
        </div>
      </main>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
          <Button
            className="w-full"
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AppearanceSettingsPage;
