import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BookieAvatarProps {
    level: number;
    className?: string;
    size?: "sm" | "md" | "lg";
    showGreeting?: boolean;
    isSleeping?: boolean;
}

const greetings = {
    compliment: [
        "Bạn thật chăm chỉ! 🐝",
        "Tuyệt vời quá! 🍯",
        "Tiếp tục phát huy nhé!",
        "Ong rất tự hào về bạn!",
        "Mật ngọt đang chờ bạn!",
    ],
    reminder: [
        "Đừng quên đọc sách nhé! 📖",
        "Một trang nữa thôi nào!",
        "Tổ ong cần thêm mật! 🍯",
        "Ghé thăm sách một chút đi!",
    ],
};

export const BookieAvatar = ({ level, className, size = "md", showGreeting = true, isSleeping = false }: BookieAvatarProps) => {
    const [greeting, setGreeting] = useState("");
    const [isHovered, setIsHovered] = useState(false);

    // Determine Bee Stage
    const getBeeStage = () => {
        if (level === 1) return { icon: "🐝", title: "Ong Non", color: "text-amber-300" }; // Pale Yellow
        if (level === 2) return { icon: "🦩", title: "Hồng Hạc", color: "text-orange-400" }; // Peach/Orange
        if (level === 3) return { icon: "🕊️", title: "Bồ Câu Hòa Bình", color: "text-amber-600" }; // Amber/Diligent
        return { icon: "🦢", title: "Thiên Nga Trắng", color: "text-red-500" }; // Royal
    };

    const stage = getBeeStage();

    const sizeClasses = {
        sm: "text-2xl",
        md: "text-5xl",
        lg: "text-7xl",
    };

    useEffect(() => {
        if (showGreeting && !isSleeping) {
            // Randomly pick a greeting type, biased towards compliment if level is high? 
            // For now simple random
            const type = Math.random() > 0.4 ? "compliment" : "reminder";
            const list = greetings[type];
            setGreeting(list[Math.floor(Math.random() * list.length)]);
        }
    }, [showGreeting, level, isSleeping]);

    return (
        <div
            className={cn("relative flex flex-col items-center justify-center", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Speech Bubble (Hide if sleeping) */}
            {showGreeting && !isSleeping && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-zinc-800 px-4 py-2 rounded-2xl shadow-lg border border-border z-10"
                >
                    <p className="text-sm font-medium text-foreground">{greeting}</p>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-800 rotate-45 border-b border-r border-border" />
                </motion.div>
            )}

            {/* Sleeping Zzz Animation */}
            {isSleeping && (
                <motion.div
                    className="absolute -top-8 right-0 text-xl font-bold text-sky-400 z-20"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1.5], x: [0, 15, 30], y: [0, -20, -40] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    Zzz...
                </motion.div>
            )}

            {/* Bee Avatar */}
            <motion.div
                animate={{
                    y: isSleeping ? [0, 3, 0] : [0, -10, 0], // Gentle breathing if sleeping, bobbing if awake
                    rotate: isSleeping ? 15 : (isHovered ? [0, -5, 5, -5, 5, 0] : 0), // Tilted if sleeping
                    scale: isSleeping ? 0.95 : (isHovered ? 1.15 : 1),
                    filter: isSleeping ? "grayscale(0.4)" : "none"
                }}
                transition={{
                    y: {
                        repeat: Infinity,
                        duration: isSleeping ? 3 : 2,
                        ease: "easeInOut"
                    },
                    rotate: {
                        duration: 0.4,
                        repeat: isHovered && !isSleeping ? Infinity : 0,
                        repeatType: "reverse"
                    },
                    scale: { duration: 0.3 }
                }}
                className={cn("cursor-pointer select-none filter drop-shadow-xl", sizeClasses[size], stage.color)}
            >
                {stage.icon}
            </motion.div>

            {/* Level Badge (Optional, small) */}
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                Lv.{level} {stage.title}
            </div>
        </div>
    );
};
