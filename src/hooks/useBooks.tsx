import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

export type BookStatus = "reading" | "completed" | "to_read";
export type BookFormat = "pdf" | "epub" | "txt";

export interface TocItem {
  title: string;
  page: number | null;
  items: TocItem[];
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  format: BookFormat | null;
  file_url: string | null;
  status: BookStatus;
  progress: number;
  current_position: string | null;
  total_pages: number | null;
  current_page: number;
  estimated_time_remaining: number | null;
  is_from_library: boolean;
  open_library_key: string | null;
  toc?: Json | null;
  summary?: string | null;
  created_at: string;
  updated_at: string;
  visibility?: string | null;
  is_public?: boolean | null;
  started_at?: string | null;
  last_read_at?: string | null;
}

export const useBooks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ["books", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // ✅ Verify session is valid before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("No valid session for books query");
        return [];
      }

      const { data, error } = await supabase
        .from("books")
        .select("*")
        // ✅ KHÔNG cần .eq("user_id", user.id) vì RLS đã filter theo auth.uid()
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Book[];
    },
    enabled: !!user?.id,
  });

  // Sort: reading first, then by updated_at
  const sortedBooks = [...books].sort((a, b) => {
    if (a.status === "reading" && b.status !== "reading") return -1;
    if (a.status !== "reading" && b.status === "reading") return 1;
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // ✅ FIX: KHÔNG gửi user_id - để Supabase tự set từ auth.uid() qua DEFAULT
  const addBook = useMutation({
    mutationFn: async (book: Omit<Book, "id" | "user_id" | "created_at" | "updated_at">) => {
      // Verify session trước khi insert
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

      // ✅ KHÔNG truyền user_id - RLS + DEFAULT sẽ tự xử lý
      const { data, error } = await supabase
        .from("books")
        .insert(book) // ← Chỉ truyền book data, KHÔNG có user_id
        .select()
        .maybeSingle();

      if (error) {
        console.error("Insert book error:", error);
        if (error.code === "42501" || error.message.includes("policy")) {
          throw new Error("Không có quyền thêm sách. Vui lòng đăng nhập lại.");
        }
        throw error;
      }
      
      return data as Book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["reports-data"] });
    },
  });

  // ✅ FIX: Dùng upsert thay update để tránh CORS PATCH
  const updateBook = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Book> & { id: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

      // Lấy book hiện tại để merge với updates
      const { data: existingBook, error: fetchError } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !existingBook) {
        throw new Error("Không tìm thấy sách để cập nhật");
      }

      // ✅ Dùng upsert (POST) thay vì update (PATCH) để tránh CORS
      const { error } = await supabase
        .from("books")
        .upsert(
          {
            ...existingBook,
            ...updates,
            id, // Giữ nguyên id
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Update book error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["reports-data"] });
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id);
        // ✅ KHÔNG cần .eq("user_id", user.id) vì RLS đã filter

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["reports-data"] });
    },
  });

  const readingCount = books.filter((b) => b.status === "reading").length;
  const completedCount = books.filter((b) => b.status === "completed").length;

  return {
    books: sortedBooks,
    isLoading,
    error,
    addBook,
    updateBook,
    deleteBook,
    readingCount,
    completedCount,
  };
};