import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { TranslateHistoryItem } from "../utils/readerUtils";

interface TranslateHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  history: TranslateHistoryItem[];
  onClearAll: () => void;
  onSelectItem: (item: TranslateHistoryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export const TranslateHistorySheet = ({
  isOpen,
  onOpenChange,
  history,
  onClearAll,
  onSelectItem,
  onDeleteItem,
}: TranslateHistorySheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        <SheetHeader>
          <SheetTitle>Lịch sử dịch</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Lưu trên thiết bị này</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={history.length === 0}
          >
            Xoá tất cả
          </Button>
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bản dịch nào.</p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                type="button"
                className="relative w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
                onClick={() => onSelectItem(item)}
              >
                <button
                  type="button"
                  className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground"
                  aria-label="Xoá bản dịch"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{item.target.toUpperCase()}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm">{item.sourceText}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.translatedText}</p>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
