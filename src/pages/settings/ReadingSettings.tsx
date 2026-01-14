import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Type, Loader2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReadingSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  readingBackground: "light" | "dark" | "sepia";
  nightMode: boolean;
  pageFlipEffect: boolean;
  language: string;
}

const FONT_OPTIONS = [
  { value: "nunito", label: "Nunito", family: "'Nunito', sans-serif" },
  { value: "serif", label: "Serif", family: "Georgia, serif" },
  { value: "sans", label: "Sans", family: "system-ui, sans-serif" },
  { value: "mono", label: "Mono", family: "monospace" },
];

const BG_OPTIONS = [
  { value: "light", icon: "☀️", label: "Sáng", bg: "bg-white", text: "text-gray-900" },
  { value: "dark", icon: "🌙", label: "Tối", bg: "bg-gray-900", text: "text-gray-100" },
  { value: "sepia", icon: "🍯", label: "Ấm", bg: "bg-amber-50", text: "text-amber-900" },
];

const DEFAULT_SETTINGS: ReadingSettings = {
  fontFamily: "nunito",
  fontSize: 16,
  lineHeight: 1.6,
  readingBackground: "light",
  nightMode: false,
  pageFlipEffect: true,
  language: "vi",
};

const LANGUAGE_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

const ReadingSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, updateProfile } = useProfile();
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`reading_settings_${user?.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      setOriginalSettings(parsed);
    }
  }, [user?.id]);

  // Hydrate language from Supabase profile (source of truth for language)
  useEffect(() => {
    const lang = profile?.language;
    if (!lang) return;
    setSettings((prev) => ({ ...prev, language: lang }));
    setOriginalSettings((prev) => ({ ...prev, language: lang }));
  }, [profile?.language]);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const updateSetting = <K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`reading_settings_${user?.id}`, JSON.stringify(settings));

      if (user?.id) {
        await updateProfile.mutateAsync({ language: settings.language });
      }

      setOriginalSettings(settings);
      setHasChanges(false);
      toast({ title: "Đã lưu! 📖" });
    } catch {
      toast({ title: "Lỗi", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getFontFamily = (v: string) => FONT_OPTIONS.find(f => f.value === v)?.family || FONT_OPTIONS[0].family;
  const getBgStyle = (v: string) => BG_OPTIONS.find(b => b.value === v) || BG_OPTIONS[0];

  return (
    <DashboardLayout mobileTitle="Đọc sách">
      <div className="min-h-screen bg-gradient-to-br from-soft-pink/20 via-cream to-peach/20">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted/50 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">📖 Cài đặt đọc sách</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3">
        {/* Language */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">🌐 Ngôn ngữ</span>
          </div>
          <Select
            value={settings.language}
            onValueChange={(v) => updateSetting("language", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn ngôn ngữ" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            Ngôn ngữ sẽ được lưu vào hồ sơ để dùng xuyên suốt trên mọi thiết bị.
          </p>
        </div>

        {/* Font Selection */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-warm-pink" />
            <span className="text-sm font-medium">Kiểu chữ</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                onClick={() => updateSetting("fontFamily", font.value)}
                style={{ fontFamily: font.family }}
                className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                  settings.fontFamily === font.value
                    ? "bg-gradient-to-br from-warm-pink to-coral text-white shadow-sm"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size & Line Height */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">🔤 Cỡ chữ</span>
              <span className="text-xs font-bold text-warm-pink bg-soft-pink/50 px-2 py-0.5 rounded-full">
                {settings.fontSize}px
              </span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={(v) => updateSetting("fontSize", v[0])}
              min={12}
              max={24}
              step={1}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">📏 Giãn dòng</span>
              <span className="text-xs font-bold text-warm-pink bg-soft-pink/50 px-2 py-0.5 rounded-full">
                {settings.lineHeight.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.lineHeight * 10]}
              onValueChange={(v) => updateSetting("lineHeight", v[0] / 10)}
              min={12}
              max={22}
              step={1}
            />
          </div>
        </div>

        {/* Reading Background */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <span className="text-sm font-medium mb-3 block">🎨 Màu nền đọc</span>
          <div className="flex gap-2">
            {BG_OPTIONS.map((bg) => (
              <button
                key={bg.value}
                onClick={() => updateSetting("readingBackground", bg.value as "light" | "dark" | "sepia")}
                className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${bg.bg} border-2 ${
                  settings.readingBackground === bg.value 
                    ? "border-warm-pink shadow-md" 
                    : "border-transparent"
                }`}
              >
                <span className="text-lg">{bg.icon}</span>
                <span className={`text-xs font-medium ${bg.text}`}>{bg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-warm-pink" />
              <span className="text-sm">Chế độ ban đêm</span>
            </div>
            <Switch
              checked={settings.nightMode}
              onCheckedChange={(v) => updateSetting("nightMode", v)}
            />
          </div>
          <div className="h-px bg-border/30" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warm-pink" />
              <span className="text-sm">Hiệu ứng lật trang</span>
            </div>
            <Switch
              checked={settings.pageFlipEffect}
              onCheckedChange={(v) => updateSetting("pageFlipEffect", v)}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <span className="text-xs text-muted-foreground mb-2 block">👀 Xem trước</span>
          <div 
            className={`p-4 rounded-xl ${getBgStyle(settings.readingBackground).bg} border border-border/30`}
            style={{
              fontFamily: getFontFamily(settings.fontFamily),
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
            }}
          >
            <p className={getBgStyle(settings.readingBackground).text}>
              "Mỗi cuốn sách là một cánh cửa mở ra thế giới mới..."
            </p>
          </div>
        </div>
      </main>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 left-4 right-4 z-40 md:left-[calc(var(--sidebar-width)+1.5rem)] md:right-6">
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-warm-pink to-coral shadow-lg font-semibold"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Lưu thay đổi 📖
          </Button>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
};

export default ReadingSettingsPage;
