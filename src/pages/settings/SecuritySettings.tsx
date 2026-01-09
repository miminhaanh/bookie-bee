import { useState, useEffect } from "react";
import { Shield, Key, Eye, Smartphone, History, Loader2, Monitor, Tablet, ChevronDown, ChevronUp, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LoginSession {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface LoginHistory {
  id: string;
  device: string;
  location: string;
  timestamp: string;
  success: boolean;
}

const SecuritySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Sessions state
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Login history state
  const [showHistoryOpen, setShowHistoryOpen] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Get device info from user agent
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = "Thiết bị không xác định";
    let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

    if (/mobile/i.test(ua)) {
      deviceType = "mobile";
      if (/iPhone/.test(ua)) device = "iPhone";
      else if (/Android/.test(ua)) device = "Android Phone";
      else device = "Điện thoại";
    } else if (/tablet|ipad/i.test(ua)) {
      deviceType = "tablet";
      if (/iPad/.test(ua)) device = "iPad";
      else device = "Máy tính bảng";
    } else {
      if (/Windows/.test(ua)) device = "Windows PC";
      else if (/Mac/.test(ua)) device = "MacOS";
      else if (/Linux/.test(ua)) device = "Linux";
      else device = "Máy tính";
    }

    // Add browser info
    if (/Chrome/.test(ua) && !/Edge/.test(ua)) device += " - Chrome";
    else if (/Firefox/.test(ua)) device += " - Firefox";
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) device += " - Safari";
    else if (/Edge/.test(ua)) device += " - Edge";

    return { device, deviceType };
  };

  // Load current sessions
  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const { device, deviceType } = getDeviceInfo();
      
      const currentSession: LoginSession = {
        id: "current",
        device,
        deviceType,
        location: "Vị trí hiện tại",
        lastActive: "Đang hoạt động",
        isCurrent: true,
      };
      
      setSessions([currentSession]);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load login history
  const loadLoginHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { device } = getDeviceInfo();
      
      const history: LoginHistory[] = [
        {
          id: "1",
          device,
          location: "Việt Nam",
          timestamp: new Date().toISOString(),
          success: true,
        },
      ];
      
      setLoginHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Lỗi",
          description: "Mật khẩu hiện tại không đúng",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Thành công!",
        description: "Mật khẩu đã được thay đổi",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordDialog(false);
    } catch (error) {
      console.error("Password change error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi mật khẩu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Sign out from all devices
  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast({
        title: "Thành công!",
        description: "Đã đăng xuất khỏi tất cả thiết bị",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể đăng xuất. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get device icon
  const getDeviceIcon = (deviceType: "desktop" | "mobile" | "tablet") => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  useEffect(() => {
    if (showSessionsDialog) {
      loadSessions();
    }
  }, [showSessionsDialog]);

  useEffect(() => {
    if (showHistoryOpen) {
      loadLoginHistory();
    }
  }, [showHistoryOpen]);

  return (
    <div className="min-h-screen bg-background pb-20 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Bảo mật & Quyền riêng tư
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý bảo mật tài khoản
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Password */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Mật khẩu
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Đổi mật khẩu</p>
                <p className="text-sm text-muted-foreground">
                  Cập nhật mật khẩu định kỳ để bảo mật
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPasswordDialog(true)}
            >
              Đổi
            </Button>
          </div>
        </div>

        {/* Privacy */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Quyền riêng tư
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    Hiển thị hoạt động
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cho phép người khác xem tiến độ đọc
                  </p>
                </div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Hồ sơ riêng tư</p>
                  <p className="text-sm text-muted-foreground">
                    Chỉ bạn bè mới xem được hồ sơ
                  </p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Devices */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Thiết bị đang đăng nhập
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Quản lý thiết bị</p>
                <p className="text-sm text-muted-foreground">
                  Xem và quản lý các thiết bị đang truy cập
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSessionsDialog(true)}
            >
              Quản lý
            </Button>
          </div>
        </div>

        {/* Login History */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <Collapsible open={showHistoryOpen} onOpenChange={setShowHistoryOpen}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Lịch sử đăng nhập</p>
                  <p className="text-sm text-muted-foreground">
                    Xem lại các lần đăng nhập gần đây
                  </p>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {showHistoryOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="mt-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : loginHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có lịch sử đăng nhập
                </p>
              ) : (
                <div className="space-y-3">
                  {loginHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className={`p-2 rounded-full ${entry.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {entry.device}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{entry.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${entry.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {entry.success ? "Thành công" : "Thất bại"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="flex-1"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Đổi mật khẩu"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sessions Management Dialog */}
      <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thiết bị đang đăng nhập</DialogTitle>
            <DialogDescription>
              Quản lý các thiết bị đang truy cập tài khoản của bạn
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Không có thiết bị nào
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">
                          {session.device}
                        </p>
                        {session.isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.lastActive}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              onClick={handleSignOutAllDevices}
              className="w-full"
            >
              Đăng xuất tất cả thiết bị
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSessionsDialog(false)}
              className="w-full"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default SecuritySettings;
