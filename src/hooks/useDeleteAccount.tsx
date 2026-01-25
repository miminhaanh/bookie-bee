import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface DeleteProgress {
  step: string;
  progress: number;
  total: number;
}

export const useDeleteAccount = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<DeleteProgress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = async () => {
    if (!user?.id) {
      throw new Error("No user logged in");
    }

    setIsDeleting(true);
    const totalSteps = 4;
    let currentStep = 0;

    const updateProgress = (step: string) => {
      currentStep += 1;
      setProgress({ step, progress: currentStep, total: totalSteps });
    };

    try {
      updateProgress("Đang gửi yêu cầu xóa tài khoản...");

      // Ensure access token is fresh
      await supabase.auth.refreshSession();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("User not authenticated");
      }

      // TEMP debug log (remove after verification)
      console.log("access_token", session.access_token);

      if (!session.access_token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const { error } = await supabase.functions.invoke("delete-user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) {
        throw new Error(error.message || "Không thể xóa tài khoản");
      }

      updateProgress("Đang xóa dữ liệu cục bộ...");
      localStorage.removeItem(`reading_settings_${user.id}`);
      localStorage.removeItem(`privacy_settings_${user.id}`);
      localStorage.removeItem(`notification_settings_${user.id}`);
      localStorage.removeItem(`translate_history_${user.id}`);

      updateProgress("Đang đăng xuất...");
      await supabase.auth.signOut({ scope: "global" });

      updateProgress("Hoàn tất");

      toast({
        title: "Tài khoản đã được xóa",
        description: "Tất cả dữ liệu của bạn đã bị xóa vĩnh viễn.",
      });

      return true;
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "Lỗi xóa tài khoản",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsDeleting(false);
      setProgress(null);
    }
  };

  return {
    deleteAccount,
    isDeleting,
    progress,
  };
};
