import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export const XPTooltip = () => {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        <Info className="w-4 h-4" />
                        <span className="sr-only">Cách tính điểm XP</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent className="p-4 max-w-xs bg-white/95 dark:bg-zinc-800 backdrop-blur-md shadow-xl border-none rounded-2xl">
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm border-b pb-2 mb-2">🐝 Cách kiếm Mật (XP)</h4>
                        <ul className="space-y-2 text-xs">
                            <li className="flex justify-between">
                                <span>📖 Đọc 1 trang sách</span>
                                <span className="font-bold text-amber-500">+1 XP</span>
                            </li>
                            <li className="flex justify-between">
                                <span>🔥 Duy trì Streak 3 ngày</span>
                                <span className="font-bold text-amber-500">+15 XP</span>
                            </li>
                            <li className="flex justify-between">
                                <span>💬 Hoàn thành 1 sách</span>
                                <span className="font-bold text-amber-500">+50 XP</span>
                            </li>
                            <li className="flex justify-between">
                                <span>🏆 Hoàn thành NV ngày</span>
                                <span className="font-bold text-amber-500">+20 XP</span>
                            </li>
                        </ul>
                        <p className="text-[10px] text-muted-foreground italic mt-2 text-center">
                            "Mỗi chú ong chăm chỉ đều xứng đáng có mật ngọt!"
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
