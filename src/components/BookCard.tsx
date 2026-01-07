import { Book as BookIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Book, BookStatus } from "@/hooks/useBooks";

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

const statusConfig: Record<BookStatus, { label: string; className: string }> = {
  reading: { label: "Đang đọc", className: "bg-reading text-white" },
  completed: { label: "Đã đọc", className: "bg-completed text-white" },
  to_read: { label: "Sẽ đọc", className: "bg-to-read text-white" },
};

const BookCard = ({ book, onClick }: BookCardProps) => {
  const status = statusConfig[book.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl bg-card shadow-sm border border-border",
        "transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        "text-left w-full"
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <BookIcon className="h-12 w-12 text-primary/40" />
          </div>
        )}
        
        {/* Status badge */}
        <div
          className={cn(
            "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium",
            status.className
          )}
        >
          {status.label}
        </div>

        {/* Progress bar */}
        {book.status === "reading" && book.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${book.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
          {book.title}
        </h3>
        {book.author && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {book.author}
          </p>
        )}
        {book.genre && (
          <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {book.genre}
          </span>
        )}
      </div>
    </button>
  );
};

export default BookCard;