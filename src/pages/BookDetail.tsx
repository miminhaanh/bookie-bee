import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, BookOpen, List, Highlighter, MoreVertical, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBooks } from "@/hooks/useBooks";
import { useHighlights } from "@/hooks/useHighlights";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const colorMap = {
  yellow: "bg-highlight-yellow",
  blue: "bg-highlight-blue",
  red: "bg-highlight-red",
};

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { books, deleteBook, updateBook, isLoading } = useBooks();
  const { highlights } = useHighlights(id);
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const book = books.find((b) => b.id === id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <BookOpen className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-medium">Không tìm thấy sách</h2>
        <Button onClick={() => navigate("/")} className="mt-4">
          Về trang chủ
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteBook.mutateAsync(book.id);
      toast({
        title: "Đã xóa sách",
        description: `"${book.title}" đã được xóa khỏi thư viện`,
      });
      navigate("/");
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sách",
        variant: "destructive",
      });
    }
  };

  const handleStartReading = async () => {
    if (book.status === "to_read") {
      await updateBook.mutateAsync({ id: book.id, status: "reading" });
    }
    navigate(`/read/${book.id}`);
  };

  const estimatedMinutes = book.estimated_time_remaining 
    ? Math.round(book.estimated_time_remaining / 60) 
    : null;

  return (
    <div className="min-h-screen bg-background safe-area-bottom">
      {/* Hero section with cover */}
      <div className="relative">
        {/* Blurred background */}
        <div 
          className="absolute inset-0 h-64 bg-cover bg-center blur-2xl opacity-30"
          style={{ 
            backgroundImage: book.cover_url ? `url(${book.cover_url})` : undefined,
            backgroundColor: book.cover_url ? undefined : "hsl(var(--primary) / 0.2)",
          }}
        />
        
        {/* Header */}
        <header className="relative flex items-center justify-between px-4 py-3 safe-area-top">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa sách
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Cover */}
        <div className="relative flex justify-center pb-4">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="h-52 w-36 rounded-xl object-cover shadow-xl"
            />
          ) : (
            <div className="flex h-52 w-36 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-xl">
              <BookOpen className="h-16 w-16 text-primary/40" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative bg-background px-4 pt-4">
        {/* Title & Author */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">{book.title}</h1>
          {book.author && (
            <p className="mt-1 text-muted-foreground">{book.author}</p>
          )}
          {book.genre && (
            <span className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {book.genre}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6 rounded-xl bg-card p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Tiến độ</span>
            <span className="text-sm font-medium text-foreground">{Math.round(book.progress)}%</span>
          </div>
          <Progress value={book.progress} className="h-2" />
          {estimatedMinutes && (
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Còn khoảng {estimatedMinutes} phút để hoàn thành
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about" className="gap-1.5 text-xs">
              <BookOpen className="h-4 w-4" />
              Giới thiệu
            </TabsTrigger>
            <TabsTrigger value="toc" className="gap-1.5 text-xs">
              <List className="h-4 w-4" />
              Mục lục
            </TabsTrigger>
            <TabsTrigger value="highlights" className="gap-1.5 text-xs">
              <Highlighter className="h-4 w-4" />
              Highlights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {book.description || "Chưa có mô tả cho cuốn sách này."}
            </p>
          </TabsContent>

          <TabsContent value="toc" className="mt-4">
            <p className="text-sm text-muted-foreground text-center py-8">
              Mục lục sẽ hiển thị khi bạn bắt đầu đọc sách
            </p>
          </TabsContent>

          <TabsContent value="highlights" className="mt-4">
            {highlights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Chưa có highlight nào
              </p>
            ) : (
              <div className="space-y-3">
                {highlights.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    className={cn("rounded-lg p-3", colorMap[h.color])}
                  >
                    <p className="text-sm text-foreground">"{h.content}"</p>
                    {h.note && (
                      <p className="mt-1 text-xs text-muted-foreground italic">
                        📝 {h.note}
                      </p>
                    )}
                  </div>
                ))}
                {highlights.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/notes")}
                  >
                    Xem tất cả ({highlights.length})
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-area-bottom">
        <Button 
          className="w-full h-12 text-base"
          onClick={handleStartReading}
          disabled={!book.file_url && !book.is_from_library}
        >
          <Play className="mr-2 h-5 w-5" />
          {book.progress > 0 ? "Đọc tiếp" : "Bắt đầu đọc"}
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sách này?</AlertDialogTitle>
            <AlertDialogDescription>
              "{book.title}" sẽ bị xóa khỏi thư viện của bạn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookDetail;