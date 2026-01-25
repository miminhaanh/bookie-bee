import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, subDays } from "date-fns";
import { vi } from "date-fns/locale";

export const useReadingStats = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["reading-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { weeklyData: [], totalMinutes: 0 };
      
      // Get daily reading for last 7 days
      const today = new Date();
      const weekAgo = subDays(today, 6);
      
      const { data: dailyData, error } = await supabase
        .from("daily_reading")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", format(weekAgo, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (error) throw error;

      // Create weekly data with all 7 days
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayData = dailyData?.find((d) => d.date === dateStr);
        
        weeklyData.push({
          day: format(date, "EEE", { locale: vi }),
          date: dateStr,
          minutes: dayData ? Math.round(dayData.total_seconds / 60) : 0,
        });
      }

      // Calculate total minutes
      const totalMinutes = dailyData?.reduce((sum, d) => sum + Math.round(d.total_seconds / 60), 0) || 0;

      return { weeklyData, totalMinutes };
    },
    enabled: !!user?.id,
  });

  return {
    weeklyData: data?.weeklyData || [],
    totalMinutes: data?.totalMinutes || 0,
    isLoading,
    error,
  };
};