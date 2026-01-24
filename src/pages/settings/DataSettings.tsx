import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud, Download, Trash2, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const DataSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { books } = useBooks();
  const { toast } = useToast();
  const [lastSyncTime, setLastSyncTime] = useState("Vừa xong");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Update sync time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTime("Vừa xong");
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExportData = async () => {
    if (!user?.id) return;

    setIsExporting(true);
    try {
      // Fetch all user data
      const [
        { data: profile },
        { data: dailyReading },
        { data: sessions },
        { data: highlights },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("daily_reading").select("*").eq("user_id", user.id),
        supabase.from("reading_sessions").select("*").eq("user_id", user.id),
        supabase.from("highlights").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile,
        books: books.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          progress: b.progress,
          current_page: b.current_page,
          total_pages: b.total_pages,
          status: b.status,
        })),
        daily_reading: dailyReading,
        reading_sessions: sessions,
        highlights,
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookie-bee-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Thành công!",
        description: "Dữ liệu của bạn đã được xuất",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xuất dữ liệu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "XÓA TÀI KHOẢN") {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập chính xác 'XÓA TÀI KHOẢN' để xác nhận",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Call the delete-user edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete account");
      }

      toast({
        title: "Tài khoản đã được xóa",
        description: "Dữ liệu của bạn đã được xóa vĩnh viễn",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa tài khoản. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeleteConfirmText("");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-10 px-4 md:px-8">
        {/* Header */}
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
              Dữ liệu & Đồng bộ
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Quản lý dữ liệu đám mây của bạn
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Sync Status Card */}
          <section className="bg-gradient-to-br from-sky-50 to-white p-6 rounded-3xl border border-sky-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Cloud className="w-32 h-32 text-sky-500" />
            </div>

            <div className="relative z-10 flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-inner">
                <RefreshCw className="w-6 h-6 animate-[spin_3s_linear_infinite]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-700">Đồng bộ đám mây đang bật</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Dữ liệu của bạn được tự động sao lưu an toàn.
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs font-bold text-sky-600 bg-sky-100/50 px-3 py-1.5 rounded-full w-fit">
                  <ShieldCheck className="w-3 h-3" />
                  Đồng bộ lần cuối: {lastSyncTime}
                </div>
              </div>
            </div>
          </section>

          {/* Actions List */}
          <section className="bg-white/60 rounded-3xl border border-white/60 shadow-sm backdrop-blur-sm overflow-hidden">
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full p-4 hover:bg-white transition-colors flex items-center gap-4 border-b border-slate-100 disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-bold text-slate-700">
                  {isExporting ? "Đang xuất dữ liệu..." : "Xuất dữ liệu cá nhân"}
                </h4>
                <p className="text-xs text-slate-500">Tải về bản sao lưu gồm lịch sử đọc và ghi chú</p>
              </div>
            </button>
          </section>

          {/* Danger Zone */}
          <div className="pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Vùng nguy hiểm</h4>
            <div className="bg-red-50/50 border border-red-100 p-6 rounded-3xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-900">Xóa tài khoản</h3>
                  <p className="text-sm text-red-700/70 mt-1 leading-relaxed">
                    Hành động này không thể hoàn tác. Mọi dữ liệu đọc sách, ghi chú và thành tích sẽ bị xóa vĩnh viễn khỏi hệ thống.
                  </p>
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-red-200 shadow-lg"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa tài khoản vĩnh viễn
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Xóa tài khoản vĩnh viễn</DialogTitle>
                        <DialogDescription>
                          Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-900 font-medium mb-2">
                            Để xác nhận, vui lòng nhập: <strong>XÓA TÀI KHOẢN</strong>
                          </p>
                          <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Nhập XÓA TÀI KHOẢN"
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setDeleteConfirmText("");
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting || deleteConfirmText !== "XÓA TÀI KHOẢN"}
                        >
                          {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DataSettings;