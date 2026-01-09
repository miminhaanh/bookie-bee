import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, Trash2, Calendar, Phone, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useToast } from "@/hooks/use-toast";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { uploadAvatar, removeAvatar, isUploading } = useAvatarUpload();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setDateOfBirth(profile.date_of_birth || "");
      setPhoneNumber(profile.phone_number || "");
      setGender(profile.gender || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const initials = (profile?.display_name || user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim() || null,
        date_of_birth: dateOfBirth || null,
        phone_number: phoneNumber.trim() || null,
        gender: gender || null,
        bio: bio.trim() || null,
      });
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

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d+\s-]/g, "");
    setPhoneNumber(value);
  };

  return (
    <div className="min-h-screen bg-background pb-20 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Thông tin cá nhân
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý hồ sơ của bạn
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Avatar section */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Ảnh đại diện
          </h3>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
          />

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="absolute -bottom-1 -right-1 rounded-full bg-primary p-2 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Tải ảnh lên
                  </DropdownMenuItem>
                  {profile?.avatar_url && (
                    <DropdownMenuItem
                      onClick={removeAvatar}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa avatar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <p className="font-medium text-foreground">
                {profile?.display_name || "Chưa đặt tên"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Thông tin cơ bản
          </h3>

          <div className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Tên hiển thị
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên của bạn"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Ngày sinh
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Số điện thoại
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="+84 xxx xxx xxx"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Giới tính
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                  <SelectItem value="prefer_not_to_say">Không muốn tiết lộ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Giới thiệu bản thân
          </h3>

          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Tiểu sử
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Viết vài dòng giới thiệu về bản thân..."
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500 ký tự
            </p>
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Thông tin tài khoản
          </h3>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Email không thể thay đổi
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleUpdateProfile}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfileSettings;
