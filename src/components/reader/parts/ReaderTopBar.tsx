import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReaderTopBarProps {
  showUI: boolean;
  bookTitle: string | null;
  bookAuthor?: string | null;
  onBack: () => void;
  rightSlot?: React.ReactNode;
}

export const ReaderTopBar = ({
  showUI,
  bookTitle,
  bookAuthor,
  onBack,
  rightSlot,
}: ReaderTopBarProps) => {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 safe-area-top",
        showUI ? "translate-y-0" : "-translate-y-full",
        "bg-background/80 backdrop-blur-sm border-b border-border"
      )}
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 text-center">
          <p className="w-full break-words whitespace-normal text-sm font-bold leading-tight">
            {bookTitle ?? "Đang đọc"}
          </p>
          <p className="w-full break-words whitespace-normal text-xs font-normal leading-tight text-muted-foreground">
            {bookAuthor?.trim() ? bookAuthor : "Không rõ tác giả"}
          </p>
        </div>

        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
    </header>
  );
};
