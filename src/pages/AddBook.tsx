import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Upload, 
  Search, 
  Globe, 
  Loader2, 
  Book as BookIcon,
  FileText,
  X,
  Sparkles,
  Lock,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, type BookFormat } from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
}

const genres = [
  "Văn học", "Self-help", "Kinh doanh", "Khoa học", 
  "Lịch sử", "Tâm lý", "Truyện ngắn", "Tiểu thuyết"
];

const privacyOptions = [
  { id: "private", label: "Riêng tư", icon: Lock, desc: "Chỉ mình bạn xem được" },
  { id: "link", label: "Chia sẻ link", icon: Link2, desc: "Ai có link đều xem được" },
  { id: "public", label: "Công khai", icon: Globe, desc: "Hiển thị trong cộng đồng" },
];

const AddBook = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState("private");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const { addBook, updateBook } = useBooks();
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const format = getFileFormat(file.name);
      if (format) {
        setUploadedFile(file);
        // Extract title from filename
        const title = file.name.replace(/\.(pdf|epub|txt)$/i, "").replace(/_/g, " ");
        setFormData(prev => ({ ...prev, title }));
      } else {
        toast({
          title: "Định dạng không hỗ trợ",
          description: "Chỉ hỗ trợ file PDF, EPUB hoặc TXT",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate định dạng
    const format = getFileFormat(file.name);
    if (!format) {
      toast({
        title: "Định dạng không hỗ trợ",
        description: "Chỉ hỗ trợ file PDF, EPUB hoặc TXT",
        variant: "destructive",
      });
      return;
    }

    // 2. Validate dung lượng
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Vui lòng chọn file nhỏ hơn 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    // Extract title from filename
    const title = file.name.replace(/\.(pdf|epub|txt)$/i, "").replace(/_/g, " ");
    setFormData(prev => ({ ...prev, title }));
  };

  const handleUploadBook = async () => {
    if (!uploadedFile || !user) return;

    const format = getFileFormat(uploadedFile.name);
    if (!format) return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const cleanFileName = sanitizeFileName(uploadedFile.name);
      const filePath = `${user.id}/${Date.now()}-${cleanFileName}`;

      console.log("Đang upload lên path:", filePath);

      // 4. Upload lên Storage
      const { error: uploadError } = await supabase.storage
        .from("book-files")
        .upload(filePath, uploadedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: uploadedFile.type
        });

      if (uploadError) {
        console.error("Lỗi Storage:", uploadError);
        throw new Error(`Lỗi Storage: ${uploadError.message}`);
      }

      // Add book to database
      await addBook.mutateAsync({
        title: formData.title || uploadedFile.name.replace(/\.(pdf|epub|txt)$/i, ""),
        author: formData.author || null,
        description: formData.description || null,
        cover_url: null,
        genre: selectedGenres[0] || null,
        format,
        file_url: filePath,
        status: "to_read",
        progress: 0,
        current_position: "",
        total_pages: 0,
        current_page: 0,
        toc: extractedToc,
        estimated_time_remaining: 0,
        is_from_library: false,
        open_library_key: null,
      });

      // 7. Nếu là PDF: tạo ảnh bìa từ trang 1 và cập nhật cover_url cho cuốn vừa tạo
      if (format === "pdf") {
        try {
          const cover = await renderPdfFirstPageToCoverBlob(file);
          const baseName = cleanFileName.replace(/\.pdf$/i, "");
          const coverPath = `${user.id}/${Date.now()}_${baseName}.${cover.extension}`;

          const { error: coverUploadError } = await supabase.storage
            .from(COVERS_BUCKET)
            .upload(coverPath, cover.blob, {
              cacheControl: "3600",
              upsert: false,
              contentType: cover.contentType,
            });

          if (coverUploadError) throw new Error(coverUploadError.message);

          const { data: coverPub } = supabase.storage
            .from(COVERS_BUCKET)
            .getPublicUrl(coverPath);

          const coverUrl = coverPub.publicUrl;

          await updateBook.mutateAsync({
            id: createdBook.id,
            cover_url: coverUrl,
          });
        } catch (err: any) {
          console.warn("Không thể tạo/cập nhật ảnh bìa tự động từ PDF:", err);
          toast({
            title: "Không thể tạo ảnh bìa",
            description:
              "Sách đã được thêm, nhưng chưa có ảnh bìa tự động. Hãy kiểm tra bucket book-covers (hoặc VITE_SUPABASE_COVERS_BUCKET) và Allowed MIME types image/*.",
          });
        }
      }

      toast({
        title: "Thêm sách thành công! 🐝",
        description: `"${formData.title}" đã được thêm vào thư viện`,
      });
      navigate("/");

    } catch (error: any) {
      console.error("Lỗi chi tiết:", error);
      
      // QUAN TRỌNG: Hiển thị lỗi thật sự ra màn hình
      toast({
        title: "Thất bại",
        description: error.message || "Có lỗi không xác định xảy ra",
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
        title: "Thêm sách thành công! 🐝",
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

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink/30 via-cream to-peach/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Thêm sách mới</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-soft-sage/50 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-sage" />
            <span className="text-sm font-medium text-secondary-foreground">
              Thêm sách vào thư viện
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tải sách lên <span className="gradient-text">Bookie Bee</span> 🐝
          </h1>
          <p className="text-muted-foreground">
            Upload sách hoặc tìm kiếm từ thư viện mở để thêm vào bộ sưu tập
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-muted/50">
            <TabsTrigger value="upload" className="gap-2 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Upload className="h-4 w-4" />
              Upload file
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Globe className="h-4 w-4" />
              Tìm kiếm
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <div className="glass-card rounded-3xl p-6 md:p-8 space-y-8">
              {/* File Upload Zone */}
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center ${
                  dragActive 
                    ? 'border-warm-pink bg-soft-pink/30' 
                    : uploadedFile 
                      ? 'border-sage bg-soft-sage/30'
                      : 'border-border hover:border-warm-pink/50 hover:bg-soft-pink/10'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.epub,.txt"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-soft-sage flex items-center justify-center">
                      <FileText className="w-8 h-8 text-sage" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        setFormData({ title: "", description: "", author: "" });
                      }}
                      className="rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-3xl bg-soft-pink mx-auto mb-4 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-warm-pink" />
                    </div>
                    <p className="text-foreground font-semibold mb-2">
                      Kéo thả file vào đây hoặc click để chọn
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hỗ trợ: PDF, EPUB, TXT (Tối đa 50MB)
                    </p>
                  </>
                )}
              </div>

              {/* Book Info Form */}
              {uploadedFile && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-foreground font-semibold">
                        Tên sách *
                      </Label>
                      <Input
                        id="title"
                        placeholder="Nhập tên sách..."
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-muted/30 border-none rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-foreground font-semibold">
                        Tác giả
                      </Label>
                      <Input
                        id="author"
                        placeholder="Tên tác giả..."
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="bg-muted/30 border-none rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground font-semibold">
                      Mô tả
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Viết vài dòng giới thiệu về cuốn sách..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-muted/30 border-none rounded-xl min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Genre Selection */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-semibold">Thể loại</Label>
                    <div className="flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <Button
                          key={genre}
                          type="button"
                          variant={selectedGenres.includes(genre) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleGenre(genre)}
                          className={`rounded-xl ${
                            selectedGenres.includes(genre) 
                              ? 'bg-gradient-to-r from-warm-pink to-coral text-white border-none' 
                              : 'border-border/50 hover:bg-soft-pink/30'
                          }`}
                        >
                          {genre}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Privacy Selection */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-semibold">Quyền riêng tư</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {privacyOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = privacy === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPrivacy(option.id)}
                            className={`p-4 rounded-2xl text-left transition-all ${
                              isSelected 
                                ? 'bg-soft-pink border-2 border-warm-pink' 
                                : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-warm-pink' : 'text-muted-foreground'}`} />
                            <p className="font-semibold text-foreground text-sm">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-12 border-border/50"
                      onClick={() => {
                        setUploadedFile(null);
                        setFormData({ title: "", description: "", author: "" });
                        setSelectedGenres([]);
                      }}
                    >
                      Hủy bỏ
                    </Button>
                    <Button 
                      className="flex-1 gap-2 rounded-xl h-12 bg-gradient-to-r from-warm-pink to-coral hover:opacity-90"
                      onClick={handleUploadBook}
                      disabled={isUploading || !formData.title}
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <BookIcon className="w-5 h-5" />
                      )}
                      {isUploading ? "Đang tải lên..." : "Tải lên"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
              {/* Search input */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên sách hoặc tác giả..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchOpenLibrary()}
                    className="pl-11 h-12 rounded-xl bg-muted/30 border-none"
                  />
                </div>
                <Button 
                  onClick={searchOpenLibrary} 
                  disabled={isSearching}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-warm-pink to-coral hover:opacity-90"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm"}
                </Button>
              </div>

              {/* Results */}
              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-warm-pink" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-soft-sage/50 flex items-center justify-center mb-4">
                    <Globe className="h-10 w-10 text-sage" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    Tìm kiếm sách từ Open Library
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nhập tên sách hoặc tác giả để bắt đầu
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((book) => (
                    <button
                      key={book.key}
                      onClick={() => addFromLibrary(book)}
                      className="flex w-full items-start gap-4 rounded-2xl bg-muted/30 p-4 text-left transition-all hover:bg-soft-pink/30 hover:scale-[1.01]"
                    >
                      {book.cover_i ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                          alt={book.title}
                          className="h-24 w-16 rounded-xl object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-24 w-16 items-center justify-center rounded-xl bg-soft-sage">
                          <BookIcon className="h-8 w-8 text-sage" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-2">
                          {book.title}
                        </h3>
                        {book.author_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {book.author_name[0]}
                          </p>
                        )}
                        {book.first_publish_year && (
                          <p className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-muted/50 rounded-lg inline-block">
                            {book.first_publish_year}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AddBook;