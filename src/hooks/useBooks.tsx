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
}

export const useBooks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ["books", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
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

  const addBook = useMutation({
    mutationFn: async (book: Omit<Book, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("No user");

      const { data, error } = await supabase
        .from("books")
        .insert([{ ...book, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["reports-data"] });
    },
  });

  const updateBook = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Book> & { id: string }) => {
      if (!user?.id) throw new Error("No user");

      const { error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["reports-data"] });
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("No user");

      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

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