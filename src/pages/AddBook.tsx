import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  Globe,
  Loader2,
  FileText,
  BookOpen,
  X,
  Lock,
  Link2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useBooks, type BookFormat } from "@/hooks/useBooks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";
import type { TocItem } from "@/hooks/useBooks";
import { cn } from "@/lib/utils";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const BOOK_FILES_BUCKET = import.meta.env.VITE_SUPABASE_BOOK_FILES_BUCKET ?? "book-files";
const COVERS_BUCKET = import.meta.env.VITE_SUPABASE_COVERS_BUCKET ?? "book-covers";

type CoverBlobResult = {
  blob: Blob;
  contentType: string;
  extension: string;
};

// ... existing helper functions (renderPdfFirstPageToCoverBlob, extractPdfToc) ...
// Keeping them inline for brevity, logic remains same
const renderPdfFirstPageToCoverBlob = async (file: File): Promise<CoverBlobResult> => {
  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context failed");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Blob creation failed");
  return { blob, contentType: "image/png", extension: "png" };
};

const extractPdfToc = async (file: File): Promise<TocItem[] | null> => {
  try {
    const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
    const outline = await pdf.getOutline();
    return outline ? outline.map(it => ({ title: it.title, page: null, items: [] } as any)) : null;
  } catch { return null; }
};


const genres = [
  "Văn học", "Self-help", "Kinh doanh", "Khoa học",
  "Lịch sử", "Tâm lý", "Truyện ngắn", "Tiểu thuyết"
];

const privacyOptions = [
  { id: "private", label: "Riêng tư", icon: Lock, desc: "Chỉ mình tôi" },
  { id: "link", label: "Chia sẻ link", icon: Link2, desc: "Bất kỳ ai có link" },
  { id: "public", label: "Công khai", icon: Globe, desc: "Mọi người" },
];

const Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState("private");
  const [uploadProgress, setUploadProgress] = useState<{
    stage: 'idle' | 'reading' | 'uploading' | 'processing' | 'generating-cover' | 'done';
    percent: number;
    message: string;
  }>({ stage: 'idle', percent: 0, message: '' });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
  });

  const { user, loading: authLoading } = useAuth();
  const { addBook, updateBook } = useBooks();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!authLoading && !user) navigate("/auth");

  const getFileFormat = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["pdf", "epub", "txt"].includes(ext || "") ? (ext as BookFormat) : null;
  };

  const sanitation = (name: string) => name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const format = getFileFormat(file.name);
    if (!format) {
      toast({ title: "Định dạng không hỗ trợ", description: "Chỉ hỗ trợ PDF, EPUB, TXT", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File quá lớn", description: "Tối đa 50MB", variant: "destructive" });
      return;
    }
    setUploadedFile(file);
    setFormData(prev => ({ ...prev, title: file.name.replace(/\.(pdf|epub|txt)$/i, "").replace(/_/g, " ") }));
  };

  const handleUploadBook = async () => {
    if (!uploadedFile || !user) return;
    const format = getFileFormat(uploadedFile.name);
    if (!format) return;

    setIsUploading(true);
    setUploadProgress({ stage: 'reading', percent: 10, message: 'Đang đọc file...' });

    try {
      const pdfTotalPages = format === "pdf" ? (await getDocument({ data: await uploadedFile.arrayBuffer() }).promise).numPages : null;
      setUploadProgress({ stage: 'processing', percent: 30, message: 'Xử lý dữ liệu...' });
      const extractedToc = format === "pdf" ? await extractPdfToc(uploadedFile) : null;

      const cleanName = sanitation(uploadedFile.name);
      const filePath = `${user.id}/${Date.now()}-${cleanName}`;
      setUploadProgress({ stage: 'uploading', percent: 50, message: 'Đang tải lên...' });

      const { error: uploadError } = await supabase.storage.from(BOOK_FILES_BUCKET).upload(filePath, uploadedFile);
      if (uploadError) throw new Error(uploadError.message);

      setUploadProgress({ stage: 'processing', percent: 70, message: 'Lưu thông tin sách...' });

      const createdBook = await addBook.mutateAsync({
        title: formData.title,
        author: formData.author || null,
        description: formData.description || null,
        cover_url: null,
        genre: selectedGenres.join(", ") || null, // Join multiple genres
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
        visibility: privacy, // Map to new column
      });

      if (format === "pdf") {
        setUploadProgress({ stage: 'generating-cover', percent: 90, message: 'Tạo bìa sách...' });
        try {
          const cover = await renderPdfFirstPageToCoverBlob(uploadedFile);
          const coverPath = `${user.id}/${Date.now()}_cover_${cleanName.replace(/\.pdf$/, "")}.png`;
          await supabase.storage.from(COVERS_BUCKET).upload(coverPath, cover.blob);
          const { data: { publicUrl } } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(coverPath);
          await updateBook.mutateAsync({ id: createdBook.id, cover_url: publicUrl });
        } catch (e) { console.warn("Cover gen failed", e); }
      }

      setUploadProgress({ stage: 'done', percent: 100, message: 'Hoàn tất!' });
      toast({ title: "Thành công", description: `Đã thêm sách "${formData.title}"` });
      setTimeout(() => navigate("/"), 800);

    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-rose-100">
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-10 text-center md:text-left border-b border-slate-100 pb-8">
          <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
            <BookOpen className="w-6 h-6 text-slate-800" strokeWidth={2} />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tải sách lên BookNest</h1>
          </div>
          <p className="text-slate-500 text-base max-w-2xl">
            Lưu trữ và chia sẻ những cuốn sách yêu thích của bạn. Hỗ trợ định dạng PDF, EPUB.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Col: Upload Zone */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className={cn(
                "relative border-2 border-dashed rounded-xl p-10 transition-all text-center h-80 flex flex-col items-center justify-center cursor-pointer group hover:bg-slate-50",
                dragActive ? "border-rose-400 bg-rose-50/50" : "border-slate-200",
                uploadedFile ? "bg-slate-50 border-solid border-slate-300" : ""
              )}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={(e) => {
                e.preventDefault(); setDragActive(false);
                if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input id="file-upload" type="file" className="hidden" accept=".pdf,.epub,.txt" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />

              {uploadedFile ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-rose-500">
                    <FileText className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]">{uploadedFile.name}</p>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-8 px-4 rounded-full text-xs font-bold"
                    onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}>
                    Thay đổi file
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pointer-events-none">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400 group-hover:scale-110 transition-transform duration-300">
                    <UploadIcon className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-700">Kéo thả file vào đây</p>
                    <p className="text-sm text-slate-400">hoặc click để chọn file</p>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest pt-4">Max 50MB • PDF, EPUB</p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {uploadProgress.stage !== 'idle' && (
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>{uploadProgress.message}</span>
                  <span>{uploadProgress.percent}%</span>
                </div>
                <Progress value={uploadProgress.percent} className="h-1.5 bg-slate-100" />
              </div>
            )}
          </div>

          {/* Right Col: Form */}
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tên sách <span className="text-rose-500">*</span></Label>
                <Input id="title" placeholder="Nhập tên sách..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="h-11 rounded-lg border-slate-200 bg-white focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tác giả</Label>
                <Input id="author" placeholder="Tên tác giả..." value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="h-11 rounded-lg border-slate-200 bg-white focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mô tả</Label>
              <Textarea id="desc" placeholder="Giới thiệu nội dung sách..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px] rounded-lg border-slate-200 bg-white focus-visible:ring-rose-500/20 focus-visible:border-rose-500 transition-all resize-none font-medium leading-relaxed" />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Thể loại</Label>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button key={genre} type="button" onClick={() => toggleGenre(genre)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium border transition-all",
                      selectedGenres.includes(genre) ? "border-rose-500 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}>
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quyền riêng tư</Label>
              <div className="grid grid-cols-3 gap-3">
                {privacyOptions.map(opt => {
                  const Icon = opt.icon;
                  const isActive = privacy === opt.id;
                  return (
                    <button key={opt.id} type="button" onClick={() => setPrivacy(opt.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                        isActive ? "border-rose-500 bg-white shadow-sm ring-1 ring-rose-500/20" : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                      )}>
                      <Icon className={cn("w-4 h-4 mb-2", isActive ? "text-rose-500" : "text-slate-400")} />
                      <div className="text-sm font-bold text-slate-800">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{opt.desc}</div>
                      {isActive && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
              <Button variant="outline" className="h-10 px-6 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">Lưu nháp</Button>
              <Button onClick={handleUploadBook} disabled={isUploading || !uploadedFile || !formData.title}
                className="h-10 px-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-sm shadow-rose-200 disabled:opacity-50">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isUploading ? "Đang tải..." : "Tải lên ngay"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;