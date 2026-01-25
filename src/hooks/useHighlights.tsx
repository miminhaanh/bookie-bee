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

  const userId = user?.id;

  const baseKey = ["highlights", userId] as const;
  const queryKey = (bookId ? (["highlights", userId, bookId] as const) : baseKey);

  const { data: highlights = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("highlights")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (bookId) {
        query = query.eq("book_id", bookId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Highlight[];
    },
    enabled: !!userId,
  });

  const addHighlight = useMutation({
    mutationFn: async (highlight: Omit<Highlight, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!userId) throw new Error("No user");
      
      const { data, error } = await supabase
        .from("highlights")
        .insert([{ ...highlight, user_id: userId }])
        .select()
        .limit(1);

      if (error) throw error;
      return (data?.[0] ?? null) as Highlight;
    },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });

  const updateHighlight = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Highlight> & { id: string }) => {
      if (!userId) throw new Error("No user");
      
      const { error } = await supabase
        .from("highlights")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });

  const deleteHighlight = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("No user");
      
      const { error } = await supabase
        .from("highlights")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onMutate: async (id: string) => {
      if (!userId) return { previous: [] as Array<[unknown[], Highlight[] | undefined]> };

      await queryClient.cancelQueries({ queryKey: baseKey });

      const previous = queryClient.getQueriesData<Highlight[]>({ queryKey: baseKey });

      queryClient.setQueriesData<Highlight[]>({ queryKey: baseKey }, (old) => {
        if (!old) return old;
        return old.filter((h) => h.id !== id);
      });

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (!ctx?.previous) return;
      for (const [key, data] of ctx.previous) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: baseKey });
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