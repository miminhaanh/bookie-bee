import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useClaimMission = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (missionId: string) => {
            // Call the RPC function we created in migration
            // @ts-ignore - RPC types not yet generated
            const { error } = await supabase.rpc("claim_mission_reward", {
                p_mission_id: missionId,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate Reports Data to refresh XP and Mission Status
            queryClient.invalidateQueries({ queryKey: ["reports-data"] });

            toast({
                title: "Nhận mật thành công! 🍯",
                description: "XP đã được cộng vào kho mật của bạn.",
                variant: "default",
                className: "bg-amber-100 border-amber-200 text-amber-900",
            });
        },
        onError: (err) => {
            console.error(err);
            toast({
                title: "Có lỗi xảy ra",
                description: "Không thể nhận thưởng lúc này.",
                variant: "destructive",
            });
        },
    });
};
