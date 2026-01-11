import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Check, Key, Link2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
    }
  }, [profile]);

  useEffect(() => {
    const changed = displayName !== (profile?.display_name || "");
    setHasChanges(changed);
  }, [displayName, profile]);

  const initials = (profile?.display_name || user?.email || "U").slice(0, 2).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim() || null,
      });
      toast({ title: "Đã lưu! 🐝" });
      setHasChanges(false);
    } catch {
      toast({ title: "Lỗi", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Mật khẩu không khớp", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Mật khẩu tối thiểu 6 ký tự", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await supabase.auth.updateUser({ password: newPassword });
      toast({ title: "Đã đổi mật khẩu! 🔐" });
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "Lỗi", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink/20 via-cream to-peach/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted/50 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">👤 Thông tin cá nhân</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3">
        {/* Avatar */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-warm-pink/30">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-soft-pink/50 text-warm-pink font-bold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-warm-pink text-white flex items-center justify-center shadow-md"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex-1">
              <p className="font-semibold">{profile?.display_name || "Chưa đặt tên"}</p>
              <p className="text-xs text-muted-foreground">Bấm vào ảnh để thay đổi</p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Tên hiển thị
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên của bạn"
              className="h-10 rounded-xl bg-muted/30 border-0"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <Input
              value={user?.email || ""}
              disabled
              className="h-10 rounded-xl bg-muted/50 border-0 text-muted-foreground"
            />
          </div>
        </div>

        {/* Password & Social */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30 space-y-2">
          <button
            onClick={() => setShowPasswordDialog(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-warm-pink" /> Đổi mật khẩu
            </span>
            <span className="text-xs text-muted-foreground">••••••••</span>
          </button>

          <button className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <span className="text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4 text-warm-pink" /> Liên kết mạng xã hội
            </span>
            <span className="text-xs text-muted-foreground">Chưa liên kết</span>
          </button>
        </div>
      </main>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-warm-pink to-coral shadow-lg font-semibold"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Lưu thay đổi 🐝
          </Button>
        </div>
      )}

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="rounded-2xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-warm-pink" /> Đổi mật khẩu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
            <Input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-warm-pink to-coral"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default ProfileSettings;
