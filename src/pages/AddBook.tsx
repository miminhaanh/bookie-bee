import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Upload as UploadIcon,
  Globe,
  Loader2,
  FileText,
  BookOpen,
  X,
  Sparkles,
  Lock,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, type BookFormat } from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";
import type { TocItem } from "@/hooks/useBooks";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const BOOK_FILES_BUCKET = import.meta.env.VITE_SUPABASE_BOOK_FILES_BUCKET ?? "book-files";
const COVERS_BUCKET = import.meta.env.VITE_SUPABASE_COVERS_BUCKET ?? "book-covers";

type CoverBlobResult = {
  blob: Blob;
  contentType: string;
  extension: string;
};

const renderPdfFirstPageToCoverBlob = async (file: File): Promise<CoverBlobResult> => {
  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1);

  const initialViewport = page.getViewport({ scale: 1 });
  const maxDim = 1200;
  const scale = Math.min(2, maxDim / Math.max(initialViewport.width, initialViewport.height));
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Không thể tạo canvas context");

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({ canvasContext: context, viewport }).promise;

  const toBlob = (type: string, quality?: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  const webp = await toBlob("image/webp", 0.92);
  if (webp) return { blob: webp, contentType: "image/webp", extension: "webp" };

  const png = await toBlob("image/png");
  if (!png) throw new Error("Không thể tạo ảnh bìa từ PDF");
  return { blob: png, contentType: "image/png", extension: "png" };
};

const extractPdfToc = async (file: File): Promise<TocItem[] | null> => {
  try {
    const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
    const outline = await pdf.getOutline();
    if (!outline || outline.length === 0) return null;

    const resolveDestToPage = async (dest: any): Promise<number | null> => {
      try {
        const destination =
          typeof dest === "string" ? await pdf.getDestination(dest) : dest;
        if (!destination || !Array.isArray(destination) || destination.length === 0) return null;
        const ref = destination[0];
        const pageIndex = await pdf.getPageIndex(ref);
        return pageIndex + 1;
      } catch {
        return null;
      }
    };

    const mapItems = async (items: any[]): Promise<TocItem[]> => {
      const mapped = await Promise.all(
        items.map(async (it) => {
          const page = it.dest ? await resolveDestToPage(it.dest) : null;
          const children = it.items ? await mapItems(it.items) : [];
          return {
            title: typeof it.title === "string" ? it.title : "",
            page,
            items: children,
          } satisfies TocItem;
        })
      );
      return mapped.filter((x) => x.title.trim().length > 0);
    };

    return await mapItems(outline as any[]);
  } catch {
    return null;
  }
};

const genres = [
  "Văn học", "Self-help", "Kinh doanh", "Khoa học", 
  "Lịch sử", "Tâm lý", "Truyện ngắn", "Tiểu thuyết"
];

const privacyOptions = [
  { id: "private", label: "Riêng tư", icon: Lock, desc: "Chỉ mình bạn xem được" },
  { id: "link", label: "Chia sẻ link", icon: Link2, desc: "Ai có link đều xem được" },
  { id: "public", label: "Công khai", icon: Globe, desc: "Hiển thị trong cộng đồng" },
];

const Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState("private");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
  });
  
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
        const title = file.name.replace(/\.(pdf|txt)$/i, "").replace(/_/g, " ");
        setFormData(prev => ({ ...prev, title }));
      } else {
        toast({
          title: "Định dạng không hỗ trợ",
          description: "Chỉ hỗ trợ file PDF hoặc TXT",
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
        description: "Chỉ hỗ trợ file PDF hoặc TXT",
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
    const title = file.name.replace(/\.(pdf|txt)$/i, "").replace(/_/g, " ");
    setFormData(prev => ({ ...prev, title }));
  };

  const handleUploadBook = async () => {
    if (!uploadedFile || !user) return;

    const format = getFileFormat(uploadedFile.name);
    if (!format) return;

    setIsUploading(true);
    try {
      const pdfTotalPages =
        format === "pdf"
          ? (await getDocument({ data: await uploadedFile.arrayBuffer() }).promise).numPages
          : null;

      const extractedToc =
        format === "pdf" ? await extractPdfToc(uploadedFile) : null;

      // Upload file to storage
      const cleanFileName = sanitizeFileName(uploadedFile.name);
      const filePath = `${user.id}/${Date.now()}-${cleanFileName}`;

      console.log("Đang upload lên path:", filePath);

      // 4. Upload lên Storage
      const { error: uploadError } = await supabase.storage
        .from(BOOK_FILES_BUCKET)
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
      const createdBook = await addBook.mutateAsync({
        title: formData.title || uploadedFile.name.replace(/\.(pdf|txt)$/i, ""),
        author: formData.author || null,
        description: formData.description || null,
        cover_url: null,
        genre: selectedGenres[0] || null,
        format,
        file_url: filePath,
        status: "to_read",
        progress: 0,
        current_position: null,
        total_pages: pdfTotalPages,
        current_page: 0,
        toc: extractedToc as unknown as Json,
        estimated_time_remaining: null,
        is_from_library: false,
        open_library_key: null,
      });

      // 7. Nếu là PDF: tạo ảnh bìa từ trang 1 và cập nhật cover_url cho cuốn vừa tạo
      if (format === "pdf") {
        try {
          const cover = await renderPdfFirstPageToCoverBlob(uploadedFile);
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

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-soft-sage/50 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-sage" />
            <span className="text-sm font-medium text-secondary-foreground">
              Chia sẻ sách của bạn
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tải sách lên <span className="gradient-text">BookNest</span> 📚
          </h1>
          <p className="text-muted-foreground">
            Upload sách hoặc viết truyện gốc của bạn để chia sẻ với cộng đồng
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-8 space-y-8">
          {/* File Upload Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center ${
              dragActive
                ? "border-warm-pink bg-soft-pink/30"
                : uploadedFile
                  ? "border-sage bg-soft-sage/30"
                  : "border-border hover:border-warm-pink/50 hover:bg-soft-pink/10"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.txt"
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
                    setSelectedGenres([]);
                    setPrivacy("private");
                    setFormData({ title: "", description: "", author: "" });
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 rounded-3xl bg-soft-pink mx-auto mb-4 flex items-center justify-center">
                  <UploadIcon className="w-10 h-10 text-warm-pink" />
                </div>
                <p className="text-foreground font-semibold mb-2">
                  Kéo thả file vào đây hoặc click để chọn
                </p>
                <p className="text-sm text-muted-foreground">
                  Hỗ trợ: PDF, TXT (Tối đa 50MB)
                </p>
              </>
            )}
          </div>

          {/* Book Info Form */}
          <div className="space-y-6">
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
                  className="bg-muted/30 border-none rounded-xl"
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
                  className="bg-muted/30 border-none rounded-xl"
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
                    className={!selectedGenres.includes(genre) ? "border-border/50" : ""}
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
                          ? "bg-soft-pink border-2 border-warm-pink"
                          : "bg-muted/30 border-2 border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mb-2 ${
                          isSelected ? "text-warm-pink" : "text-muted-foreground"
                        }`}
                      />
                      <p className="font-semibold text-foreground text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              disabled
              onClick={() => {
                toast({
                  title: "Chưa hỗ trợ",
                  description: "Tính năng lưu nháp sẽ được cập nhật sau.",
                });
              }}
            >
              Lưu nháp
            </Button>
            <Button
              className="flex-1 gap-2"
              type="button"
              onClick={handleUploadBook}
              disabled={isUploading || !uploadedFile || !formData.title}
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
              {isUploading ? "Đang tải lên..." : "Tải lên"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;