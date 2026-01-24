import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BookieWrappedProps {
  month: string;
  year: number;
  totalWords: number;
  favoriteBook: { title: string; author: string; timeSpent: string };
  dominantColor: "pink" | "blue" | "green" | "orange";
  totalBooks: number;
  totalPages: number;
  streak: number;
}

const colorThemes = {
  pink: {
    bg: "from-pink-400 via-rose-500 to-pink-600",
    accent: "bg-pink-200",
    text: "text-pink-100",
  },
  blue: {
    bg: "from-blue-400 via-indigo-500 to-blue-600",
    accent: "bg-blue-200",
    text: "text-blue-100",
  },
  green: {
    bg: "from-emerald-400 via-green-500 to-teal-600",
    accent: "bg-emerald-200",
    text: "text-emerald-100",
  },
  orange: {
    bg: "from-amber-400 via-orange-500 to-red-500",
    accent: "bg-amber-200",
    text: "text-amber-100",
  },
};

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
  const theme = colorThemes[dominantColor] || colorThemes.pink;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl",
        `bg-gradient-to-br ${theme.bg}`
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 text-6xl">📖</div>
        <div className="absolute bottom-4 right-4 text-6xl">🐝</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl opacity-20">
          ✨
        </div>
      </div>

      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-white text-2xl font-bold mb-1">Bookie Wrapped</h2>
            <p className={cn("text-sm font-medium", theme.text)}>
              {month} {year}
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center"
          >
            <p className="text-3xl font-bold text-white">{totalBooks}</p>
            <p className={cn("text-xs font-medium", theme.text)}>Cuốn sách</p>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center"
          >
            <p className="text-3xl font-bold text-white">{totalPages}</p>
            <p className={cn("text-xs font-medium", theme.text)}>Trang đọc</p>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center"
          >
            <p className="text-3xl font-bold text-white">{totalWords.toLocaleString()}</p>
            <p className={cn("text-xs font-medium", theme.text)}>Từ highlight</p>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center"
          >
            <p className="text-3xl font-bold text-white">{streak}</p>
            <p className={cn("text-xs font-medium", theme.text)}>Ngày streak</p>
          </motion.div>
        </div>

        {/* Favorite Book */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white/20 backdrop-blur-sm rounded-2xl p-4"
        >
          <p className={cn("text-xs font-medium mb-2", theme.text)}>
            ⭐ Sách yêu thích
          </p>
          <h3 className="text-white font-bold text-lg leading-tight mb-1">
            {favoriteBook.title}
          </h3>
          {favoriteBook.author && (
            <p className={cn("text-sm", theme.text)}>{favoriteBook.author}</p>
          )}
          <p className={cn("text-xs mt-2", theme.text)}>
            Đã đọc: {favoriteBook.timeSpent}
          </p>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pt-4"
        >
          <p className="text-white/80 text-xs">🐝 Bookie Bee • Hành trình đọc sách của bạn</p>
        </motion.div>
      </div>
    </motion.div>
  );
};
