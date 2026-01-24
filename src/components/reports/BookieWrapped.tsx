import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, Download, QrCode, Clock } from "lucide-react";

interface BookieWrappedProps {
  month: string;
  year: number;
  totalWords: number;
  favoriteBook: {
    title: string;
    author: string;
    timeSpent: string;
  };
  dominantColor: string;
  totalBooks: number;
  totalPages: number;
  streak: number;
}

export const BookieWrapped = ({
  month,
  year,
  totalWords,
  favoriteBook,
  dominantColor,
  totalBooks,
  totalPages,
  streak,
}: BookieWrappedProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const colorMap: Record<string, { from: string; to: string; name: string }> = {
    pink: { from: "from-warm-pink", to: "to-coral", name: "Hồng ấm áp" },
    blue: { from: "from-sky", to: "to-lavender", name: "Xanh dương mơ màng" },
    green: { from: "from-sage", to: "to-soft-sage", name: "Xanh lá thanh bình" },
    orange: { from: "from-coral", to: "to-peach", name: "Cam rực rỡ" },
  };

  const color = colorMap[dominantColor] || colorMap.pink;

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warm-pink to-lavender flex items-center justify-center shadow-lg">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Bookie Wrapped</h2>
            <p className="text-sm text-muted-foreground">
              Tổng kết {month} {year}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
        {/* Card Preview */}
        <motion.div
          className="relative w-80 h-[480px] cursor-pointer perspective-1000 group"
          onClick={() => setIsFlipped(!isFlipped)}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="relative w-full h-full duration-700"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${color.from} ${color.to} rounded-[2rem] p-8 shadow-2xl backface-hidden ring-4 ring-white/20`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="h-full flex flex-col justify-between text-white relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                    <span className="text-xl animate-bounce-slow">🐝</span>
                    <span className="font-bold text-sm tracking-wide">Bookie Bee</span>
                  </div>

                  <h3 className="text-3xl font-black mb-1 tracking-tight mt-4">
                    {month} Wrapped
                  </h3>
                  <p className="text-sm font-medium opacity-90 tracking-widest uppercase">Năm {year}</p>
                </div>

                <div className="space-y-6 relative z-10 my-4 flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <p className="text-sm font-medium opacity-80 mb-1 uppercase tracking-wider">Tổng nạp vào não bộ</p>
                    <p className="text-5xl font-black tracking-tighter drop-shadow-sm">{totalWords.toLocaleString()}</p>
                    <p className="text-lg font-medium opacity-90 mt-1">từ vựng</p>
                  </div>

                  <div className="flex justify-between gap-2 px-2">
                    <div className="text-center flex-1 bg-white/10 rounded-2xl p-2 backdrop-blur-sm">
                      <p className="text-2xl font-bold">{totalBooks}</p>
                      <p className="text-[10px] font-bold uppercase opacity-80">sách</p>
                    </div>
                    <div className="text-center flex-1 bg-white/10 rounded-2xl p-2 backdrop-blur-sm">
                      <p className="text-2xl font-bold">{totalPages}</p>
                      <p className="text-[10px] font-bold uppercase opacity-80">trang</p>
                    </div>
                    <div className="text-center flex-1 bg-white/10 rounded-2xl p-2 backdrop-blur-sm">
                      <p className="text-2xl font-bold">{streak}</p>
                      <p className="text-[10px] font-bold uppercase opacity-80">ngày streak</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-xs font-medium opacity-70 text-center animate-pulse">
                    Chạm để lật xem bí mật →
                  </p>
                </div>
              </div>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl ring-1 ring-black/5`}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <div className="h-full flex flex-col justify-between relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${color.from} ${color.to}`} />

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 text-center mt-2">
                    Highlights của tháng
                  </h4>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Cuốn sách yêu thích ❤️</p>
                    <div className="p-4 bg-muted/30 rounded-2xl border border-muted-foreground/10">
                      <p className="font-bold text-lg text-foreground line-clamp-2 leading-tight">{favoriteBook.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{favoriteBook.author}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-warm-pink bg-warm-pink/10 w-fit px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" />
                        {favoriteBook.timeSpent} nghiền ngẫm
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Sắc thái đọc 🎨</p>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color.from} ${color.to} shadow-md ring-2 ring-white dark:ring-zinc-800`} />
                      <div>
                        <p className="text-sm font-bold text-foreground">{color.name}</p>
                        <p className="text-xs text-muted-foreground">Màu sắc chủ đạo tháng này</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-3 mt-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm border">
                    <QrCode className="w-12 h-12 text-foreground" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Scan để tải Bookie Bee</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Actions - Right Side */}
        <div className="flex-1 space-y-6 max-w-sm">
          <div className="text-center lg:text-left space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              Chia sẻ thành tích! 🎉
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Tạo thẻ tổng kết nhỏ xinh về tháng đọc sách vừa qua của bạn. Hãy khoe với bạn bè để cùng nhau đọc sách nhé!
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-bold shadow-lg shadow-foreground/20 transition-all hover:scale-[1.02]">
              <Share2 className="w-5 h-5" />
              Chia sẻ lên Story
            </Button>
            <Button variant="outline" className="w-full h-12 gap-2 rounded-xl font-bold border-2 hover:bg-muted/50 transition-all hover:scale-[1.02]">
              <Download className="w-5 h-5" />
              Lưu ảnh về máy
            </Button>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex gap-3 text-blue-700 dark:text-blue-300">
            <div className="mt-1">💡</div>
            <p className="text-sm font-medium">
              Mẹo: Chạm vào thẻ để lật xem mặt sau với thông tin chi tiết về sách yêu thích của bạn!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
