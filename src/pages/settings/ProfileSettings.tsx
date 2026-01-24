import { motion } from "framer-motion";
import { User, Mail, Lock, Link as LinkIcon, Camera, ArrowLeft, Trash2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { uploadAvatar, removeAvatar, isUploading } = useAvatarUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for edit dialogs
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || "Ong chăm chỉ";
  const email = user?.email || "member@bookiebee.com";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (confirm("Bạn có chắc muốn xóa ảnh đại diện?")) {
      await removeAvatar();
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên hiển thị không được để trống",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProfile.mutateAsync({ display_name: newDisplayName.trim() });
      toast({
        title: "Thành công!",
        description: "Tên hiển thị đã được cập nhật",
      });
      setIsEditNameOpen(false);
      setNewDisplayName("");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tên hiển thị",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
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
        description: "Mật khẩu phải có ít nhất 6 ký tự",
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

    setIsPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Thành công!",
        description: "Mật khẩu đã được thay đổi",
      });
      setIsChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thay đổi mật khẩu",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Mock data for display since user might be null or have limited data

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-10 px-4 md:px-8">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-8 mt-4 md:mt-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-nunito font-bold text-slate-800">
              Hồ sơ của bạn
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Quản lý thông tin định danh trên Bookie Bee
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Avatar Section */}
          <div className="relative group flex flex-col items-center justify-center py-10 rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-white/60 shadow-sm overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-[80px] rounded-full" />

            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-4xl bg-gradient-pink text-white">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-slate-800 text-white shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>

              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="absolute top-1 right-1 p-2 rounded-full bg-red-500 text-white shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
              <p className="text-slate-500 text-sm font-medium">@{email.split('@')[0]}</p>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid gap-4">
            <div className="p-4 rounded-2xl bg-white/60 border border-white/50 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                <p className="text-slate-700 font-medium">{email}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 border border-white/50 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Username</p>
                <p className="text-slate-700 font-medium">{displayName}</p>
              </div>
              <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80"
                    onClick={() => setNewDisplayName(displayName)}
                  >
                    Sửa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Đổi tên hiển thị</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Tên hiển thị mới</Label>
                      <Input
                        id="displayName"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="Nhập tên hiển thị"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditNameOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleUpdateDisplayName} disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-14 justify-start px-4 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold gap-3"
                >
                  <Lock className="w-5 h-5 text-slate-400" />
                  Đổi mật khẩu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Đổi mật khẩu</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleChangePassword} disabled={isPasswordLoading}>
                    {isPasswordLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="h-14 justify-start px-4 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold gap-3"
            >
              <LinkIcon className="w-5 h-5 text-slate-400" />
              Liên kết mạng xã hội
            </Button>
          </div>

          <div className="text-center pt-8">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Thành viên từ 2024
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;