import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, Heart, Compass, Plus } from "lucide-react";
import { BookDescription, BookTitle, ModernBookCover } from "@/components/books/ModernBookCover";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { Book as SupabaseBook, BookStatus } from "@/hooks/useBooks";

type Book = Pick<SupabaseBook, "id" | "title" | "author" | "cover_url" | "progress" | "status"> & {
  status: BookStatus | null;
};

interface BookShelfProps {
  title: string;
  subtitle?: string;
  books: Book[];
  type: 'reading' | 'completed' | 'saved' | 'explore';
  showAddButton?: boolean;
  showViewAll?: boolean;
}

const shelfConfig = {
  reading: {
    icon: Clock,
    gradient: "from-warm-pink to-coral",
    iconColor: "text-primary-foreground"
  },
  completed: {
    icon: CheckCircle2,
    gradient: "from-sage to-soft-sage",
    iconColor: "text-secondary-foreground"
  },
  saved: {
    icon: Heart,
    gradient: "from-lavender to-sky",
    iconColor: "text-primary-foreground"
  },
  explore: {
    icon: Compass,
    gradient: "from-peach to-coral",
    iconColor: "text-primary-foreground"
  }
};

export function BookShelf({ 
  title, 
  subtitle, 
  books, 
  type, 
  showAddButton = false,
  showViewAll = true 
}: BookShelfProps) {
  const navigate = useNavigate();
  const config = shelfConfig[type];
  const Icon = config.icon;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {/* Temporarily hide "View All" button as /library route doesn't exist yet */}
        {showViewAll && false && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/library')}
            className="text-muted-foreground hover:text-warm-pink"
          >
            Xem tất cả
          </Button>
        )}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {books.map((book, i) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/book/${book.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(`/book/${book.id}`);
              }}
              className="cursor-pointer"
            >
              <ModernBookCover
                size="md"
                radius="md"
                color="pink"
                coverImage={book.cover_url}
                className="shadow-xl"
              >
                {!book.cover_url && (
                  <div className="flex flex-col h-full justify-between">
                    <BookTitle className="text-lg line-clamp-3 leading-tight">
                      {book.title}
                    </BookTitle>
                    <div>
                      <div className="w-8 h-[2px] bg-white/50 mb-2" />
                      <BookDescription className="text-white/80 line-clamp-1 text-[10px] uppercase tracking-wider">
                        {book.author ?? "Unknown Author"}
                      </BookDescription>
                    </div>
                  </div>
                )}
              </ModernBookCover>
            </div>
          </motion.div>
        ))}
        
        {/* Add New Book Card */}
        {showAddButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: books.length * 0.05 }}
            className="flex flex-col items-center justify-center cursor-pointer group"
            onClick={() => navigate('/add-book')}
          >
            <div className="w-full aspect-[2/3] rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-warm-pink group-hover:bg-soft-pink/30 transition-all">
              <Plus className="w-10 h-10 text-muted-foreground group-hover:text-warm-pink transition-colors" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground group-hover:text-warm-pink transition-colors font-medium text-center">
              Thêm sách
            </p>
          </motion.div>
        )}
      </div>

      {/* Empty State */}
      {books.length === 0 && !showAddButton && (
        <div className="text-center py-10 glass-card rounded-2xl">
          <Icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Chưa có sách nào</p>
        </div>
      )}
    </section>
  );
}