import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReaderTopBarProps {
  showUI: boolean;
  bookTitle: string | null;
  onBack: () => void;
  rightSlot?: React.ReactNode;
}

export const ReaderTopBar = ({
  showUI,
  bookTitle,
  onBack,
  rightSlot,
}: ReaderTopBarProps) => {
  return (
    <header
      className={cn(
        "fixed top-3 left-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 transition-transform duration-300 safe-area-top",
        showUI ? "translate-y-0" : "-translate-y-full",
        "max-w-[980px] rounded-2xl border border-border/60 bg-background/85 shadow-sm backdrop-blur-md"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 rounded-xl transition-all hover:scale-[1.02]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Quay lại</span>
        </Button>

        <h1 className="text-sm font-medium truncate max-w-[240px] text-foreground/90">
          {bookTitle ?? "Đang đọc"}
        </h1>

        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
    </header>
  );
};
