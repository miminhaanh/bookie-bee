import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: "genre" | "behavior";
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface BadgeCollectionProps {
  badges: Badge[];
}

const BadgeCard = ({ badge }: { badge: Badge }) => {
  return (
    <motion.div
      className={`relative p-4 rounded-2xl transition-all ${
        badge.unlocked
          ? "bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 shadow-lg"
          : "bg-muted/50 border-2 border-dashed border-muted-foreground/20"
      }`}
      whileHover={{ scale: badge.unlocked ? 1.05 : 1.02 }}
    >
      {!badge.unlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
      
      <div className="flex flex-col items-center text-center">
        <div
          className={`text-4xl mb-2 ${!badge.unlocked && "grayscale opacity-30"}`}
        >
          {badge.emoji}
        </div>
        
        <h4 className={`font-bold text-sm ${badge.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
          {badge.name}
        </h4>
        
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {badge.description}
        </p>
        
        {!badge.unlocked && badge.progress !== undefined && badge.total && (
          <div className="w-full mt-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-warm-pink to-coral rounded-full"
                style={{ width: `${(badge.progress / badge.total) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {badge.progress}/{badge.total}
            </p>
          </div>
        )}
        
        {badge.unlocked && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            <span className="text-xs">✓</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export const BadgeCollection = ({ badges }: BadgeCollectionProps) => {
  const genreBadges = badges.filter((b) => b.category === "genre");
  const behaviorBadges = badges.filter((b) => b.category === "behavior");
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Bộ Sưu Tập Huy Hiệu</h2>
            <p className="text-sm text-muted-foreground">
              Đã mở khóa <span className="font-bold text-amber-500">{unlockedCount}/{badges.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Genre Badges */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <span>📚</span> Theo thể loại
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {genreBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>

      {/* Behavior Badges */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <span>⚡</span> Theo hành vi
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {behaviorBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  );
};
