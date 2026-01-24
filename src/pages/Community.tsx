import { useNavigate } from "react-router-dom";
import { BookOpen, Download, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ModernBookCover, BookTitle, BookDescription } from "@/components/books/ModernBookCover";
import { useToast } from "@/hooks/use-toast";

const Community = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [publicBooks, setPublicBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPublicBooks();
  }, []);

  const fetchPublicBooks = async () => {
    setLoading(true);
    // Fetch books where is_public is true
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching public books:", error);
    } else {
      setPublicBooks(data || []);
    }
    setLoading(false);
  };

  const handleSaveToLibrary = async (originalBook: any) => {
    if (!user) return;

    try {
      // Create a copy of the book for the current user
      const { error } = await supabase
        .from('books')
        .insert({
          title: originalBook.title,
          author: originalBook.author,
          description: originalBook.description,
          cover_url: originalBook.cover_url,
          file_url: originalBook.file_url, // Use same file path if public
          format: originalBook.format,
          genre: originalBook.genre,
          user_id: user.id,
          total_pages: originalBook.total_pages,
          toc: originalBook.toc,
          is_public: false, // Private copy
          status: 'to_read',
          progress: 0,
          is_from_library: true // Mark as from library
        });

      if (error) throw error;

      toast({
        title: "Đã thêm vào thư viện",
        description: `Sách "${originalBook.title}" đã được lưu.`
      });
    } catch (error: any) {
      toast({
        title: "Lỗi lưu sách",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!authLoading && !user) {
    const returnUrl = encodeURIComponent('/community');
    navigate(`/auth?returnUrl=${returnUrl}`, { replace: true });
    return null;
  }

  const filteredBooks = publicBooks.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout mobileTitle="Cộng đồng & Thư viện">
      <div className="min-h-screen bg-background safe-area-top p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Thư viện Cộng đồng</h1>
            <p className="text-muted-foreground">Khám phá và tải sách miễn phí từ cộng đồng Bookie Bee</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sách..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20 opacity-70">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p>Chưa có sách công khai nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredBooks.map((book) => (
              <div key={book.id} className="group relative flex flex-col gap-3">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-md transition-all hover:shadow-xl">
                  <ModernBookCover
                    coverImage={book.cover_url}
                    className="h-full w-full object-cover"
                    color="indigo"
                  >
                    {!book.cover_url && (
                      <div className="w-full h-full p-4 flex flex-col justify-end">
                        <BookTitle className="text-white text-sm">{book.title}</BookTitle>
                        <BookDescription className="text-white/80 text-xs">{book.author}</BookDescription>
                      </div>
                    )}
                  </ModernBookCover>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full gap-2"
                      onClick={() => handleSaveToLibrary(book)}
                    >
                      <Download className="w-4 h-4" /> Lưu về
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-white border-white/50 hover:bg-white/20 hover:text-white"
                      onClick={() => navigate(`/book/${book.id}`)} // View details/read if owner? Or just preview?
                    // Actually viewing detail of public book might need logic in BookDetail to handle non-owned books lightly. 
                    // But for now, let's just let them view it if RLS allows.
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{book.author || "Unknown"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Community;