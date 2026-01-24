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

  // Update book mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Book>) => {
      if (!id) throw new Error("No book ID");
      const { error } = await supabase.from("books").update(updates).eq("id", id);
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
    <div className="min-h-screen bg-[#FFFCF8]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8 flex items-center justify-between">
          <Button variant="ghost" className="px-0 text-[#111]" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>

          {user?.id === book.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#111]">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa sách
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        <div className="space-y-0">
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

          <BookInfoTabs description={book.description} tocData={book.toc} />

          <ReadingHistory
            startedAt={(book as any).started_at}
            lastReadAt={(book as any).last_read_at}
            currentPage={book.current_page || 0}
            totalPages={book.total_pages || 0}
          />

          <HighlightsSection
            highlights={highlights || []}
            onDeleteHighlight={(hid) => deleteHighlightMutation.mutate(hid)}
          />
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
      </div>
    </div>
  );
}
