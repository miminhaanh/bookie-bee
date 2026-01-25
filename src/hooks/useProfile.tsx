import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  gender: string | null;
  bio: string | null;
  language?: string | null;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
  default_reader_theme: string;
  default_font_family: string;
  default_font_size: number;
  created_at: string;
  updated_at: string;
  onboarding_completed?: boolean;
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null;
      
      // ✅ Use .maybeSingle() to avoid throwing errors
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Log warning but don't throw - allows React Query to work properly
      if (error) {
        console.warn("Profile fetch warning:", error.message);
        return null;
      }

      let profile = (data as Profile | null) ?? null;

      // ✅ Fallback: create profile if not exists (trigger might have failed)
      if (!profile) {
        console.log("No profile found, creating fallback profile for user:", user.id);
        const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
        
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: displayName,
            current_streak: 0,
            longest_streak: 0,
            default_reader_theme: "light",
            default_font_family: "sans",
            default_font_size: 18,
            // onboarding_completed: false, // Uncomment after adding column to DB
          })
          .select()
          .maybeSingle();

        if (insertError) {
          console.error("Failed to create fallback profile:", insertError);
          return null;
        }
        
        profile = (newProfile as Profile | null) ?? null;
      }

      return profile;
    },
    enabled: !!user?.id,
    retry: 1, // Only retry once to avoid infinite loops
    staleTime: 30000, // Cache for 30 seconds
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error("No user");
      
      // Use upsert to handle both create and update cases
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, ...updates },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
};