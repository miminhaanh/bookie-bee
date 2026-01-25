import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Check, Bell, Heart, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  readingReminder: boolean;
  reactionComment: boolean;
  communityEvents: boolean;
  newChallenge: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  readingReminder: true,
  reactionComment: true,
  communityEvents: false,
  newChallenge: true,
};

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`notification_settings_${user?.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      setOriginalSettings(parsed);
    }
  }, [user?.id]);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`notification_settings_${user?.id}`, JSON.stringify(settings));
      setOriginalSettings(settings);
      setHasChanges(false);
      
      // Request notification permission if any notification is enabled
      if (Object.values(settings).some(v => v) && "Notification" in window) {
        await Notification.requestPermission();
      }
      
      toast({ title: "Đã lưu! 🔔" });
    } catch {
      toast({ title: "Lỗi", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const notifications = [
    {
      key: "readingReminder" as const,
      icon: Bell,
      emoji: "📚",
      title: "Nhắc đọc sách",
      desc: "Nhắc nhở bạn đọc sách hàng ngày",
      color: "from-blue-100 to-cyan-100",
      iconColor: "text-blue-500",
    },
    {
      key: "reactionComment" as const,
      icon: Heart,
      emoji: "💬",
      title: "Reaction & Comment",
      desc: "Khi có người tương tác bài viết",
      color: "from-pink-100 to-rose-100",
      iconColor: "text-pink-500",
    },
    {
      key: "communityEvents" as const,
      icon: Calendar,
      emoji: "🎉",
      title: "Sự kiện cộng đồng",
      desc: "Thông báo về sự kiện và hoạt động",
      color: "from-purple-100 to-violet-100",
      iconColor: "text-purple-500",
    },
    {
      key: "newChallenge" as const,
      icon: Trophy,
      emoji: "🏆",
      title: "Challenge mới",
      desc: "Thử thách đọc sách mới cho bạn",
      color: "from-amber-100 to-orange-100",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <DashboardLayout mobileTitle="Thông báo">
      <div className="min-h-screen bg-gradient-to-br from-soft-pink/20 via-cream to-peach/20">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted/50 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">🔔 Thông báo</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3">
        {/* Notification Items */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 overflow-hidden">
          {notifications.map((item, index) => (
            <div key={item.key}>
              {index > 0 && <div className="h-px bg-border/30 mx-4" />}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={settings[item.key]}
                  onCheckedChange={(v) => updateSetting(item.key, v)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSettings({
                readingReminder: true,
                reactionComment: true,
                communityEvents: true,
                newChallenge: true,
              });
            }}
            className="flex-1 py-2.5 rounded-xl bg-soft-pink/50 text-sm font-medium text-warm-pink hover:bg-soft-pink/70 transition-colors"
          >
            Bật tất cả
          </button>
          <button
            onClick={() => {
              setSettings({
                readingReminder: false,
                reactionComment: false,
                communityEvents: false,
                newChallenge: false,
              });
            }}
            className="flex-1 py-2.5 rounded-xl bg-muted/50 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Tắt tất cả
          </button>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-muted-foreground py-2">
          <p>💡 Thông báo giúp bạn không bỏ lỡ điều quan trọng</p>
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
            Lưu thay đổi 🔔
          </Button>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
};

export default NotificationSettingsPage;
