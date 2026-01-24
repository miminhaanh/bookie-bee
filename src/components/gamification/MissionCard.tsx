import { motion } from "framer-motion";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MissionProps {
    description: string;
    target: number;
    progress: number;
    xpReward: number;
    isCompleted: boolean;
    isClaimed?: boolean;
    type?: "daily" | "monthly" | "streak";
    onClaim?: () => void;
    onNavigate?: () => void;
}

export const MissionCard = ({ description, target, progress, xpReward, isCompleted, isClaimed = false, type = "daily", onClaim, onNavigate }: MissionProps) => {
    const percent = Math.min(100, Math.round((progress / target) * 100));

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={cn(
                "relative rounded-2xl border p-4 shadow-sm transition-all overflow-hidden bg-white/40 dark:bg-zinc-900/40 border-slate-100",
                isCompleted && !isClaimed && "bg-amber-50/50 border-amber-200 shadow-amber-100/50",
                isClaimed && "bg-slate-50 opacity-70 border-dashed"
            )}
        >
            <div className="flex items-start gap-4">
                {/* Icon Status */}
                <div className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all text-sm font-bold",
                    isClaimed
                        ? "bg-slate-200 border-slate-200 text-slate-400"
                        : isCompleted
                            ? "bg-amber-400 border-amber-400 text-white animate-pulse"
                            : "border-slate-200 text-slate-300"
                )}>
                    {isClaimed ? <CheckCircle2 className="w-5 h-5" /> : isCompleted ? "🎁" : <Circle className="w-5 h-5" />}
                </div>

                <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                        <h4 className={cn(
                            "font-bold text-sm text-slate-700 dark:text-slate-200",
                            isClaimed && "text-slate-500 line-through decoration-slate-300"
                        )}>
                            {description}
                        </h4>
                        {!isClaimed && (
                            <span className="text-xs font-bold text-amber-500">+{xpReward} XP</span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className={cn(
                                    "h-full rounded-full",
                                    isCompleted ? "bg-amber-400" : "bg-warm-pink"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ type: "spring" }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span>{progress}/{target} {type === "streak" ? "ngày" : type === "daily" ? "trang" : "lần"}</span>
                            <span>{percent}%</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1">
                        {isCompleted && !isClaimed ? (
                            <Button
                                size="sm"
                                className="w-full h-8 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl shadow-sm gap-2"
                                onClick={onClaim}
                            >
                                <Trophy className="w-3 h-3" /> Nhận mật
                            </Button>
                        ) : !isCompleted && onNavigate ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 rounded-xl text-xs border-slate-200 hover:bg-slate-50 text-slate-500"
                                onClick={onNavigate}
                            >
                                Thực hiện ngay
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
