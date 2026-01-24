import { Button } from "@/components/ui/button";
import { Share2, Edit, Flag, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
    <section className="flex flex-wrap items-center gap-3 border-b border-[#E5E5E5] pb-8">
      <Button
        onClick={onStartReading}
        className="gap-2 rounded-[8px] border border-transparent bg-[#F25C3D] px-6 py-3 text-base font-semibold text-white shadow-none hover:bg-[#DD4F33]"
      >
        <Play className="h-5 w-5" />
        {book.current_page && book.current_page > 0 ? "Đọc tiếp" : "Bắt đầu đọc"}
      </Button>

      <Button
        onClick={handleShare}
        variant="ghost"
        className="gap-2 rounded-[8px] border border-[#E5E5E5] bg-transparent px-5 py-3 text-sm font-medium text-[#111] hover:bg-[#F7F7F7]"
      >
        <Share2 className="h-5 w-5" />
        Chia sẻ
      </Button>

      {canEdit && (
        <Button
          onClick={onEditClick}
          variant="ghost"
          className="gap-2 rounded-[8px] border border-[#E5E5E5] bg-transparent px-5 py-3 text-sm font-medium text-[#111] hover:bg-[#F7F7F7]"
        >
          <Edit className="h-4 w-4" />
          Sửa
        </Button>
      )}

      <Button
        variant="ghost"
        className="gap-2 rounded-[8px] border border-[#E5E5E5] bg-transparent px-5 py-3 text-sm font-medium text-[#111] hover:bg-[#F7F7F7]"
      >
        <Flag className="h-4 w-4" />
        Báo cáo
      </Button>
    </section>
  );
}
