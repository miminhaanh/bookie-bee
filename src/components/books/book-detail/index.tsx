import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useHighlights } from "@/hooks/useHighlights";
import { useToast } from "@/hooks/use-toast";
import { usePdfToc } from "@/hooks/usePdfToc";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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

  // Fetch reading history from reading_sessions
  const { data: readingHistory } = useQuery({
    queryKey: ["reading-history", id],
    enabled: !!id && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("reading_sessions")
        .select("started_at")
        .eq("book_id", id!)
        .eq("user_id", user!.id)
        .order("started_at", { ascending: true })
        .limit(1);
      
      const { data: lastData } = await supabase
        .from("reading_sessions")
        .select("started_at")
        .eq("book_id", id!)
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(1);

      return {
        startedAt: data?.[0]?.started_at ?? null,
        lastReadAt: lastData?.[0]?.started_at ?? null,
      };
    },
  });

  // Fetch highlights
  const { highlights } = useHighlights(id || "");

  // Extract TOC from PDF automatically
  const { toc: extractedToc, isLoading: tocLoading } = usePdfToc(book?.file_url);

  // Auto-save extracted TOC to book if book has no TOC
  useEffect(() => {
    if (!id || !book || !extractedToc || extractedToc.length === 0) return;
    
    // Chỉ lưu nếu book chưa có TOC
    const existingToc = book.toc as Array<{ title: string; page: number }> | null;
    if (existingToc && existingToc.length > 0) return;

    // Lưu TOC vào database
    const saveToc = async () => {
      try {
        const { error } = await supabase
          .from("books")
          .update({ toc: extractedToc as unknown as Json })
          .eq("id", id);
        
        if (error) {
          console.error("Error saving TOC:", error);
        } else {
          console.log("✅ TOC extracted and saved from PDF");
          qc.invalidateQueries({ queryKey: ["books"] });
        }
      } catch (err) {
        console.error("Error saving TOC:", err);
      }
    };

    saveToc();
  }, [id, book, extractedToc, qc]);

  // Determine which TOC to show: existing from DB or extracted from PDF
  const effectiveToc = useMemo(() => {
    const existingToc = book?.toc as Array<{ title: string; page: number }> | null;
    if (existingToc && existingToc.length > 0) return existingToc;
    return extractedToc;
  }, [book?.toc, extractedToc]);

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

  // Delete book mutation - Preserve XP before deleting
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id || !book || !user?.id) throw new Error("No book ID");
      
      // Calculate XP earned from this book based on pages read (same formula as reports)
      const pagesRead = book.status === "completed" 
        ? (book.total_pages || 0)
        : (book.current_page || 0);

      // Save earned XP to profile's bonus_xp before deleting book
      if (pagesRead > 0) {
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("bonus_xp")
          .eq("user_id", user.id)
          .single();
        
        if (fetchError) {
          console.error("Failed to fetch profile for XP preservation:", fetchError);
        } else {
          const currentBonusXP = (profile as { bonus_xp: number | null })?.bonus_xp ?? 0;
          const newBonusXP = currentBonusXP + pagesRead;
          
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ bonus_xp: newBonusXP })
            .eq("user_id", user.id);
          
          if (updateError) {
            console.error("Failed to save bonus_xp:", updateError);
          } else {
            console.log(`XP preserved: ${pagesRead} pages added to bonus_xp (${currentBonusXP} → ${newBonusXP})`);
          }
        }
      }

      // Now delete the book
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["reports-data"] });
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
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
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
            onClick={() => navigate("/")}
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
            canEdit={user?.id === book.user_id && !book.is_from_library}
            onEditClick={() => setIsEditOpen(true)}
            onStartReading={handleStartReading}
          />

          <div className="rounded-[28px] p-6 border border-border/60 bg-card/60 backdrop-blur">
            <BookInfoTabs 
              description={book.description} 
              tocData={effectiveToc} 
              tocLoading={tocLoading && !effectiveToc?.length}
              bookId={id}
              onTocItemClick={(page) => {
                if (page && id) {
                  navigate(`/read/${id}?page=${page}`);
                }
              }}
            />
          </div>

          <div className="rounded-2xl p-5 border border-border/60 bg-card/60 backdrop-blur">
            <div className="flex flex-col gap-4">
              <ReadingProgress
                currentPage={book.current_page || 0}
                totalPages={book.total_pages || 0}
              />
              <ReadingHistory
                startedAt={readingHistory?.startedAt ?? null}
                lastReadAt={readingHistory?.lastReadAt ?? null}
                currentPage={book.current_page || 0}
                totalPages={book.total_pages || 0}
              />
            </div>
          </div>

          <div className="rounded-[26px] p-6 border border-border/60 bg-card/60 backdrop-blur">
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
