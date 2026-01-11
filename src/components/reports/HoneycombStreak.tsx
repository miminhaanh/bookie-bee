import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HoneycombStreakProps {
  streakDays: boolean[];
  currentStreak: number;
  freezesAvailable: number;
}

const HexCell = ({ 
  filled, 
  index, 
  onFill 
}: { 
  filled: boolean; 
  index: number;
  onFill?: () => void;
}) => {
  const [showBee, setShowBee] = useState(false);
  const [justFilled, setJustFilled] = useState(false);

  const handleClick = () => {
    if (!filled && onFill) {
      setShowBee(true);
      setJustFilled(true);
      setTimeout(() => {
        onFill();
        setShowBee(false);
      }, 1500);
    }
  };

  return (
    <div className="relative" style={{ width: 52, height: 60, margin: '0 2px' }}>
      <AnimatePresence>
        {showBee && (
          <motion.div
            className="absolute z-20 text-2xl"
            initial={{ x: -60, y: -40, opacity: 0, rotate: -20 }}
            animate={{ 
              x: [null, 0, 0, 60],
              y: [null, -10, 0, -30],
              opacity: [0, 1, 1, 0],
              rotate: [null, 0, 0, 20]
            }}
            transition={{ duration: 1.5, times: [0, 0.3, 0.7, 1] }}
          >
            🐝
          </motion.div>
        )}
      </AnimatePresence>
      
      <svg
        viewBox="0 0 52 60"
        className="w-full h-full cursor-pointer transition-transform hover:scale-105"
        onClick={handleClick}
      >
        <defs>
          <linearGradient id={`honey-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD54F" />
            <stop offset="50%" stopColor="#FFAB00" />
            <stop offset="100%" stopColor="#FF8F00" />
          </linearGradient>
          <linearGradient id={`empty-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0E0E0" />
            <stop offset="100%" stopColor="#BDBDBD" />
          </linearGradient>
          <filter id={`glow-${index}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <motion.path
          d="M26 2 L48 16 L48 44 L26 58 L4 44 L4 16 Z"
          fill={filled || justFilled ? `url(#honey-gradient-${index})` : `url(#empty-gradient-${index})`}
          stroke={filled || justFilled ? "#FF8F00" : "#9E9E9E"}
          strokeWidth="2"
          filter={filled || justFilled ? `url(#glow-${index})` : undefined}
          initial={false}
          animate={{
            scale: justFilled ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.5 }}
        />
        
        {(filled || justFilled) && (
          <motion.ellipse
            cx="26"
            cy="25"
            rx="12"
            ry="8"
            fill="rgba(255, 255, 255, 0.3)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />
        )}
      </svg>
      
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground">
        {index + 1}
      </div>
    </div>
  );
};

export const HoneycombStreak = ({ streakDays, currentStreak, freezesAvailable }: HoneycombStreakProps) => {
  const rows = [
    streakDays.slice(0, 7),
    streakDays.slice(7, 14),
    streakDays.slice(14, 21),
    streakDays.slice(21, 28),
    streakDays.slice(28, 31),
  ];

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🍯</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Tổ Ong Chuyên Cần</h2>
            <p className="text-sm text-muted-foreground">
              Chuỗi hiện tại: <span className="font-bold text-amber-500">{currentStreak} ngày</span>
            </p>
          </div>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2 bg-sky/20 border-sky hover:bg-sky/40">
          <Snowflake className="w-4 h-4 text-sky" />
          <span className="text-sky font-bold">{freezesAvailable}</span>
          <span className="text-muted-foreground">Sữa ong chúa</span>
        </Button>
      </div>

      <div className="flex flex-col items-center gap-0">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex"
            style={{ marginLeft: rowIndex % 2 === 1 ? 27 : 0 }}
          >
            {row.map((filled, cellIndex) => (
              <HexCell
                key={rowIndex * 7 + cellIndex}
                filled={filled}
                index={rowIndex * 7 + cellIndex}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-b from-amber-400 to-orange-500" />
          <span className="text-muted-foreground">Đã đọc đủ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-b from-gray-300 to-gray-400" />
          <span className="text-muted-foreground">Chưa đọc</span>
        </div>
      </div>
    </div>
  );
};
