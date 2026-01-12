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

  // Hình dáng lục giác chuẩn
  const hexPath = "M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z";
  
  const isActive = filled || justFilled;

  return (
    <div className="relative" style={{ width: 54, height: 62, margin: '-6px 2px' }}>
      <AnimatePresence>
        {showBee && (
          <motion.div
            className="absolute z-20 text-3xl"
            initial={{ x: -60, y: -40, opacity: 0, rotate: -20, scale: 0.5 }}
            animate={{ 
              x: [null, 10, 20, 80],
              y: [null, 0, 10, -40],
              opacity: [0, 1, 1, 0],
              rotate: [null, 10, -10, 20],
              scale: [0.5, 1.2, 1.2, 0.5]
            }}
            transition={{ duration: 1.5, times: [0, 0.3, 0.7, 1] }}
          >
            🐝
          </motion.div>
        )}
      </AnimatePresence>
      
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full cursor-pointer transition-transform hover:scale-110 duration-300"
        onClick={handleClick}
        style={{ overflow: 'visible', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.05))' }}
      >
        <defs>
          {/* Gradient cho Lõi Mật: Cam vàng ấm áp */}
          <linearGradient id={`honey-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" /> {/* Vàng nắng */}
            <stop offset="100%" stopColor="#F59E0B" /> {/* Cam đậm */}
          </linearGradient>

          {/* Gradient cho Vỏ Ngoài: Kem trắng ngà */}
          <linearGradient id={`shell-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" /> 
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>

           {/* Gradient cho Ô Trống: Xám nhạt */}
           <linearGradient id={`empty-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F3F4F6" />
            <stop offset="100%" stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
        
        {/* --- LAYER 1: VỎ NGOÀI (OUTER SHELL) --- */}
        <motion.path
          d={hexPath}
          // Nếu active: Màu kem. Nếu không: Màu xám.
          fill={isActive ? `url(#shell-gradient-${index})` : `url(#empty-gradient-${index})`}
          // Viền vàng khi active, xám đậm khi chưa
          stroke={isActive ? "#FCD34D" : "#D1D5DB"} 
          strokeWidth="6"
          strokeLinejoin="round"
          initial={false}
        />

        {/* --- LAYER 2: VIỀN TRONG (INNER RIM - WHITE) --- 
            Tạo hiệu ứng cái bát sâu xuống */}
        {isActive && (
           <path
             d={hexPath}
             fill="none"
             stroke="#FFFFFF"
             strokeWidth="3"
             strokeOpacity="0.8"
             transform="scale(0.82)"
             style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
           />
        )}

        {/* --- LAYER 3: LÕI MẬT (HONEY CORE) --- */}
        {isActive && (
          <motion.path
            d={hexPath}
            fill={`url(#honey-gradient-${index})`}
            // Không cần viền hoặc viền rất mỏng cùng màu
            stroke="none"
            transform="scale(0.55)"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 0.55, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          />
        )}

        {/* --- LAYER 4: HIGHLIGHTS (BÓNG KÍNH HOẠT HÌNH) --- */}
        
        {/* Highlight 1: Đường cong trắng trên đỉnh vỏ ngoài */}
        {isActive && (
            <motion.path
                d="M 30 8 Q 50 2 70 8" // Đường cong vòm trên
                fill="none"
                stroke="white"
                strokeWidth="5" // Dày hơn để giống hoạt hình
                strokeLinecap="round"
                opacity="0.9"
            />
        )}
        
        {/* Highlight 2: Hình bầu dục nghiêng trên lõi mật */}
        {isActive && (
             <motion.ellipse
             cx="38" // Lệch trái một chút so với tâm (50)
             cy="38" // Lệch lên trên một chút so với tâm (50)
             rx="8"
             ry="4"
             fill="white"
             opacity="0.8"
             transform="rotate(-45 38 38)" // Xoay nghiêng 45 độ quanh tâm chính nó
             initial={{ opacity: 0 }}
             animate={{ opacity: 0.8 }}
             transition={{ delay: 0.2 }}
           />
        )}
      </svg>
      
      {/* Số thứ tự ngày (Chỉ hiện khi chưa fill) */}
      {!filled && !justFilled && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40 select-none pointer-events-none">
            {index + 1}
        </div>
      )}
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
    <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <span className="text-3xl drop-shadow-sm filter">🍯</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Tổ Ong Chuyên Cần</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Chuỗi hiện tại</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                    {currentStreak} ngày
                </span>
            </div>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" className="gap-2 bg-blue-50/50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-blue-100/50">
          <Snowflake className="w-4 h-4" />
          <span className="font-bold">{freezesAvailable}</span>
        </Button>
      </div>

      <div className="flex flex-col items-center pl-3">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex"
            style={{ 
                // Điều chỉnh offset cho hàng chẵn/lẻ để khớp tổ ong
                // Width = 54 -> Half width = 27. Margin left ~27px để so le.
                marginLeft: rowIndex % 2 === 1 ? 27 : 0, 
                marginBottom: -4 // Âm margin để các hàng khít vào nhau theo chiều dọc
            }} 
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

      <div className="mt-8 flex items-center justify-center gap-8 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" />
          <span>Đã lấp đầy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
          <span>Chưa đến</span>
        </div>
      </div>
    </div>
  );
};