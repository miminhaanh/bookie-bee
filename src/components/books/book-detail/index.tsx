import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useHighlights } from "@/hooks/useHighlights";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import { BookHero } from "./BookHero";
import { ReadingProgress } from "./ReadingProgress";
import { ActionButtons } from "./ActionButtons";
import { BookInfoTabs } from "./BookInfoTabs";
import { HighlightsSection } from "./HighlightsSection";
import { ReadingHistory } from "./ReadingHistory";
import { BookDetailModals } from "./BookDetailModals";
import type { Book } from "@/hooks/useBooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BookDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Fetch book data
  const { books } = useBooks();
  const book = useMemo(() => books?.find((b) => b.id === id), [books, id]);

  // Fetch highlights
  const { highlights } = useHighlights(id || "");

  // Update book mutation - ✅ Dùng upsert thay update để tránh CORS PATCH
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Book>) => {
      if (!id || !book) throw new Error("No book ID");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Phiên đăng nhập đã hết hạn");

      // Dùng upsert (POST) thay vì update (PATCH)
      const { error } = await supabase
        .from("books")
        .upsert(
          {
            ...book,
            ...updates,
            id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "✅ Cập nhật thành công!" });
      setIsEditOpen(false);
    },
    onError: (err: unknown) => {
      console.error(err);
      toast({ title: "❌ Lỗi khi cập nhật", variant: "destructive" });
    },
  });

  // Delete book mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No book ID");
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "✅ Đã xóa sách" });
      navigate("/dashboard");
    },
    onError: (err: unknown) => {
      console.error(err);
      toast({ title: "❌ Lỗi khi xóa", variant: "destructive" });
    },
  });

  // Delete highlight mutation
  const deleteHighlightMutation = useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase.from("highlights").delete().eq("id", highlightId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["highlights"] });
      toast({ title: "✅ Đã xóa highlight" });
    },
    onError: (err: unknown) => {
      console.error(err);
      toast({ title: "❌ Lỗi khi xóa", variant: "destructive" });
    },
  });

  const handleSaveEdit = (data: {
    title: string;
    author: string;
    description: string;
    genre: string;
  }) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleStartReading = () => {
    if (!book.file_url) {
      toast({ title: "Thiếu file PDF", description: "Vui lòng tải lên file PDF để đọc.", variant: "destructive" });
      return;
    }

    if (book.format && book.format !== "pdf") {
      toast({
        title: "Chỉ hỗ trợ PDF",
        description: "Bookie Bee hiện chưa hỗ trợ EPUB/TXT. Hãy chuyển sang file PDF để tiếp tục.",
        variant: "destructive",
      });
      return;
    }

    if (id) {
      navigate(`/read/${id}`);
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-5xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <p className="text-center text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-warm-pink/30 to-coral/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-lavender/30 to-sky/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-sage/30 to-soft-sage/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/3 w-60 h-60 bg-gradient-to-br from-peach/30 to-soft-pink/20 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>

          {user?.id === book.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa sách
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="space-y-10">
          <BookHero book={book} />

          {((book.format && book.format !== "pdf") || !book.file_url) && (
            <Alert className="mb-8 border-[#FCD5C0] bg-[#FFF6F0] text-[#7C2E12]">
              <AlertTitle>Chỉ hỗ trợ PDF</AlertTitle>
              <AlertDescription>
                Bookie Bee hiện tập trung vào trải nghiệm đọc PDF. Vui lòng đảm bảo bạn đã tải lên file PDF hợp lệ để mở trong trình đọc.
              </AlertDescription>
            </Alert>
          )}

          <ActionButtons
            book={book}
            canEdit={user?.id === book.user_id}
            onEditClick={() => setIsEditOpen(true)}
            onStartReading={handleStartReading}
          />

          <ReadingProgress
            currentPage={book.current_page || 0}
            totalPages={book.total_pages || 0}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl p-6 border border-border/60 bg-card/60 backdrop-blur">
              <BookInfoTabs description={book.description} tocData={book.toc} />
            </div>
            <div className="rounded-3xl p-6 border border-border/60 bg-card/60 backdrop-blur">
              <ReadingHistory
                startedAt={(book as any).started_at}
                lastReadAt={(book as any).last_read_at}
                currentPage={book.current_page || 0}
                totalPages={book.total_pages || 0}
              />
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-border/60 bg-card/60 backdrop-blur">
            <HighlightsSection
              highlights={highlights || []}
              onDeleteHighlight={(hid) => deleteHighlightMutation.mutate(hid)}
            />
          </div>
        </div>

        <BookDetailModals
          book={book}
          showDeleteDialog={showDeleteDialog}
          onDeleteDialogChange={setShowDeleteDialog}
          onDeleteConfirm={handleDelete}
          isEditOpen={isEditOpen}
          onEditOpenChange={setIsEditOpen}
          onSaveEdit={handleSaveEdit}
        />
      </main>
    </div>
  );
}
