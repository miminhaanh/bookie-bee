import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, Download, QrCode } from "lucide-react";

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

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Card Preview */}
        <motion.div
          className="relative w-72 h-96 cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="relative w-full h-full"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${color.from} ${color.to} rounded-3xl p-6 shadow-xl backface-hidden`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="h-full flex flex-col justify-between text-primary-foreground">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl">🐝</span>
                    <span className="font-bold text-lg">Bookie Bee</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">
                    {month} Wrapped
                  </h3>
                  <p className="text-sm opacity-80">Năm {year}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-4xl font-bold">{totalWords.toLocaleString()}</p>
                    <p className="text-sm opacity-80">từ đã nạp vào não bộ</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{totalBooks}</p>
                      <p className="text-xs opacity-80">sách</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{totalPages}</p>
                      <p className="text-xs opacity-80">trang</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{streak}</p>
                      <p className="text-xs opacity-80">ngày streak</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs opacity-60 text-center">
                  Chạm để lật xem thêm →
                </p>
              </div>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 bg-gradient-to-br from-card to-muted rounded-3xl p-6 shadow-xl`}
              style={{ 
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-4">
                    📖 Cuốn sách yêu thích
                  </h4>
                  <div className="p-4 bg-gradient-to-br from-soft-pink/50 to-peach/50 rounded-2xl">
                    <p className="font-bold text-foreground">{favoriteBook.title}</p>
                    <p className="text-sm text-muted-foreground">{favoriteBook.author}</p>
                    <p className="text-xs text-warm-pink mt-2">
                      Đọc lâu nhất: {favoriteBook.timeSpent}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-foreground mb-2">
                    🎨 Màu sắc của tháng
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color.from} ${color.to} shadow-lg`} />
                    <p className="text-sm text-muted-foreground">{color.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Scan để tải app</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Actions */}
        <div className="flex-1 space-y-4">
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Chia sẻ thành tích của bạn! 🎉
            </h3>
            <p className="text-sm text-muted-foreground">
              Xuất thẻ tổng kết và khoe với bạn bè trên mạng xã hội
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 gap-2 bg-gradient-to-r from-warm-pink to-coral hover:opacity-90">
              <Share2 className="w-4 h-4" />
              Chia sẻ
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Tải ảnh
            </Button>
          </div>

          <div className="p-4 bg-muted/50 rounded-2xl">
            <p className="text-sm text-muted-foreground text-center">
              💡 Mẹo: Chạm vào thẻ để xem mặt sau với thông tin chi tiết hơn!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
