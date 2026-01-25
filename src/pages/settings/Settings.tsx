import { ArrowLeft, Bell, Cloud, BookOpen, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const settingsItems = [
  {
    title: "Hồ sơ",
    description: "Tên hiển thị, avatar, đổi mật khẩu",
    icon: User,
    path: "/settings/profile",
    gradient: "from-soft-pink/30 to-peach/20",
  },
  {
    title: "Đọc sách",
    description: "Font, theme, thói quen đọc",
    icon: BookOpen,
    path: "/settings/reading",
    gradient: "from-sky/30 to-lavender/20",
  },
  {
    title: "Quyền riêng tư",
    description: "Chế độ riêng tư và chia sẻ dữ liệu",
    icon: Shield,
    path: "/settings/privacy",
    gradient: "from-sage/30 to-soft-sage/30",
  },
  {
    title: "Thông báo",
    description: "Nhắc nhở đọc, email và push",
    icon: Bell,
    path: "/settings/notifications",
    gradient: "from-amber-100/40 to-peach/20",
  },
  {
    title: "Dữ liệu & Đồng bộ",
    description: "Xuất dữ liệu, đồng bộ, xóa tài khoản",
    icon: Cloud,
    path: "/settings/data",
    gradient: "from-blue-100/40 to-cyan-100/30",
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout mobileTitle="Cài đặt">
      <div className="min-h-screen bg-gradient-to-br from-soft-pink/20 via-cream to-peach/20">
        <header className="sticky top-16 lg:top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted/50 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold">⚙️ Cài đặt</h1>
          </div>
        </header>

        <main className="px-4 py-4 space-y-3">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/30 flex items-center gap-3 text-left"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-foreground/70" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </button>
            );
          })}
        </main>
      </div>
    </DashboardLayout>
  );
}
