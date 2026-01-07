import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type HighlightColor = "yellow" | "blue" | "red";

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  content: string;
  note: string | null;
  color: HighlightColor;
  position: string | null;
  chapter: string | null;
  page_number: number | null;
  created_at: string;
  updated_at: string;
}

export const useHighlights = (bookId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = bookId 
    ? ["highlights", user?.id, bookId] 
    : ["highlights", user?.id];

  const { data: highlights = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("highlights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookId) {
        query = query.eq("book_id", bookId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Highlight[];
    },
    enabled: !!user?.id,
  });

  const addHighlight = useMutation({
    mutationFn: async (highlight: Omit<Highlight, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("No user");
      
      const { data, error } = await supabase
        .from("highlights")
        .insert([{ ...highlight, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Highlight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id] });
    },
  });

  const updateHighlight = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Highlight> & { id: string }) => {
      if (!user?.id) throw new Error("No user");
      
      const { error } = await supabase
        .from("highlights")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id] });
    },
  });

  const deleteHighlight = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("No user");
      
      const { error } = await supabase
        .from("highlights")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", user?.id] });
    },
  });

  return {
    highlights,
    isLoading,
    error,
    addHighlight,
    updateHighlight,
    deleteHighlight,
  };
};