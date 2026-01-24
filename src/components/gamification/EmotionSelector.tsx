import { useState } from "react";
import { cn } from "@/lib/utils";
import { Smile, Frown, Meh, Brain, Zap } from "lucide-react";
import { motion } from "framer-motion";

export type MoodType = "happy" | "sad" | "neutral" | "thoughtful" | "excited";

interface EmotionSelectorProps {
    selectedMood?: MoodType | null; // Allow null
    onSelectMood: (mood: MoodType) => void;
    className?: string;
}

const moods: { type: MoodType; icon: any; label: string; color: string }[] = [
    { type: "happy", icon: Smile, label: "Vui vẻ", color: "text-yellow-500 hover:bg-yellow-50 border-yellow-200" },
    { type: "excited", icon: Zap, label: "Hào hứng", color: "text-orange-500 hover:bg-orange-50 border-orange-200" },
    { type: "thoughtful", icon: Brain, label: "Suy ngẫm", color: "text-blue-500 hover:bg-blue-50 border-blue-200" },
    { type: "neutral", icon: Meh, label: "Bình thường", color: "text-gray-500 hover:bg-gray-50 border-gray-200" },
    { type: "sad", icon: Frown, label: "Buồn", color: "text-indigo-500 hover:bg-indigo-50 border-indigo-200" },
];

export const EmotionSelector = ({ selectedMood, onSelectMood, className }: EmotionSelectorProps) => {
    return (
        <div className={cn("flex flex-wrap gap-3 justify-center", className)}>
            {moods.map((mood) => {
                const isSelected = selectedMood === mood.type;
                const Icon = mood.icon;

                return (
                    <motion.button
                        key={mood.type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectMood(mood.type)}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all w-20 h-24",
                            mood.color,
                            isSelected
                                ? "bg-white shadow-md ring-2 ring-offset-2 ring-primary border-transparent scale-105"
                                : "bg-white/50 border-transparent hover:border-current"
                        )}
                    >
                        <Icon className={cn("w-8 h-8 mb-2", isSelected ? "fill-current/20" : "")} strokeWidth={1.5} />
                        <span className="text-xs font-medium">{mood.label}</span>
                    </motion.button>
                );
            })}
        </div>
    );
};
