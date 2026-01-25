import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getLevelTitle } from "@/lib/constants";

// Generate initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
};

// Generate avatar color from email
const getAvatarColor = (email: string) => {
  const colors = [
    'from-warm-pink to-coral',
    'from-sage to-soft-sage',
    'from-lavender to-sky',
    'from-peach to-coral',
    'from-primary to-accent',
    'from-violet-500 to-purple-500'
  ];
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface ProfileCardProps {
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  avatarUrl?: string | null;
  displayName?: string | null;
  className?: string;
  isLoading?: boolean;
}

export function ProfileCard({ 
  level = 5, 
  xp = 350, 
  xpToNextLevel = 500,
  avatarUrl,
  displayName,
  className,
  isLoading = false,
}: ProfileCardProps) {
  const { user } = useAuth();

  // Khi đang loading, không dùng fallback từ user_metadata để tránh flash
  const resolvedAvatarUrl = isLoading ? null : ((avatarUrl ?? "").trim() || user?.user_metadata?.avatar_url);
  const resolvedDisplayName = isLoading ? "..." : ((displayName ?? "").trim() || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Người dùng");
  const userEmail = user?.email || 'user@example.com';
  const initials = isLoading ? ".." : getInitials(resolvedDisplayName);
  const avatarColorClass = getAvatarColor(userEmail);
  
  const normalizedLevel = Number.isFinite(level) ? level : 1;
  const levelInfo = getLevelTitle(normalizedLevel);
  const xpProgress = xpToNextLevel > 0 ? Math.min(100, (xp / xpToNextLevel) * 100) : 0;
  const xpRemaining = Math.max(0, xpToNextLevel - xp);

  return (
    <div className={cn("glass-card rounded-3xl p-6 relative overflow-hidden", className)}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-warm-pink/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-sage/20 to-transparent rounded-full blur-2xl" />
      
      <div className="relative flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="w-16 h-16 border-4 border-warm-pink/30 shadow-lg">
            {resolvedAvatarUrl ? (
              <AvatarImage src={resolvedAvatarUrl} />
            ) : null}
            <AvatarFallback className={`bg-gradient-to-br ${avatarColorClass} text-white text-xl font-bold`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-warm-pink to-coral flex items-center justify-center text-xs font-bold text-primary-foreground shadow-md">
            {normalizedLevel}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-foreground truncate">
            {resolvedDisplayName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg">{levelInfo.icon}</span>
            <span className="font-medium">{levelInfo.title}</span>
            <span className="text-warm-pink font-semibold">Lv.{normalizedLevel}</span>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mt-5 relative">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Kinh nghiệm</span>
          <span className="font-semibold text-warm-pink">{xp}/{xpToNextLevel} XP</span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-warm-pink via-coral to-peach rounded-full transition-all duration-500 ease-out"
            style={{ width: `${xpProgress}%` }}
          />
          {/* Honey drops decoration */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 text-xs transition-all duration-500"
            style={{ left: `calc(${xpProgress}% - 8px)` }}
          >
            🍯
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Còn {xpRemaining} XP để lên level tiếp theo
        </p>
      </div>
    </div>
  );
}