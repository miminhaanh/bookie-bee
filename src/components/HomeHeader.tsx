import { Flame, BookOpen, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/hooks/useProfile";

interface HomeHeaderProps {
  profile: Profile | null;
  readingCount: number;
  completedCount: number;
}

const HomeHeader = ({ profile, readingCount, completedCount }: HomeHeaderProps) => {
  const displayName = profile?.display_name || "Độc giả";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm safe-area-top">
      <div className="px-4 py-4">
        {/* User info row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Xin chào, {displayName}!
              </h1>
              <p className="text-sm text-muted-foreground">
                Hôm nay đọc gì nhỉ? 📚
              </p>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1.5 rounded-full bg-streak/10 px-3 py-1.5">
            <Flame className="h-5 w-5 text-streak" />
            <span className="text-sm font-semibold text-streak">
              {profile?.current_streak || 0}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-card p-3 shadow-sm border border-border">
            <div className="rounded-lg bg-reading/10 p-2">
              <BookOpen className="h-4 w-4 text-reading" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{readingCount}</p>
              <p className="text-xs text-muted-foreground">Đang đọc</p>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-2 rounded-xl bg-card p-3 shadow-sm border border-border">
            <div className="rounded-lg bg-completed/10 p-2">
              <CheckCircle2 className="h-4 w-4 text-completed" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;