import { BookOpen, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  totalBooks: number;
  completedBooks: number;
  streak: number;
}

export function StatsCards({ totalBooks, completedBooks, streak }: StatsCardsProps) {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Books Read Card - Compact */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl px-5 py-4 relative overflow-hidden group hover:shadow-float transition-shadow flex-1 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warm-pink to-coral flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <BookOpen className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground leading-none">{completedBooks}</p>
          <p className="text-sm text-muted-foreground">Sách đã đọc</p>
          <p className="text-xs text-muted-foreground/70">Tổng: {totalBooks}</p>
        </div>
      </motion.div>

      {/* Streak Card - Compact */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl px-5 py-4 relative overflow-hidden group hover:shadow-float transition-shadow flex-1 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-peach flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Flame className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-foreground leading-none">{streak}</p>
            <span className="text-sm text-muted-foreground">ngày</span>
          </div>
          <p className="text-sm text-muted-foreground">Chuỗi đọc</p>
        </div>
        {streak >= 7 && (
          <span className="text-lg">🔥</span>
        )}
      </motion.div>
    </div>
  );
}
