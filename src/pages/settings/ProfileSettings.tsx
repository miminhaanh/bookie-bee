import { motion } from "framer-motion";
import { User, Mail, Lock, Link as LinkIcon, Camera, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock data for display since user might be null or have limited data
  const displayName = user?.user_metadata?.full_name || "Ong chăm chỉ";
  const email = user?.email || "member@bookiebee.com";

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
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-4xl bg-gradient-pink text-white">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-1 right-1 p-2 rounded-full bg-slate-800 text-white shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
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
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Username</p>
                <p className="text-slate-700 font-medium">@{email.split('@')[0]}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Button
              variant="outline"
              className="h-14 justify-start px-4 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold gap-3"
            >
              <Lock className="w-5 h-5 text-slate-400" />
              Đổi mật khẩu
            </Button>

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