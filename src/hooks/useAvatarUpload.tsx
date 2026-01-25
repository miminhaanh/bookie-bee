import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import { useToast } from "./use-toast";

export const useAvatarUpload = () => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để thay đổi avatar",
        variant: "destructive",
      });
      return null;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Lỗi",
        description: "Kích thước file không được vượt quá 5MB",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);

    try {
      // Generate unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      await updateProfile.mutateAsync({ avatar_url: avatarUrl });

      toast({
        title: "Thành công!",
        description: "Avatar của bạn đã được cập nhật",
      });

      return avatarUrl;
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lên avatar. Vui lòng thử lại.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user?.id) return;

    setIsUploading(true);

    try {
      await updateProfile.mutateAsync({ avatar_url: null });

      toast({
        title: "Thành công!",
        description: "Avatar đã được xóa",
      });
    } catch (error) {
      console.error("Avatar remove error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa avatar. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    isUploading,
  };
};
