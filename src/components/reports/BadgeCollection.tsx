import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

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

export const BadgeCollection = ({ badges }: BadgeCollectionProps) => {
  const genreBadges = badges.filter((b) => b.category === "genre");
  const behaviorBadges = badges.filter((b) => b.category === "behavior");

  const renderBadgeCard = (badge: Badge) => {
    const progressPercent =
      badge.total && badge.progress !== undefined
        ? Math.min(100, Math.round((badge.progress / badge.total) * 100))
        : badge.unlocked
        ? 100
        : 0;

    return (
      <div
        key={badge.id}
        className={cn(
          "relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-300",
          badge.unlocked
            ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-sm hover:shadow-md"
            : "bg-gray-50 border-gray-200 opacity-60"
        )}
      >
        {/* Emoji / Icon */}
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-3",
            badge.unlocked
              ? "bg-gradient-to-br from-amber-100 to-yellow-100"
              : "bg-gray-100 grayscale"
          )}
        >
          {badge.unlocked ? badge.emoji : <Lock className="w-5 h-5 text-gray-400" />}
        </div>

        {/* Name */}
        <h3
          className={cn(
            "text-sm font-bold text-center mb-1",
            badge.unlocked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {badge.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground text-center line-clamp-2 mb-2">
          {badge.description}
        </p>

        {/* Progress bar */}
        {badge.total !== undefined && !badge.unlocked && (
          <div className="w-full mt-auto">
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              {badge.progress ?? 0}/{badge.total}
            </p>
          </div>
        )}

        {/* Unlocked indicator */}
        {badge.unlocked && (
          <div className="absolute top-2 right-2">
            <span className="text-xs">✨</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Genre Badges */}
      {genreBadges.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📚</span> Huy hiệu thể loại
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {genreBadges.map(renderBadgeCard)}
          </div>
        </div>
      )}

      {/* Behavior Badges */}
      {behaviorBadges.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🏆</span> Huy hiệu hành vi
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {behaviorBadges.map(renderBadgeCard)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {badges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎖️</div>
          <h3 className="text-lg font-bold text-foreground mb-2">Chưa có huy hiệu nào</h3>
          <p className="text-sm text-muted-foreground">
            Hãy đọc sách để mở khóa các huy hiệu đặc biệt!
          </p>
        </div>
      )}
    </div>
  );
};
