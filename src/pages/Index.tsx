import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SplashScreen from "@/components/SplashScreen";
import BottomNav from "@/components/BottomNav";
import HomeHeader from "@/components/HomeHeader";
import BookCard from "@/components/BookCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { books, isLoading: booksLoading, readingCount, completedCount } = useBooks();
  const navigate = useNavigate();

  // Show splash for 2.5 seconds on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user && !showSplash) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, showSplash, navigate]);

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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

      {/* Search and Add */}
      <div className="sticky top-[140px] z-20 bg-background/95 backdrop-blur-sm px-4 pb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm sách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button 
            onClick={() => navigate("/add-book")}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Books grid */}
      <main className="px-4">
        {booksLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              {searchQuery ? "Không tìm thấy sách" : "Thư viện trống"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery 
                ? "Thử tìm kiếm với từ khóa khác" 
                : "Thêm sách đầu tiên vào thư viện nhé!"}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => navigate("/add-book")} 
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm sách
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredBooks.map((book) => (
              <BookCard
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