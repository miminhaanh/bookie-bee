import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Check, Eye, EyeOff, Sparkles, BookOpen, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PrivacySettings {
  showCurrentlyReading: "everyone" | "friends" | "none";
  showReviews: "everyone" | "friends" | "none";
  showCommunityActivity: "everyone" | "friends" | "none";
  enableAISuggestions: boolean;
}

const VISIBILITY_OPTIONS = [
  { value: "everyone", label: "🌍 Mọi người", desc: "Ai cũng thấy" },
  { value: "friends", label: "👥 Bạn bè", desc: "Chỉ bạn bè" },
  { value: "none", label: "🔒 Chỉ mình tôi", desc: "Riêng tư" },
];

const DEFAULT_SETTINGS: PrivacySettings = {
  showCurrentlyReading: "friends",
  showReviews: "everyone",
  showCommunityActivity: "friends",
  enableAISuggestions: true,
};

const PrivacySettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`privacy_settings_${user?.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      setOriginalSettings(parsed);
    }
  }, [user?.id]);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const updateSetting = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`privacy_settings_${user?.id}`, JSON.stringify(settings));
      setOriginalSettings(settings);
      setHasChanges(false);
      toast({ title: "Đã lưu! 🔒" });
    } catch {
      toast({ title: "Lỗi", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const VisibilitySelect = ({ 
    value, 
    onChange 
  }: { 
    value: string; 
    onChange: (v: "everyone" | "friends" | "none") => void;
  }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32 h-8 rounded-lg bg-muted/30 border-0 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {VISIBILITY_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <DashboardLayout mobileTitle="Riêng tư">
      <div className="min-h-screen bg-gradient-to-br from-soft-pink/20 via-cream to-peach/20">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted/50 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">🔒 Quyền riêng tư</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3">
        {/* Visibility Settings */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-warm-pink" />
            <span className="text-sm font-medium">Ai có thể xem</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Sách đang đọc</span>
              </div>
              <VisibilitySelect 
                value={settings.showCurrentlyReading}
                onChange={(v) => updateSetting("showCurrentlyReading", v)}
              />
            </div>

            <div className="h-px bg-border/30" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Review của tôi</span>
              </div>
              <VisibilitySelect 
                value={settings.showReviews}
                onChange={(v) => updateSetting("showReviews", v)}
              />
            </div>

            <div className="h-px bg-border/30" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Hoạt động cộng đồng</span>
              </div>
              <VisibilitySelect 
                value={settings.showCommunityActivity}
                onChange={(v) => updateSetting("showCommunityActivity", v)}
              />
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Gợi ý AI cá nhân hóa</p>
                <p className="text-xs text-muted-foreground">Nhận đề xuất sách thông minh</p>
              </div>
            </div>
            <Switch
              checked={settings.enableAISuggestions}
              onCheckedChange={(v) => updateSetting("enableAISuggestions", v)}
            />
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-soft-pink/20 rounded-2xl p-4 border border-warm-pink/20">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-medium text-foreground">Bảo vệ quyền riêng tư</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bạn có toàn quyền kiểm soát ai có thể xem hoạt động đọc sách của mình. 
                Thay đổi có hiệu lực ngay lập tức.
              </p>
            </div>
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
            Lưu thay đổi 🔒
          </Button>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
};

export default PrivacySettingsPage;
