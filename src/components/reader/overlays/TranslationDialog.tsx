import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

interface TranslationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceText: string;
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
}

export const TranslationDialog = ({
  isOpen,
  onClose,
  sourceText,
  translatedText,
  isTranslating,
  error,
}: TranslationDialogProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-background/70 p-4 shadow-float backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Bản dịch"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Dịch từ đoạn bôi đậm</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{sourceText}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3">
          {isTranslating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang dịch...
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-base text-foreground">{translatedText}</p>
          )}
        </div>
      </div>
    </div>
  );
};
