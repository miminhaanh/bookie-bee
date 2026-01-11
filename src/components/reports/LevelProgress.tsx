import { motion } from "framer-motion";

interface LevelProgressProps {
  currentXP: number;
  totalXPForNextLevel: number;
  currentLevel: number;
  totalBooksRead: number;
  totalPagesRead: number;
}

const levelInfo = [
  { level: 1, name: "Ấu trùng", emoji: "🐛", description: "Người mới bắt đầu" },
  { level: 5, name: "Ong thợ", emoji: "🐝", description: "Đọc đều đặn" },
  { level: 10, name: "Ong trinh sát", emoji: "🦋", description: "Đọc đa dạng thể loại" },
  { level: 20, name: "Ong chúa", emoji: "👑", description: "Master of reading" },
];

const getCurrentLevelInfo = (level: number) => {
  if (level >= 20) return levelInfo[3];
  if (level >= 10) return levelInfo[2];
  if (level >= 5) return levelInfo[1];
  return levelInfo[0];
};

const getNextLevelInfo = (level: number) => {
  if (level >= 20) return null;
  if (level >= 10) return levelInfo[3];
  if (level >= 5) return levelInfo[2];
  return levelInfo[1];
};

export const LevelProgress = ({
  currentXP,
  totalXPForNextLevel,
  currentLevel,
  totalBooksRead,
  totalPagesRead,
}: LevelProgressProps) => {
  const currentLevelData = getCurrentLevelInfo(currentLevel);
  const nextLevelData = getNextLevelInfo(currentLevel);
  const progressPercentage = (currentXP / totalXPForNextLevel) * 100;
  const honeyDrops = Math.floor(totalPagesRead / 10);

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warm-pink to-coral flex items-center justify-center shadow-lg">
          <span className="text-2xl">{currentLevelData.emoji}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Level & XP</h2>
          <p className="text-sm text-muted-foreground">Nuôi dưỡng chú ong của bạn</p>
        </div>
      </div>

      {/* Level Badge */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-lg border-4 border-amber-300"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-4xl">{currentLevelData.emoji}</span>
          </motion.div>
          <div>
            <p className="text-sm text-muted-foreground">Level {currentLevel}</p>
            <h3 className="text-2xl font-bold text-foreground">{currentLevelData.name}</h3>
            <p className="text-sm text-muted-foreground">{currentLevelData.description}</p>
          </div>
        </div>
        
        {nextLevelData && (
          <div className="text-center opacity-50">
            <span className="text-3xl">{nextLevelData.emoji}</span>
            <p className="text-xs text-muted-foreground mt-1">Tiếp theo</p>
          </div>
        )}
      </div>

      {/* Honey Tube Progress */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {currentXP} / {totalXPForNextLevel} XP
          </span>
          {nextLevelData && (
            <span className="text-sm text-muted-foreground">
              → Level {nextLevelData.level}: {nextLevelData.name}
            </span>
          )}
        </div>
        
        {/* Honey tube */}
        <div className="relative h-10 bg-gradient-to-b from-amber-50 to-amber-100 rounded-full border-2 border-amber-200 overflow-hidden shadow-inner">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 via-amber-400 to-amber-300 rounded-full"
            initial={{ height: 0 }}
            animate={{ height: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Bubbles effect */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-amber-200/50 rounded-full"
                  style={{ left: `${20 + i * 15}%` }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </motion.div>
          
          {/* Tube highlights */}
          <div className="absolute top-1 left-4 right-4 h-2 bg-white/30 rounded-full" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl">
          <span className="text-2xl">🍯</span>
          <p className="text-2xl font-bold text-amber-600">{honeyDrops}</p>
          <p className="text-xs text-muted-foreground">Giọt mật</p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-warm-pink/20 to-coral/20 rounded-2xl">
          <span className="text-2xl">📚</span>
          <p className="text-2xl font-bold text-warm-pink">{totalBooksRead}</p>
          <p className="text-xs text-muted-foreground">Sách đã đọc</p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-sage/30 to-soft-sage/30 rounded-2xl">
          <span className="text-2xl">📖</span>
          <p className="text-2xl font-bold text-sage">{totalPagesRead}</p>
          <p className="text-xs text-muted-foreground">Trang đã đọc</p>
        </div>
      </div>
    </div>
  );
};
