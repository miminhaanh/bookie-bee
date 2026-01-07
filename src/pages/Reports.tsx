import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Flame, BookOpen, Clock, TrendingUp, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";
import { useReadingStats } from "@/hooks/useReadingStats";

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { books, readingCount, completedCount } = useBooks();
  const { weeklyData, totalMinutes, isLoading } = useReadingStats();
  const navigate = useNavigate();

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const pieData = [
    { name: "Đang đọc", value: readingCount, color: "hsl(0, 84%, 60%)" },
    { name: "Đã hoàn thành", value: completedCount, color: "hsl(142, 76%, 45%)" },
    { name: "Sẽ đọc", value: books.filter((b) => b.status === "to_read").length, color: "hsl(217, 91%, 60%)" },
  ].filter((d) => d.value > 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="min-h-screen bg-background pb-20 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Báo cáo đọc sách</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi tiến độ của bạn
          </p>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-5 w-5 text-streak" />
                  <span className="text-sm text-muted-foreground">Streak hiện tại</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {profile?.current_streak || 0} <span className="text-sm font-normal text-muted-foreground">ngày</span>
                </p>
              </div>

              <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  <span className="text-sm text-muted-foreground">Streak kỷ lục</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {profile?.longest_streak || 0} <span className="text-sm font-normal text-muted-foreground">ngày</span>
                </p>
              </div>

              <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Tổng thời gian</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                </p>
              </div>

              <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-completed" />
                  <span className="text-sm text-muted-foreground">Đã hoàn thành</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {completedCount} <span className="text-sm font-normal text-muted-foreground">sách</span>
                </p>
              </div>
            </div>

            {/* Weekly chart */}
            <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
              <h3 className="mb-4 text-sm font-medium text-foreground">Thời gian đọc (7 ngày qua)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} phút`, "Thời gian"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar 
                      dataKey="minutes" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Books distribution */}
            {pieData.length > 0 && (
              <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
                <h3 className="mb-4 text-sm font-medium text-foreground">Phân bố sách</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: entry.color }} 
                      />
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Reports;