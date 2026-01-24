import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookieAvatar } from "./BookieAvatar";
import { Sparkles } from "lucide-react";
import { getLevelTitle } from "@/lib/constants";

interface HoneyJarProps {
    currentXP: number;
    maxXP: number;
    level: number;
    streak: number;
    onCollectXP?: () => void;
    className?: string;
}

export const HoneyJarLevel = ({
    currentXP,
    maxXP,
    level,
    streak,
    onCollectXP,
    className,
}: HoneyJarProps) => {
    const [isCollecting, setIsCollecting] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);

    // Calculate fill percentage (clamp between 5% and 95% for visual aesthetics)
    const safeMaxXp = maxXP > 0 ? maxXP : 1;
    const fillPercentage = Math.min(Math.max((currentXP / safeMaxXp) * 100, 5), 95);
    const levelInfo = getLevelTitle(level);

    const handleCollect = () => {
        setIsCollecting(true);
        // Simulate API call / Animation delay
        setTimeout(() => {
            setIsCollecting(false);
            if (onCollectXP) onCollectXP();
        }, 1500);
    };

    // Determine honey color based on level
    const getHoneyColor = () => {
        if (level === 1) return "from-yellow-300 to-yellow-500"; // Ong Non: Vàng nhạt
        if (level === 2) return "from-orange-300 to-orange-500"; // Ong Thợ: Cam đào
        if (level === 3) return "from-amber-400 to-amber-600";   // Ong Chăm: Hổ phách
        return "from-red-400 to-amber-700";                     // Ong Chúa: Mật rừng đậm
    };

    const isSleeping = streak === 0;

    return (
        <div className={cn(
            "relative w-full max-w-[600px] mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 border border-white/60 rounded-[40px] shadow-xl p-8 overflow-visible flex flex-col items-center",
            className
        )}>
            {/* Decorative Honey Drops */}
            <div className="absolute top-10 left-10 w-4 h-4 bg-amber-400 rounded-full opacity-60 blur-[1px] animate-bounce duration-1000" />
            <div className="absolute bottom-20 right-10 w-6 h-6 bg-amber-300 rounded-full opacity-40 blur-[2px] animate-pulse" />

            {/* Header Info */}
            <div className="flex flex-col items-center gap-1 mb-8 z-20">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white/40">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1">
                        <span>{levelInfo.icon}</span>
                        <span>LV.{level} {levelInfo.title}</span>
                    </span>
                    <div className="w-1 h-3 bg-slate-200 rounded-full" />
                    <span className="text-xs font-bold text-amber-600">
                        {streak} ngày liên tục 🔥
                    </span>
                </div>
            </div>

            {/* Main Stage: Bee & Jar */}
            <div className="relative w-full flex justify-center items-center h-[300px]">

                {/* Flying Bee Orbiting */}
                <motion.div
                    className="absolute z-30 pointer-events-none"
                    animate={{
                        x: [-80, 80, -80],
                        y: [-20, 10, -30, -20],
                        rotate: [-5, 5, -5]
                    }}
                    transition={{
                        x: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    style={{ top: '10%' }}
                >
                    <BookieAvatar level={level} size="md" showGreeting={!isSleeping} isSleeping={isSleeping} />
                </motion.div>

                {/* The Honey Jar (SVG) */}
                <div className="relative w-48 h-60 z-10 group cursor-pointer">
                    {/* Glow Effect behind Jar */}
                    <div className="absolute inset-0 bg-amber-400/20 blur-[50px] rounded-full scale-110 group-hover:bg-amber-400/30 transition-all duration-700" />

                    {/* Drop of Honey Animation (When collecting) */}
                    <AnimatePresence>
                        {isCollecting && (
                            <motion.div
                                initial={{ y: -150, opacity: 0, scale: 0 }}
                                animate={{ y: 40, opacity: 1, scale: 1 }}
                                exit={{ y: 80, opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.8, ease: "anticipate" }}
                                className="absolute left-1/2 -top-10 -translate-x-1/2 z-40 text-4xl filter drop-shadow-md"
                            >
                                🍯
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <svg viewBox="0 0 200 250" className="w-full h-full drop-shadow-2xl overflow-visible">
                        <defs>
                            <linearGradient id="honeyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                {/* Dynamic gradient stops based on level logic could go here, or simple CSS classes */}
                                <stop offset="0%" className="text-amber-300" stopColor="currentColor" />
                                <stop offset="100%" className="text-amber-600" stopColor="currentColor" />
                            </linearGradient>

                            <filter id="liquidGlow">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
                                <feBlend in="SourceGraphic" in2="glow" mode="screen" />
                            </filter>

                            <mask id="honeyMask">
                                {/* Jar Shape Mask */}
                                <path d="M50,20 Q40,20 40,40 L30,220 Q30,240 50,240 H150 Q170,240 170,220 L160,40 Q160,20 150,20 Z" fill="white" />
                            </mask>
                        </defs>

                        {/* GLASS JAR BODY */}
                        <path d="M50,20 Q40,20 40,40 L30,220 Q30,240 50,240 H150 Q170,240 170,220 L160,40 Q160,20 150,20 Z"
                            fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="2"
                            className="backdrop-blur-sm"
                        />

                        {/* HONEY LIQUID */}
                        <g mask="url(#honeyMask)">
                            <motion.rect
                                x="0"
                                y="0" // Will correspond to fill level
                                width="200"
                                initial={{ height: 0, y: 250 }} // Start empty
                                animate={{
                                    height: `${fillPercentage * 2.5}`, // Scale % to approx 250px height
                                    y: 250 - (fillPercentage * 2.2) // Move up
                                }}
                                transition={{ type: "spring", bounce: 0.2, duration: 2 }}
                                className={cn("fill-current", getHoneyColor().replace('from-', 'text-').split(' ')[0])} // Fallback color logic handled by gradient usually
                            >
                            </motion.rect>

                            {/* Wave on top of liquid */}
                            <motion.path
                                d="M0,0 Q50,10 100,0 T200,0 V50 H0 Z"
                                fill="currentColor"
                                className={cn(getHoneyColor().replace('from-', 'text-').split(' ')[0], "opacity-80")}
                                animate={{
                                    y: 245 - (fillPercentage * 2.2),
                                    x: [-10, 0, -10]
                                }}
                                transition={{
                                    y: { type: "spring", bounce: 0.2, duration: 2 },
                                    x: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                                }}
                            />

                            {/* 2nd Wave Layer (offset) */}
                            <motion.path
                                d="M0,5 Q50,-5 100,5 T200,5 V50 H0 Z"
                                fill="currentColor"
                                className={cn(getHoneyColor().replace('to-', 'text-').split(' ')[1], "opacity-60")}
                                animate={{
                                    y: 245 - (fillPercentage * 2.2),
                                    x: [0, -10, 0]
                                }}
                                transition={{
                                    y: { type: "spring", bounce: 0.2, duration: 2.1 },
                                    x: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                                }}
                            />
                        </g>

                        {/* GLASS REFLECTIONS (Highlight) */}
                        <path d="M45,50 Q45,30 55,30 L145,30 Q155,30 155,50" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
                        <path d="M40,50 L35,200" fill="none" stroke="white" strokeWidth="4" strokeOpacity="0.1" strokeLinecap="round" />

                        {/* JAR LID/RIM */}
                        <rect x="35" y="10" width="130" height="20" rx="4" fill="#B45309" className="drop-shadow-sm" />
                        <rect x="32" y="30" width="136" height="8" rx="2" fill="#D97706" />
                    </svg>
                </div>
            </div>

            {/* Button Action */}
            <div className="mt-6 z-20">
                <Button
                    onClick={handleCollect}
                    disabled={isCollecting}
                    className={cn(
                        "rounded-full px-10 py-6 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95 text-white border-2 border-white/20",
                        "bg-gradient-to-r", getHoneyColor()
                    )}
                >
                    {isCollecting ? (
                        <span className="flex items-center gap-2">
                            <Sparkles className="animate-spin" /> Đang hứng mật...
                        </span>
                    ) : (
                        "Thu thập mật ngọt"
                    )}
                </Button>
            </div>

            {/* Footer XP Status */}
            <div className="mt-6 flex flex-col items-center gap-2 w-full max-w-[200px] z-20">
                <div className="flex justify-between w-full text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>{currentXP} XP</span>
                    <span>Mục tiêu {maxXP} XP</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className={cn("h-full bg-gradient-to-r", getHoneyColor())}
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentXP / maxXP) * 100}%` }}
                        transition={{ duration: 1 }}
                    />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                    Cần thêm <span className="text-amber-600 font-bold">{Math.max(0, safeMaxXp - currentXP)} XP</span> để thăng cấp!
                </p>
            </div>

            {/* Level Up Overlay (Optional, simple version) */}
            <AnimatePresence>
                {showLevelUp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center rounded-[40px]"
                    >
                        <h3 className="text-2xl font-bold text-amber-600 mb-2">Chúc mừng! 🎉</h3>
                        <p className="text-slate-600">Bạn đã thăng cấp thành {levelInfo.title}</p>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
