import { cn } from "@/lib/utils";
import { ModernBookCover } from "@/components/ModernBookCover";

interface BookMockupProps {
  title: string;
  author: string;
  coverUrl?: string | null;
  progress?: number;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export const BookMockup = ({
  title,
  author,
  coverUrl,
  progress = 0,
  size = "md",
  onClick,
}: BookMockupProps) => {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));

  const coverSize: "sm" | "md" | "lg" = size === "lg" ? "lg" : size === "sm" ? "sm" : "md";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onClick}
        className={cn("w-full text-left", onClick && "cursor-pointer")}
        aria-label={`Open ${title}`}
      >
        <ModernBookCover
          size={coverSize}
          radius="lg"
          coverImage={coverUrl ?? undefined}
          className="w-full"
        >
          {!coverUrl ? (
            <div className="p-3">
              <p className="text-[11px] font-semibold text-white/95 line-clamp-3">{title}</p>
              <p className="mt-1 text-[10px] text-white/70 line-clamp-2">{author}</p>
            </div>
          ) : null}
        </ModernBookCover>
      </button>

      <div className="mt-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>
          <p className="text-[10px] text-muted-foreground">{Math.round(clamped)}%</p>
        </div>
      </div>
    </div>
  );
};
