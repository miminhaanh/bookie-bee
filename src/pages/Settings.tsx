import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Moon, Sun, LogOut, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [isDark, setIsDark] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({ display_name: displayName });
      toast({
        title: "Cập nhật thành công!",
        description: "Thông tin của bạn đã được lưu.",
      });
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const initials = (profile?.display_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý tài khoản của bạn
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile section */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Hồ sơ</h3>
          
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md">
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div>
              <p className="font-medium text-foreground">{profile?.display_name || "Chưa đặt tên"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Tên hiển thị</Label>
            <div className="flex gap-2">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên của bạn"
              />
              <Button 
                onClick={handleUpdateProfile} 
                disabled={isSubmitting || !displayName.trim()}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
              </Button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Giao diện</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">Chế độ tối</p>
                <p className="text-sm text-muted-foreground">Bật chế độ tối cho ứng dụng</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </div>

        {/* Reader defaults */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Cài đặt đọc sách</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Theme mặc định</p>
              <p className="text-sm text-muted-foreground capitalize">{profile?.default_reader_theme || "Light"}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Font mặc định</p>
              <p className="text-sm text-muted-foreground capitalize">{profile?.default_font_family || "Sans-serif"}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Cỡ chữ mặc định</p>
              <p className="text-sm text-muted-foreground">{profile?.default_font_size || 16}px</p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;