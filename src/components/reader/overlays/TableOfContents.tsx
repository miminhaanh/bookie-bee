import { List } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface TableOfContentsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bookmarksComponent: React.ReactNode;
}

export const TableOfContents = ({
  isOpen,
  onOpenChange,
  bookmarksComponent,
}: TableOfContentsProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          aria-label="Xem mục lục"
        >
          <List className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        <SheetHeader>
          <SheetTitle>Mục lục</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto pr-1 text-sm">
          {bookmarksComponent}
        </div>
      </SheetContent>
    </Sheet>
  );
};
