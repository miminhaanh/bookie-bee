import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2 } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import HomeHeader from "@/components/HomeHeader";
import {
  ModernBookCover,
  BookTitle,
  BookDescription
} from "@/components/ModernBookCover";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";

// --- 1. UTILS & CONSTANTS ---
const coverColors = [
  "zinc", "slate", "stone", "red", "orange", "amber",
  "yellow", "lime", "green", "emerald", "teal",
  "cyan", "sky", "blue", "indigo", "violet",
  "purple", "fuchsia", "pink", "rose"
] as const;

const getBookColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % coverColors.length;
  return coverColors[index];
};

// --- 2. SUB-COMPONENTS (Thành phần phụ) ---

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const EmptyState = ({ searchQuery, onAddBook }: { searchQuery: string, onAddBook: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/60">
    <div className="rounded-full bg-muted/50 p-6 mb-4">
      <Search className="h-10 w-10" />
    </div>
    <h3 className="text-lg font-medium text-foreground">
      {searchQuery ? "Không tìm thấy sách" : "Thư viện trống"}
    </h3>
    <p className="mt-2 text-sm max-w-[250px] mx-auto">
      {searchQuery
        ? "Thử tìm kiếm với từ khóa khác xem sao"
        : "Kệ sách đang chờ bạn lấp đầy những tri thức mới!"}
    </p>
    {!searchQuery && (
      <Button onClick={onAddBook} className="mt-6" variant="outline">
        <Plus className="mr-2 h-4 w-4" />
        Thêm cuốn đầu tiên
      </Button>
    )}
  </div>
);

// Component hiển thị 1 cuốn sách
const BookItem = ({ book, onClick }: { book: any, onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer group flex flex-col items-center gap-3"
    >
      <ModernBookCover
        size="sm"
        color={getBookColor(book.id)}
        coverImage={book.cover_url}
        className="shadow-xl"
      >
        {/* Nếu có cover_url, ModernBookCover tự xử lý qua prop coverImage. 
            Nếu không, hiển thị Title và Author mặc định */}
        {!book.cover_url && (
          <div className="flex flex-col h-full justify-between">
            <BookTitle className="text-lg line-clamp-3 leading-tight">
              {book.title}
            </BookTitle>
            <div>
              <div className="w-8 h-[2px] bg-white/50 mb-2" />
              <BookDescription className="text-white/80 line-clamp-1 text-[10px] uppercase tracking-wider">
                {book.author || "Unknown Author"}
              </BookDescription>
            </div>
          </div>
        )}
        
        {/* Nếu bạn muốn giữ logic cũ là render đè img lên thì giữ nguyên code cũ trong children, 
            nhưng tốt nhất nên dùng prop coverImage nếu ModernBookCover đã hỗ trợ */}
        {book.cover_url && (
           <div className="absolute inset-0 w-full h-full bg-white">
             <img
               src={book.cover_url}
               alt={book.title}
               className="w-full h-full object-cover"
               loading="lazy"
             />
             <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
           </div>
        )}
      </ModernBookCover>

      <div className="text-center w-[140px]">
        <h3 className="text-sm font-medium leading-tight line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
      </div>
    </div>
  );
};

// --- 3. MAIN COMPONENT ---

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Hooks
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { books, isLoading: booksLoading, readingCount, completedCount } = useBooks();
  const navigate = useNavigate();

  // Show splash for 2.5 seconds on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Filter books by search
  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showSplash) {
    return <SplashScreen />;
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-soft-pink/30 via-cream to-peach/30">
        <Loader2 className="h-8 w-8 animate-spin text-warm-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <HomeHeader 
        profile={profile} 
        readingCount={readingCount} 
        completedCount={completedCount} 
      />

      {/* Sticky Search Bar */}
      <div className="sticky top-[140px] z-20 bg-background/95 backdrop-blur-sm px-4 pb-3 pt-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm sách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-none shadow-inner"
            />
          </div>
          <Button
            onClick={() => navigate("/add-book")}
            className="shrink-0 shadow-md"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 mt-4">
        {booksLoading ? (
          <LoadingState />
        ) : filteredBooks.length === 0 ? (
          <EmptyState 
            searchQuery={searchQuery} 
            onAddBook={() => navigate("/add-book")} 
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pb-8 justify-items-center">
            {filteredBooks.map((book) => (
              <BookItem 
                key={book.id} 
                book={book} 
                onClick={() => navigate(`/book/${book.id}`)} 
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;