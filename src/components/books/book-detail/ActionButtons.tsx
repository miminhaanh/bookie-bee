import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Pencil, Play, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Book } from "@/hooks/useBooks";

interface ActionButtonsProps {
  book: Book;
  canEdit: boolean;
  onEditClick: () => void;
  onStartReading: () => void;
}

export function ActionButtons({
  book,
  canEdit,
  onEditClick,
  onStartReading,
}: ActionButtonsProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: book.title, url });
      } catch (err: unknown) {
        if (err && typeof err === "object" && "name" in err && err.name !== "AbortError") {
          console.error(err);
          await navigator.clipboard.writeText(url);
          toast({ title: "Đã copy link vào clipboard!" });
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Đã copy link vào clipboard!" });
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Button
        size="lg"
        className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-primary-foreground shadow-lg hover:shadow-xl transition-all rounded-xl"
        onClick={onStartReading}
      >
        <Play className="w-5 h-5" />
        {book.current_page && book.current_page > 0 ? "Tiếp tục đọc" : "Bắt đầu đọc"}
      </Button>

      <Button
        variant="outline"
        size="lg"
        className={cn(
          "gap-2 rounded-xl transition-all",
          isLiked && "bg-primary/10 border-primary/30 text-primary"
        )}
        onClick={() => setIsLiked((v) => !v)}
      >
        <Heart className={cn("w-5 h-5", isLiked && "fill-primary")} />
        {isLiked ? "Đã thích" : "Yêu thích"}
      </Button>

      <Button variant="outline" size="lg" className="gap-2 rounded-xl" onClick={handleShare}>
        <Share2 className="w-5 h-5" />
        Chia sẻ
      </Button>

      {canEdit && (
        <Button
          variant="outline"
          size="lg"
          className="gap-2 rounded-xl"
          onClick={onEditClick}
        >
          <Pencil className="w-5 h-5" />
          Chỉnh sửa
        </Button>
      )}
    </div>
  );
}
