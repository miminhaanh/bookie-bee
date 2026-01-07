import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Search, Globe, Loader2, Book as BookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, type BookFormat } from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
}

const AddBook = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const { addBook } = useBooks();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const getFileFormat = (fileName: string): BookFormat | null => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "epub") return "epub";
    if (ext === "txt") return "txt";
    return null;
  };

  const sanitizeFileName = (name: string) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-zA-Z0-9.-]/g, "-") 
      .toLowerCase();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const format = getFileFormat(file.name);
    if (!format) {
      toast({
        title: "Định dạng không hỗ trợ",
        description: "Chỉ hỗ trợ file PDF, EPUB hoặc TXT",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Vui lòng chọn file nhỏ hơn 50MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const cleanFileName = sanitizeFileName(file.name);
      const filePath = `${user.id}/${Date.now()}-${cleanFileName}`;
      console.log("Bắt đầu upload:", filePath);

      const { error: uploadError } = await supabase.storage
        .from("book-files")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get file URL
      const { data: urlData } = supabase.storage
        .from("book-files")
        .getPublicUrl(filePath);

      // Extract title from filename
      const title = file.name.replace(/\.(pdf|epub|txt)$/i, "").replace(/_/g, " ");

      // Add book to database
      await addBook.mutateAsync({
        title,
        author: null,
        description: null,
        cover_url: null,
        genre: null,
        format,
        file_url: filePath,
        status: "to_read",
        progress: 0,
        current_position: null,
        total_pages: null,
        current_page: 0,
        estimated_time_remaining: null,
        is_from_library: false,
        open_library_key: null,
      });

      toast({
        title: "Thêm sách thành công! 📚",
        description: `"${title}" đã được thêm vào thư viện`,
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải lên sách",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const searchOpenLibrary = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      const data = await res.json();
      setSearchResults(data.docs || []);
    } catch {
      toast({
        title: "Lỗi tìm kiếm",
        description: "Không thể kết nối đến Open Library",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addFromLibrary = async (book: OpenLibraryBook) => {
    try {
      const coverUrl = book.cover_i 
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : null;

      await addBook.mutateAsync({
        title: book.title,
        author: book.author_name?.[0] || null,
        description: null,
        cover_url: coverUrl,
        genre: book.subject?.[0] || null,
        format: null,
        file_url: null,
        status: "to_read",
        progress: 0,
        current_position: null,
        total_pages: null,
        current_page: 0,
        estimated_time_remaining: null,
        is_from_library: true,
        open_library_key: book.key,
      });

      toast({
        title: "Thêm sách thành công! 📚",
        description: `"${book.title}" đã được thêm vào thư viện`,
      });
      navigate("/");
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sách",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Thêm sách mới</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload file
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Globe className="h-4 w-4" />
              Tìm kiếm
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.epub,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full rounded-xl border-2 border-dashed border-border bg-muted/50 p-8 text-center transition-colors hover:border-primary hover:bg-muted"
            >
              {isUploading ? (
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              ) : (
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              )}
              <p className="mt-4 text-lg font-medium text-foreground">
                {isUploading ? "Đang tải lên..." : "Chọn file sách"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hỗ trợ PDF, EPUB, TXT (tối đa 100MB)
              </p>
            </button>
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            {/* Search input */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên sách hoặc tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchOpenLibrary()}
                  className="pl-9"
                />
              </div>
              <Button onClick={searchOpenLibrary} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm"}
              </Button>
            </div>

            {/* Results */}
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Tìm kiếm sách từ Open Library
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((book) => (
                  <button
                    key={book.key}
                    onClick={() => addFromLibrary(book)}
                    className="flex w-full items-start gap-3 rounded-xl bg-card p-3 shadow-sm border border-border text-left transition-colors hover:bg-muted"
                  >
                    {book.cover_i ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                        alt={book.title}
                        className="h-20 w-14 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-14 items-center justify-center rounded-md bg-muted">
                        <BookIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-2">
                        {book.title}
                      </h3>
                      {book.author_name && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {book.author_name[0]}
                        </p>
                      )}
                      {book.first_publish_year && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {book.first_publish_year}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AddBook;