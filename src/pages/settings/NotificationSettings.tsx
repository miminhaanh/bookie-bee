import { useState, useEffect } from "react";
import { 
  Bell, 
  Mail, 
  BookOpen, 
  Flame, 
  Users, 
  TrendingUp, 
  Smartphone, 
  Clock,
  Loader2,
  Check
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettings {
  // Reading notifications
  dailyReminder: boolean;
  reminderTimes: string[];
  streakReminder: boolean;
  
  // New books notifications  
  followingNewBooks: boolean;
  trendingBooks: boolean;
  
  // Channels
  pushEnabled: boolean;
  emailEnabled: boolean;
  emailNewsletter: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: true,
  reminderTimes: ["09:00", "15:00", "21:00"],
  streakReminder: true,
  followingNewBooks: true,
  trendingBooks: false,
  pushEnabled: true,
  emailEnabled: false,
  emailNewsletter: false,
};

const REMINDER_TIME_OPTIONS = [
  { value: "09:00", label: "9:00 AM", description: "Buổi sáng" },
  { value: "15:00", label: "3:00 PM", description: "Buổi chiều" },
  { value: "21:00", label: "9:00 PM", description: "Buổi tối" },
];

const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage or database
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Try to load from localStorage first
        const savedSettings = localStorage.getItem(`notification_settings_${user?.id}`);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
          setOriginalSettings(parsed);
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

  // Update a setting
  const updateSetting = <K extends keyof NotificationSettings>(
    key: K, 
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Toggle reminder time
  const toggleReminderTime = (time: string) => {
    setSettings(prev => {
      const currentTimes = prev.reminderTimes;
      if (currentTimes.includes(time)) {
        // Don't allow removing all times if daily reminder is enabled
        if (currentTimes.length === 1 && prev.dailyReminder) {
          toast({
            title: "Không thể bỏ chọn",
            description: "Cần ít nhất một thời gian nhắc nhở",
            variant: "destructive",
          });
          return prev;
        }
        return { ...prev, reminderTimes: currentTimes.filter(t => t !== time) };
      } else {
        return { ...prev, reminderTimes: [...currentTimes, time].sort() };
      }
    });
  };

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(
        `notification_settings_${user?.id}`,
        JSON.stringify(settings)
      );

      // Request push notification permission if enabled
      if (settings.pushEnabled && "Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast({
            title: "Quyền thông báo bị từ chối",
            description: "Vui lòng bật quyền thông báo trong cài đặt trình duyệt",
            variant: "destructive",
          });
          updateSetting("pushEnabled", false);
          return;
        }
      }

      // Schedule daily reminders if enabled
      if (settings.dailyReminder && settings.pushEnabled) {
        scheduleReminders(settings.reminderTimes);
      }

      setOriginalSettings(settings);
      setHasChanges(false);

      toast({
        title: "Đã lưu!",
        description: "Cài đặt thông báo đã được cập nhật",
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

  // Schedule reminders (simplified - in production would use service worker)
  const scheduleReminders = (times: string[]) => {
    // Clear existing scheduled notifications
    if ("serviceWorker" in navigator && "Notification" in window) {
      console.log("Scheduling reminders for:", times);
      // In a real app, this would register with a service worker
      // For now, we'll show a demo notification
      
      times.forEach(time => {
        const [hours, minutes] = time.split(":").map(Number);
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const delay = scheduledTime.getTime() - now.getTime();
        
        // Only schedule if within 24 hours (for demo)
        if (delay < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            if (Notification.permission === "granted") {
              new Notification("📚 Đến giờ đọc sách rồi!", {
                body: "Hãy dành ít phút để đọc sách và duy trì chuỗi đọc của bạn nhé!",
                icon: "/favicon.ico",
                tag: `reading-reminder-${time}`,
              });
            }
          }, delay);
        }
      });
    }
  };

  // Request push permission and show test notification
  const testPushNotification = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Không hỗ trợ",
        description: "Trình duyệt của bạn không hỗ trợ thông báo đẩy",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("📚 Thông báo thử nghiệm", {
        body: "Thông báo đẩy đang hoạt động tốt!",
        icon: "/favicon.ico",
      });
      toast({
        title: "Thành công!",
        description: "Đã gửi thông báo thử nghiệm",
      });
    } else {
      toast({
        title: "Quyền bị từ chối",
        description: "Vui lòng bật thông báo trong cài đặt trình duyệt",
        variant: "destructive",
      });
      updateSetting("pushEnabled", false);
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
            Cài đặt Thông báo
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông báo của bạn
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Reading Notifications */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Thông báo đọc sách
          </h3>
          
          <div className="space-y-5">
            {/* Daily Reading Reminder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      Nhắc nhở đọc sách hàng ngày
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tự động gửi thông báo nhắc bạn đọc sách mỗi ngày
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={settings.dailyReminder}
                  onCheckedChange={(checked) => updateSetting("dailyReminder", checked)}
                />
              </div>
            </div>

            {/* Streak Reminder */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-foreground">
                    Chuỗi đọc sách
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Thông báo khi sắp mất chuỗi đọc liên tục
                  </p>
                </div>
              </div>
              <Switch 
                checked={settings.streakReminder}
                onCheckedChange={(checked) => updateSetting("streakReminder", checked)}
              />
            </div>
          </div>
        </div>

        {/* New Books Notifications */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Thông báo sách mới
          </h3>
          
          <div className="space-y-4">
            {/* Following New Books */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    Sách từ người theo dõi
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sách mới từ những tài khoản bạn theo dõi
                  </p>
                </div>
              </div>
              <Switch 
                checked={settings.followingNewBooks}
                onCheckedChange={(checked) => updateSetting("followingNewBooks", checked)}
              />
            </div>

            {/* Trending Books */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    Sách bán chạy & xu hướng
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Thông báo về các sách đang hot
                  </p>
                </div>
              </div>
              <Switch 
                checked={settings.trendingBooks}
                onCheckedChange={(checked) => updateSetting("trendingBooks", checked)}
              />
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Kênh thông báo
          </h3>
          
          <div className="space-y-4">
            {/* Push Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      Thông báo đẩy
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo trực tiếp trên thiết bị
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => updateSetting("pushEnabled", checked)}
                />
              </div>
              
              {settings.pushEnabled && (
                <div className="ml-8">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={testPushNotification}
                  >
                    Gửi thông báo thử
                  </Button>
                </div>
              )}
            </div>

            {/* Email Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      Email
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo qua email
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => {
                    updateSetting("emailEnabled", checked);
                    if (!checked) {
                      updateSetting("emailNewsletter", false);
                    }
                  }}
                />
              </div>

              {settings.emailEnabled && (
                <div className="ml-8 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="newsletter"
                      checked={settings.emailNewsletter}
                      onCheckedChange={(checked) => 
                        updateSetting("emailNewsletter", checked as boolean)
                      }
                    />
                    <div className="space-y-1">
                      <Label 
                        htmlFor="newsletter" 
                        className="font-medium text-foreground cursor-pointer"
                      >
                        Nhận bản tin & cập nhật
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận email về sách mới, khuyến mãi và cập nhật hàng tuần
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User email info */}
        {settings.emailEnabled && user?.email && (
          <div className="rounded-xl bg-muted/30 p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              Email thông báo sẽ được gửi đến:
            </p>
            <p className="font-medium text-foreground mt-1">{user.email}</p>
          </div>
        )}
      </main>

      {/* Save Button - Fixed at bottom */}
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

export default NotificationSettings;
