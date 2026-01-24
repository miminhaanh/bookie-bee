import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface ReadingStatsProps {
  hourlyData: { hour: number; minutes: number }[];
  weeklyData: { day: string; pages: number }[];
  readerType: "night_owl" | "early_bird" | "balanced";
}

const readerTypeInfo = {
  night_owl: {
    emoji: "🦉",
    name: "Cú đêm",
    description: "Bạn thường đọc vào buổi tối muộn",
  },
  early_bird: {
    emoji: "🐦",
    name: "Chim sớm",
    description: "Bạn thích đọc vào buổi sáng sớm",
  },
  balanced: {
    emoji: "⚖️",
    name: "Cân bằng",
    description: "Bạn đọc đều trong ngày",
  },
};

export const ReadingStats = ({ hourlyData, weeklyData, readerType }: ReadingStatsProps) => {
  const typeInfo = readerTypeInfo[readerType];

  return (
    <div className="space-y-6">
      {/* Reading Rhythm Chart */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender to-sky flex items-center justify-center shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Nhịp độ đọc</h2>
              <p className="text-sm text-muted-foreground">Thời gian đọc theo giờ</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lavender/30 to-sky/30 rounded-full">
            <span className="text-xl">{typeInfo.emoji}</span>
            <div>
              <p className="text-sm font-bold text-foreground">{typeInfo.name}</p>
              <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
            </div>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(270, 50%, 75%)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(270, 50%, 75%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="hour" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(25, 15%, 45%)' }}
                tickFormatter={(value) => `${value}h`}
              />
              <YAxis 
                hide 
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(35, 25%, 99%)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
                // formatter removed minutes display
                formatter={() => ['']}
                labelFormatter={(label) => `${label}:00`}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="hsl(270, 50%, 65%)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMinutes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Pages Chart */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage to-soft-sage flex items-center justify-center shadow-lg">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Trang đọc trong tuần</h2>
            <p className="text-sm text-muted-foreground">Số trang đọc mỗi ngày</p>
          </div>
        </div>

        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(25, 15%, 45%)' }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'hsl(35, 25%, 99%)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => [`${value} trang`, '']}
              />
              <Bar dataKey="pages" radius={[8, 8, 0, 0]}>
                {weeklyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pages > 50 ? 'hsl(145, 25%, 65%)' : 'hsl(145, 25%, 80%)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Book Tower */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral to-peach flex items-center justify-center shadow-lg">
            <span className="text-2xl">🗼</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Tháp Sách Tháng Này</h2>
            <p className="text-sm text-muted-foreground">Xếp chồng sách đã đọc</p>
          </div>
        </div>

        <div className="flex items-end justify-center gap-2 h-48">
          {[
            { title: "Atomic Habits", color: "from-warm-pink to-coral", height: 60 },
            { title: "Sapiens", color: "from-sky to-lavender", height: 80 },
            { title: "Nhà Giả Kim", color: "from-sage to-soft-sage", height: 50 },
            { title: "Đắc Nhân Tâm", color: "from-peach to-coral", height: 70 },
          ].map((book, index) => (
            <div
              key={index}
              className={`w-16 bg-gradient-to-t ${book.color} rounded-t-md shadow-lg flex items-end justify-center pb-2 transition-all hover:scale-105 cursor-pointer`}
              style={{ height: `${book.height}%` }}
              title={book.title}
            >
              <span className="text-[8px] font-bold text-primary-foreground text-center px-1 line-clamp-2 writing-vertical">
                {book.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
