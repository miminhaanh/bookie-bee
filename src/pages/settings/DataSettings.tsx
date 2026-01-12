import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Cloud, Download, Trash2, Smartphone, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DataSettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      const now = new Date().toLocaleString("vi-VN");
      setLastSync(now);
      toast({ title: "Đã đồng bộ! ☁️", description: `Lần cuối: ${now}` });
    } catch {
      toast({ title: "Lỗi đồng bộ", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Get user data
      const readingSettings = localStorage.getItem(`reading_settings_${user?.id}`);
      const privacySettings = localStorage.getItem(`privacy_settings_${user?.id}`);
      const notificationSettings = localStorage.getItem(`notification_settings_${user?.id}`);

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: user?.id,
        email: user?.email,
        settings: {
          reading: readingSettings ? JSON.parse(readingSettings) : null,
          privacy: privacySettings ? JSON.parse(privacySettings) : null,
          notification: notificationSettings ? JSON.parse(notificationSettings) : null,
        },
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookie-bee-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Đã xuất dữ liệu! 📥" });
    } catch {
      toast({ title: "Lỗi xuất dữ liệu", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "XÓA TÀI KHOẢN") {
      toast({ title: "Nhập đúng cụm từ để xác nhận", variant: "destructive" });
      return;
    }
    setIsDeleting(true);
    try {
      // Delete user data
      if (user?.id) {
        await supabase.from("profiles").delete().eq("id", user.id);
        await supabase.from("books").delete().eq("user_id", user.id);
        await supabase.from("reading_sessions").delete().eq("user_id", user.id);
        await supabase.from("highlights").delete().eq("user_id", user.id);
        
        // Clear local storage
        localStorage.removeItem(`reading_settings_${user.id}`);
        localStorage.removeItem(`privacy_settings_${user.id}`);
        localStorage.removeItem(`notification_settings_${user.id}`);
      }

      await supabase.auth.signOut({ scope: "global" });
      navigate("/auth", { replace: true });
    } catch {
      toast({ title: "Lỗi xóa tài khoản", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout mobileTitle="Dữ liệu">
      <div className="min-h-screen bg-gradient-to-br from-soft-pink/20 via-cream to-peach/20">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted/50 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">☁️ Dữ liệu & Đồng bộ</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3">
        {/* Sync */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Đồng bộ thiết bị</p>
                <p className="text-xs text-muted-foreground">
                  {lastSync ? `Lần cuối: ${lastSync}` : "Chưa đồng bộ"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              size="sm"
              variant="outline"
              className="rounded-xl h-9"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="w-4 h-4" />
              <span>Thiết bị hiện tại</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-medium">
                Đã kết nối
              </span>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Xuất dữ liệu đọc</p>
              <p className="text-xs text-muted-foreground">Tải về dữ liệu cá nhân của bạn</p>
            </div>
            {isExporting && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </button>
        </div>

        {/* Delete Account */}
        <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-4 border border-red-200 dark:border-red-900/50">
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-600">Xóa tài khoản</p>
              <p className="text-xs text-red-400">Xóa vĩnh viễn tài khoản và dữ liệu</p>
            </div>
          </button>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/50">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Lưu ý quan trọng</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                Sau khi xóa tài khoản, tất cả dữ liệu sẽ bị mất vĩnh viễn và không thể khôi phục. 
                Hãy xuất dữ liệu trước nếu cần.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" /> Xóa tài khoản
            </DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Tất cả sách, ghi chú và dữ liệu đọc sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Nhập <span className="font-bold text-red-600">XÓA TÀI KHOẢN</span> để xác nhận
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Nhập XÓA TÀI KHOẢN"
              className="h-11 rounded-xl"
            />
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== "XÓA TÀI KHOẢN"}
              variant="destructive"
              className="w-full h-11 rounded-xl"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Xóa tài khoản
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default DataSettingsPage;
