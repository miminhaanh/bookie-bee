import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReaderTopBarProps {
  showUI: boolean;
  bookTitle: string | null;
  bookAuthor?: string | null;
  onBack: () => void;
  onSettingsClick?: () => void;
}

export const ReaderTopBar = ({
  showUI,
  bookTitle,
  bookAuthor,
  onBack,
  onSettingsClick,
}: ReaderTopBarProps) => {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 safe-area-top",
        showUI ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="flex items-center justify-between px-3 h-12 bg-gradient-to-b from-black/40 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-md"
        >
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </Button>

        <div className="flex-1 text-center px-3 max-w-[200px] mx-auto">
          <h1 className="font-medium text-white truncate text-sm drop-shadow-md">
            {bookTitle ?? "Đang đọc"}
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-md"
        >
          <Settings className="h-4 w-4 text-gray-700" />
        </Button>
      </div>
    </header>
  );
};
