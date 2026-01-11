import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { HoneycombStreak } from "@/components/reports/HoneycombStreak";
import { LevelProgress } from "@/components/reports/LevelProgress";
import { ReadingStats } from "@/components/reports/ReadingStats";
import { BadgeCollection } from "@/components/reports/BadgeCollection";
import { BookieWrapped } from "@/components/reports/BookieWrapped";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Trophy, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useReportsData } from "@/hooks/useReportsData";

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useReportsData();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, navigate, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-pulse text-2xl">🐝 Đang tải...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const streakDays = data?.honeycomb.streakDays ?? [];
  const currentStreak = data?.honeycomb.currentStreak ?? 0;
  const freezesAvailable = data?.honeycomb.freezesAvailable ?? 0;

  const levelData = data?.level ?? {
    currentXP: 0,
    totalXPForNextLevel: 500,
    currentLevel: 1,
    totalBooksRead: 0,
    totalPagesRead: 0,
  };

  const hourlyData = data?.readingStats.hourlyData ?? [];
  const weeklyData = data?.readingStats.weeklyData ?? [];
  const readerType = data?.readingStats.readerType ?? "balanced";

  const badges = data?.badges ?? [];
  const wrappedData = data?.wrapped ?? {
    month: "",
    year: new Date().getFullYear(),
    totalWords: 0,
    favoriteBook: { title: "(Chưa có)", author: "", timeSpent: "0m" },
    dominantColor: "pink" as const,
    totalBooks: 0,
    totalPages: 0,
    streak: 0,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <span>📊</span> Báo Cáo Đọc Sách
          </h1>
          <p className="text-muted-foreground mt-1">Theo dõi hành trình đọc sách của bạn</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl gap-2 data-[state=active]:bg-card">
              <BarChart3 className="w-4 h-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-xl gap-2 data-[state=active]:bg-card">
              <Trophy className="w-4 h-4" />
              Thành tích
            </TabsTrigger>
            <TabsTrigger value="wrapped" className="rounded-xl gap-2 data-[state=active]:bg-card">
              <Sparkles className="w-4 h-4" />
              Wrapped
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6">
              <HoneycombStreak
                streakDays={streakDays}
                currentStreak={currentStreak}
                freezesAvailable={freezesAvailable}
              />
              <LevelProgress {...levelData} />
            </div>

            <ReadingStats hourlyData={hourlyData} weeklyData={weeklyData} readerType={readerType} />
          </TabsContent>

          <TabsContent value="achievements" className="animate-fade-in">
            <BadgeCollection badges={badges} />
          </TabsContent>

          <TabsContent value="wrapped" className="animate-fade-in">
            <BookieWrapped {...wrappedData} />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Reports;