import { motion } from "framer-motion";
import { User, BookOpen, Shield, Bell, Database, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { cn } from "@/lib/utils";

const Settings = () => {
  const navigate = useNavigate();

  const settingsCards = [
    {
      id: "profile",
      title: "Hồ sơ",
      description: "Quản lý thông tin cá nhân & tài khoản",
      icon: User,
      color: "bg-blue-100 text-blue-600",
      link: "/settings/profile",
    },
    {
      id: "reading",
      title: "Đọc sách",
      description: "Tùy chỉnh font, theme & giao diện đọc",
      icon: BookOpen,
      color: "bg-amber-100 text-amber-600",
      link: "/settings/reading",
    },
    {
      id: "privacy",
      title: "Quyền riêng tư",
      description: "Kiểm soát hiển thị & dữ liệu cá nhân",
      icon: Shield,
      color: "bg-purple-100 text-purple-600",
      link: "/settings/privacy",
    },
    {
      id: "notifications",
      title: "Thông báo",
      description: "Cài đặt nhắc nhở & thông báo từ Bee",
      icon: Bell,
      color: "bg-pink-100 text-pink-600",
      link: "/settings/notifications",
    },
    {
      id: "data",
      title: "Dữ liệu & Đồng bộ",
      description: "Sao lưu, đồng bộ & xóa tài khoản",
      icon: Database,
      color: "bg-emerald-100 text-emerald-600",
      link: "/settings/data",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-10 px-4 md:px-8">
        <header className="space-y-2 mt-4 md:mt-8">
          <h1 className="text-3xl font-nunito font-bold text-slate-800 tracking-tight">
            Cài đặt
          </h1>
          <p className="text-slate-500 text-lg">
            Tùy chỉnh trải nghiệm Bookie Bee của bạn
          </p>
        </header>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {settingsCards.map((card) => (
            <motion.div
              key={card.id}
              variants={item}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
              onClick={() => navigate(card.link)}
              className="group relative bg-white/60 backdrop-blur-md border border-white/50 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden"
            >
              {/* Decoration Gradient */}
              <div className={cn(
                "absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl transition-all group-hover:scale-150",
                card.color.split(" ")[0]
              )} />

              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="space-y-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                    card.color
                  )}>
                    <card.icon className="w-7 h-7" strokeWidth={2.5} />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-700 mb-1 group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-primary transition-colors pt-2">
                  <span>Mở cài đặt</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;