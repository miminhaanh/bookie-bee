import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, Sparkles, ArrowLeft, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PrivacySettings = () => {
  const navigate = useNavigate();
  const [aiEnabled, setAiEnabled] = useState(true);

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
              Quyền riêng tư
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Kiểm soát cách dữ liệu của bạn được chia sẻ
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Visibility Section */}
          <section className="bg-white/60 p-6 rounded-3xl border border-white/60 shadow-sm backdrop-blur-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-700">Hiển thị hồ sơ</h3>
                  <p className="text-sm text-slate-500">Ai có thể nhìn thấy hoạt động đọc sách của bạn?</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <Select defaultValue="friends">
                    <SelectTrigger className="w-full h-12 border-0 bg-transparent focus:ring-0">
                      <SelectValue placeholder="Chọn quyền riêng tư" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-500" />
                          <span>Mọi người (Public)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-slate-500" />
                          <span>Chỉ bạn bè (Friends only)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-500" />
                          <span>Chỉ mình tôi (Private)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* AI Personalization */}
          <section className={cn(
            "p-6 rounded-3xl border shadow-sm backdrop-blur-sm transition-colors duration-500",
            aiEnabled ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100" : "bg-white/60 border-white/60"
          )}>
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-500",
                aiEnabled ? "bg-gradient-pink text-white shadow-lg shadow-pink-200" : "bg-slate-100 text-slate-400"
              )}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-700">Cá nhân hóa AI</h3>
                  <Switch
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                    className="data-[state=checked]:bg-gradient-pink"
                  />
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Cho phép Bookie Bee sử dụng AI để phân tích thói quen đọc và đề xuất sách phù hợp nhất với bạn.
                </p>

                {aiEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 text-xs font-medium text-purple-600 bg-purple-100/50 p-3 rounded-xl flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3" />
                    AI đang hoạt động để làm trải nghiệm của bạn tốt hơn.
                  </motion.div>
                )}
              </div>
            </div>
          </section>

          {/* Reassurance Footer */}
          <div className="flex items-center justify-center gap-2 text-slate-400 p-4 border border-dashed border-slate-200 rounded-2xl">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold">Dữ liệu của bạn được mã hóa an toàn 100%</span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PrivacySettings;