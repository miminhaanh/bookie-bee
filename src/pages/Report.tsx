import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { MissionCard } from "@/components/gamification/MissionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Quote, Smile, Plus, Trophy, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmotionSelector } from "@/components/gamification/EmotionSelector";
import { useAuth } from "@/hooks/useAuth";
import { useReportsData } from "@/hooks/useReportsData";
import { HoneyJarLevel } from "@/components/gamification/HoneyJarLevel";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClaimMission } from "@/hooks/useClaimMission";

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useReportsData();
  const claimMission = useClaimMission();
  const [quote, setQuote] = useState("");
  const [greeting, setGreeting] = useState("");

  const quotes = [
    "Một cuốn sách là một giấc mơ cầm trên tay.",
    "Đọc sách là cách rẻ nhất để đi du lịch.",
    "Sách là ngọn đèn biển chỉ đường của trí tuệ.",
    "Hôm nay một người đọc, ngày mai một người dẫn đầu.",
    "Sách mở ra những chân trời mới."
  ];

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
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
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

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Bạn";

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
                  onCollectXP={() => { console.log("Collected!") }}
                />
              </motion.div>

              {/* 2. MIDDLE SECTION (Emotions, Missions) */}
              <div className="space-y-6">

                {/* Main Content Grid: 2 Columns on Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">

                  {/* LEFT COLUMN: Mission Board (Primary focus) */}
                  <div className="space-y-4 h-full">
                    <Card className="border-none shadow-sm bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm h-full overflow-hidden">
                      <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold">Nhiệm vụ hôm nay</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {data?.missions?.filter(m => m.isCompleted).length || 0}/{data?.missions?.length || 2} hoàn thành
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-amber-700">0/35 XP</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-3">
                          {data?.missions?.map((m) => (
                            <MissionCard
                              key={m.id}
                              description={m.description}
                              target={m.target}
                              progress={m.progress}
                              xpReward={m.xpReward}
                              isCompleted={m.isCompleted}
                              isClaimed={m.isClaimed}
                              type={m.type}
                              onClaim={() => claimMission.mutate(m.id)}
                              onNavigate={() => navigate("/")}
                            />
                          )) ?? (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                Chưa có nhiệm vụ hôm nay. Hãy đọc sách để mở khóa!
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* RIGHT COLUMN: Quote & Emotions */}
                  <div className="flex flex-col gap-6 h-full">
                    {/* Emotion Quote */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <Card className="border-none shadow-sm bg-amber-50/50 dark:bg-amber-900/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-4 h-4 text-amber-600 rotate-45" />
                        </div>
                        <CardContent className="p-6 flex flex-col gap-4">
                          <div className="flex items-center gap-2 text-amber-700 font-bold uppercase text-[10px] tracking-widest">
                            <Quote className="w-4 h-4" /> Lời nhắn
                          </div>
                          <div className="space-y-3">
                            <p className="text-lg font-medium text-foreground/80 italic leading-relaxed" style={{ fontFamily: "'Noto Serif', 'Times New Roman', serif" }}>
                              "{quote}"
                            </p>
                            <p className="text-xs text-muted-foreground text-right" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>— Khuyết danh</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Emotions Section */}
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 flex-1">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
                            <Smile className="w-4 h-4" />
                          </div>
                          Cảm xúc đọc
                        </CardTitle>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-pink-50 text-pink-500">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-center">Hôm nay bạn thấy thế nào?</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <EmotionSelector
                                onSelectMood={(mood) => {
                                  console.log("Selected mood:", mood);
                                }}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 py-2">
                          {data?.moodStats?.total ? (
                            Object.entries(data.moodStats.counts).map(([mood, count]) => {
                              if (count === 0) return null;
                              const percent = (count / data.moodStats!.total) * 100;
                              const colorMap: any = { happy: 'bg-yellow-400', thoughtful: 'bg-blue-400', sad: 'bg-indigo-400', excited: 'bg-orange-400', neutral: 'bg-gray-300' };
                              const labelMap: any = { happy: 'Vui vẻ', thoughtful: 'Suy ngẫm', sad: 'Buồn', excited: 'Hào hứng', neutral: 'Bình thường' };

                              return (
                                <div key={mood} className="space-y-1.5">
                                  <div className="flex justify-between text-[11px] font-medium">
                                    <span className="text-muted-foreground">{labelMap[mood] || mood}</span>
                                    <span className="font-bold">{Math.round(percent)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${colorMap[mood] || 'bg-primary'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percent}%` }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-sm text-muted-foreground mb-4">Hãy chọn cảm xúc sau khi đọc nhé! 🌈</p>
                              <div className="flex justify-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                                <span>😊</span><span>🤔</span><span>😴</span><span>🔥</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                </div>
              </div>

            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Reports;