import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

export const useReadingSession = (bookId: string) => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start a new session
  const startSession = useCallback(async () => {
    if (!user?.id || !bookId || sessionIdRef.current) return;

    try {
      const { data, error } = await supabase
        .from("reading_sessions")
        .insert([{
          user_id: user.id,
          book_id: bookId,
          started_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      sessionIdRef.current = data.id;
      startTimeRef.current = new Date();
    } catch (error) {
      console.error("Failed to start reading session:", error);
    }
  }, [user?.id, bookId]);

  // End the current session
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !startTimeRef.current || !user?.id) return;

    const endTime = new Date();
    const durationSeconds = Math.round(
      (endTime.getTime() - startTimeRef.current.getTime()) / 1000
    );

    // Only save if read for at least 10 seconds
    if (durationSeconds < 10) {
      // Delete the session if too short
      await supabase
        .from("reading_sessions")
        .delete()
        .eq("id", sessionIdRef.current);
    } else {
      try {
        // Update session with end time
        await supabase
          .from("reading_sessions")
          .update({
            ended_at: endTime.toISOString(),
            duration_seconds: durationSeconds,
          })
          .eq("id", sessionIdRef.current);

        // Update or insert daily reading
        const today = format(new Date(), "yyyy-MM-dd");
        
        const { data: existingDaily } = await supabase
          .from("daily_reading")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .single();

        if (existingDaily) {
          await supabase
            .from("daily_reading")
            .update({
              total_seconds: existingDaily.total_seconds + durationSeconds,
              books_count: existingDaily.books_count + 1,
            })
            .eq("id", existingDaily.id);
        } else {
          await supabase
            .from("daily_reading")
            .insert([{
              user_id: user.id,
              date: today,
              total_seconds: durationSeconds,
              books_count: 1,
            }]);
        }

        // Update streak if read for at least 5 minutes
        if (durationSeconds >= 300) {
          await updateStreak();
        }
      } catch (error) {
        console.error("Failed to end reading session:", error);
      }
    }

    sessionIdRef.current = null;
    startTimeRef.current = null;
  }, [user?.id]);

  // Update user streak
  const updateStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_streak, longest_streak, last_read_date")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
      
      let newStreak = profile.current_streak || 0;
      
      if (profile.last_read_date === today) {
        // Already read today, no change
        return;
      } else if (profile.last_read_date === yesterday) {
        // Continue streak
        newStreak += 1;
      } else {
        // Streak broken, start new
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, profile.longest_streak || 0);

      await supabase
        .from("profiles")
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_read_date: today,
        })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Failed to update streak:", error);
    }
  }, [user?.id]);

  // Start session on mount
  useEffect(() => {
    if (bookId && user?.id) {
      startSession();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookId, user?.id, startSession]);

  // Periodic save every 60 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (sessionIdRef.current && startTimeRef.current && user?.id) {
        const durationSeconds = Math.round(
          (new Date().getTime() - startTimeRef.current.getTime()) / 1000
        );
        
        supabase
          .from("reading_sessions")
          .update({ duration_seconds: durationSeconds })
          .eq("id", sessionIdRef.current);
      }
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.id]);

  return {
    startSession,
    endSession,
  };
};