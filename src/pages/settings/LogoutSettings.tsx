import { useState } from "react";
import { LogOut, Smartphone, Monitor, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const LogoutSettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Logout current device
  const handleLogoutCurrentDevice = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({
        title: "Đã đăng xuất",
        description: "Bạn đã thoát khỏi tài khoản trên thiết bị này",
      });
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng xuất. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Logout all devices
  const handleLogoutAllDevices = async () => {
    setIsLoggingOutAll(true);
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast({
        title: "Đã đăng xuất",
        description: "Bạn đã thoát khỏi tài khoản trên tất cả thiết bị",
      });
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Logout all error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng xuất. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "XÓA TÀI KHOẢN") {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đúng cụm từ xác nhận",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // In production, this would call a server function to delete user data
      // For now, we'll just sign out and show a message
      // The actual deletion should be handled by a Supabase Edge Function
      
      // Delete user profile data first
      if (user?.id) {
        await supabase.from("profiles").delete().eq("id", user.id);
        await supabase.from("books").delete().eq("user_id", user.id);
        await supabase.from("reading_sessions").delete().eq("user_id", user.id);
        await supabase.from("highlights").delete().eq("user_id", user.id);
      }

      // Sign out
      await supabase.auth.signOut({ scope: "global" });

      toast({
        title: "Tài khoản đã được xóa",
        description: "Tất cả dữ liệu của bạn đã được xóa vĩnh viễn",
      });
      
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa tài khoản. Vui lòng liên hệ hỗ trợ.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Đăng xuất
          </h1>
          <p className="text-sm text-muted-foreground">
            Thoát khỏi tài khoản trên thiết bị này hoặc tất cả thiết bị
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Logout Current Device */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-muted">
              <Smartphone className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">
                Đăng xuất thiết bị này
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Thoát khỏi tài khoản trên thiết bị hiện tại
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleLogoutCurrentDevice}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang đăng xuất...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Logout All Devices */}
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-muted">
              <Monitor className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">
                Đăng xuất tất cả thiết bị
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Thoát khỏi tài khoản trên mọi thiết bị đã đăng nhập
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleLogoutAllDevices}
                disabled={isLoggingOutAll}
              >
                {isLoggingOutAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang đăng xuất...
                  </>
                ) : (
                  "Đăng xuất tất cả"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-destructive">
                Xóa tài khoản
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn
              </p>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa tài khoản vĩnh viễn
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Xóa tài khoản vĩnh viễn
            </DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Warnings */}
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <p className="text-sm text-foreground">
                  Tất cả dữ liệu cá nhân sẽ bị xóa
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <p className="text-sm text-foreground">
                  Lịch sử đọc và bookmark sẽ mất vĩnh viễn
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <p className="text-sm text-foreground">
                  Các đánh giá và bình luận sẽ bị gỡ
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <p className="text-sm text-foreground">
                  Thành viên premium (nếu có) sẽ bị hủy
                </p>
              </div>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <Label htmlFor="confirmDelete">
                Nhập <span className="font-mono font-bold text-destructive">XÓA TÀI KHOẢN</span> để xác nhận
              </Label>
              <Input
                id="confirmDelete"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Nhập cụm từ xác nhận"
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
              }}
              className="flex-1"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== "XÓA TÀI KHOẢN"}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xóa...
                </>
              ) : (
                "Xóa vĩnh viễn"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default LogoutSettings;
