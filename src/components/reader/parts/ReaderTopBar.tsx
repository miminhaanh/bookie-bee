import { ArrowLeft, Bookmark, History, List, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReaderTopBarProps {
  showUI: boolean;
  bookTitle: string | null;
  onBack: () => void;
  tocButton: React.ReactNode;
  highlightsButton: React.ReactNode;
  translateHistoryButton: React.ReactNode;
  settingsButton: React.ReactNode;
}

export const ReaderTopBar = ({
  showUI,
  bookTitle,
  onBack,
  tocButton,
  highlightsButton,
  translateHistoryButton,
  settingsButton,
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
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Quay lại</span>
        </Button>

        <h1 className="text-sm font-medium truncate max-w-[200px]">{bookTitle ?? "Đang đọc"}</h1>

        <div className="flex items-center gap-2">
          {tocButton}
          {highlightsButton}
          {translateHistoryButton}
          {settingsButton}
        </div>
      </div>
    </header>
  );
};
