import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useReportsData } from "@/hooks/useReportsData";
import { useProfile } from "@/hooks/useProfile";
import { HoneyJarLevel } from "@/components/gamification/HoneyJarLevel";
import { motion } from "framer-motion";

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { data, isLoading } = useReportsData();
  const [greeting, setGreeting] = useState("");

  const dynamicGreetings = [
    "Hôm nay bạn sẽ đọc gì để nuôi dưỡng tâm hồn nhỉ?",
    "Đọc vài trang thôi, ong non vẫn bay cao đấy! 🐝",
    "Một chút mật ngọt kiến thức cho ngày mới nhé?",
    "Chào bạn, tổ ong đang chờ thêm mật ngọt từ bạn!",
    "Sẵn sàng cho chuyến phiêu lưu hôm nay chưa?"
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = encodeURIComponent('/reports');
      navigate(`/auth?returnUrl=${returnUrl}`);
    }
    setGreeting(dynamicGreetings[Math.floor(Math.random() * dynamicGreetings.length)]);
  }, [authLoading, navigate, user]);

  if (isLoading) {
    return (
      <DashboardLayout mobileTitle="Báo cáo">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-4xl animate-bounce">🐝</div>
            <div className="text-xl font-medium text-warm-pink animate-pulse">Đang tải mật ngọt...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const streakDays = data?.honeycomb.streakDays ?? [];
  const currentStreak = data?.honeycomb.currentStreak ?? 0;

  const levelData = data?.level ?? {
    currentXP: 0,
    totalXPForNextLevel: 500,
    currentLevel: 1,
    totalBooksRead: 0,
    totalPagesRead: 0,
  };

  // Ưu tiên lấy display_name từ profile (synced), fallback sang user_metadata
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Bạn";

  return (
    <DashboardLayout mobileTitle="Báo cáo">
      <div className="min-h-screen bg-background/50">
        <main className="container mx-auto px-4 py-6 max-w-5xl">

          <Tabs defaultValue="overview" className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  Xin chào, {displayName}! 👋
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">{greeting}</p>
              </div>

              {/* Chỉ hiển thị Tổng quan - đã xóa Thành tích và Wrapped */}
            </div>

            <TabsContent value="overview" className="animate-fade-in space-y-6">

              {/* 1. HERO SECTION (Unified Honey Jar) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full mb-10"
              >
                <HoneyJarLevel
                  currentXP={levelData.currentXP}
                  maxXP={levelData.totalXPForNextLevel}
                  level={levelData.currentLevel}
                  streak={currentStreak}
                />
              </motion.div>

            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Reports;