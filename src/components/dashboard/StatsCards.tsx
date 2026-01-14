import { BookOpen, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  totalBooks: number;
  completedBooks: number;
  streak: number;
}

export function StatsCards({ totalBooks, completedBooks, streak }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Books Read Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:shadow-float transition-shadow"
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-warm-pink/20 to-transparent rounded-full blur-xl" />
        
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warm-pink to-coral flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{completedBooks}</p>
          <p className="text-sm text-muted-foreground">Sách đã đọc</p>
          <p className="text-xs text-muted-foreground/80">Tổng: {totalBooks}</p>
        </div>
      </motion.div>

      {/* Streak Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:shadow-float transition-shadow"
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-coral/20 to-transparent rounded-full blur-xl" />
        
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-peach flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6 text-primary-foreground animate-pulse-soft" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-foreground">{streak}</p>
            <span className="text-sm text-muted-foreground">ngày</span>
          </div>
          <p className="text-sm text-muted-foreground">Chuỗi đọc</p>
          
          {/* Fire effect */}
          {streak >= 7 && (
            <div className="absolute top-2 right-2 text-lg animate-bounce-soft">
              🔥
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
