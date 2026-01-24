import { motion } from "framer-motion";
import { Cloud, Download, Trash2, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const DataSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const lastSyncTime = "Vừa xong"; // Mock

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
            <button className="w-full p-4 hover:bg-white transition-colors flex items-center gap-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-bold text-slate-700">Xuất dữ liệu cá nhân</h4>
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
                  <Button
                    variant="destructive"
                    className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-red-200 shadow-lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa tài khoản vĩnh viễn
                  </Button>
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
