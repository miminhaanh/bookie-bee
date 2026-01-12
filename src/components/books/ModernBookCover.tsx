import type { ReactNode } from "react";

const radiusMap = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
};

const sizeMap = {
  sm: { width: "140px", height: "200px", spineTranslation: "112px" },
  md: { width: "180px", height: "260px", spineTranslation: "152px" },
  lg: { width: "240px", height: "340px", spineTranslation: "212px" },
};

const paddingMap = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const colorMap = {
  slate: { from: "from-slate-900", to: "to-slate-700" },
  gray: { from: "from-gray-900", to: "to-gray-700" },
  zinc: { from: "from-zinc-900", to: "to-zinc-700" },
  neutral: { from: "from-neutral-900", to: "to-neutral-700" },
  stone: { from: "from-stone-900", to: "to-stone-700" },
  red: { from: "from-red-900", to: "to-red-700" },
  orange: { from: "from-orange-900", to: "to-orange-700" },
  amber: { from: "from-amber-900", to: "to-amber-700" },
  yellow: { from: "from-yellow-900", to: "to-yellow-700" },
  lime: { from: "from-lime-900", to: "to-lime-700" },
  green: { from: "from-green-900", to: "to-green-700" },
  emerald: { from: "from-emerald-900", to: "to-emerald-700" },
  teal: { from: "from-teal-900", to: "to-teal-700" },
  cyan: { from: "from-cyan-900", to: "to-cyan-700" },
  sky: { from: "from-sky-900", to: "to-sky-700" },
  blue: { from: "from-blue-900", to: "to-blue-700" },
  indigo: { from: "from-indigo-900", to: "to-indigo-700" },
  violet: { from: "from-violet-900", to: "to-violet-700" },
  purple: { from: "from-purple-900", to: "to-purple-700" },
  fuchsia: { from: "from-fuchsia-900", to: "to-fuchsia-700" },
  pink: { from: "from-pink-900", to: "to-pink-700" },
  rose: { from: "from-rose-900", to: "to-rose-700" },
};

interface BookProps {
  radius?: "sm" | "md" | "lg";
  size?: "sm" | "md" | "lg";
  color?: keyof typeof colorMap;
  coverImage?: string | null;
  isStatic?: boolean;
  className?: string;
  children?: ReactNode;
}

export const ModernBookCover = ({
  radius = "sm",
  size = "md",
  color = "zinc",
  coverImage,
  isStatic = false,
  className = "",
  children,
}: BookProps) => {
  const gradient = colorMap[color] || colorMap.zinc;
  const currentSize = sizeMap[size];

  return (
    // 👇 Đã xoá các biến CSS shadowColor không còn dùng
    <div
      className={`group relative z-10 [perspective:800px] transition-all ${className}`}
      style={{ width: currentSize.width, height: currentSize.height }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transition: "transform 1000ms ease",
        }}
        className={`relative [transform-style:preserve-3d] ${
          isStatic
            ? "[transform:rotateY(-30deg)]"
            : "[transform:rotateY(0deg)] group-hover:[transform:rotateY(-30deg)]"
        } ${radiusMap[radius]}`}
      >
        {/* === FRONT SIDE (Mặt trước) === */}
        <div
          className={`absolute inset-y-0 overflow-hidden size-full left-0 text-white flex flex-col justify-end ${paddingMap[size]} bg-gradient-to-tr ${gradient.from} ${gradient.to} ${radiusMap[radius]}`}
          style={{
            transform: "translateZ(25px)",
          }}
        >
          {coverImage && (
            <div className="absolute inset-0 z-0">
              <img
                src={coverImage}
                alt="Cover"
                className={`w-full h-full object-cover ${radiusMap[radius]}`}
              />
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent"></div>
            </div>
          )}

          {/* HINGE EFFECT (Hiệu ứng rãnh gáy sách) */}
          <div
            className="absolute left-0 top-0 h-full z-20 pointer-events-none"
            style={{
              width: "10px",
              background: `linear-gradient(to right, 
                rgba(255, 255, 255, 0) 0%, /* 1. Mép ngoài trong suốt */
                rgba(0, 0, 0, 0.05) 5%, /* 2. Hơi tối nhẹ bắt đầu vào rãnh */
                rgba(0, 0, 0, 0.35) 12%, /* 3. Dốc xuống (Bóng đổ) */
                rgba(0, 0, 0, 0.5) 20%, /* 4. ĐÁY RÃNH (Tối nhất - Deepest point) */
                rgba(255, 255, 255, 0.78) 26%,
                rgba(255, 255, 255, 0.78) 55%,
                rgba(116, 116, 116, 0.25) 55%, /* 6. Bóng đổ nhẹ sau gờ sáng */
                rgba(102, 102, 102, 0.33) 60%, /* 3. Dốc xuống (Bóng đổ) */
                rgba(96, 96, 96, 0.16) 68%, /* 6. Bóng đổ nhẹ sau gờ sáng */
                rgba(0, 0, 0, 0.02) 70%, /* 7. Mờ dần */
                rgba(0, 0, 0, 0) 100% /* 8. Hòa vào bìa */
              )`,
              mixBlendMode: "multiply",
            }}
          />


          {/* LỚP NHIỄU HẠT (Noise) */}
          <div
            className="absolute inset-0 z-10 opacity-10 pointer-events-none"
            style={{
              filter: "contrast(120%) brightness(100%)",
              backgroundImage:
                "url('https://grainy-gradients.vercel.app/noise.svg')",
            }}
          ></div>

          <div className="relative z-20 w-full">{children}</div>
        </div>

        {/* Spine (Gáy sách) */}
        <div
          className="absolute left-0 bg-white"
          style={{
            top: "3px",
            bottom: "3px",
            width: "48px",
            transform: `translateX(${currentSize.spineTranslation}) rotateY(90deg)`,
            background:
              "linear-gradient(90deg, rgba(255,255,255,1) 50%, rgba(249,249,249,1) 50%)",
          }}
        />

        {/* === BACK SIDE (Mặt sau) === */}
        <div
          className={`absolute inset-y-0 overflow-hidden size-full left-0 bg-gradient-to-tr ${gradient.from} ${gradient.to} ${radiusMap[radius]}`}
          style={{
            transform: "translateZ(-25px)",
            // 👇 ĐÃ XOÁ: boxShadow: "-10px 0 50px 10px var(--shadowColor)",
          }}
        >
          {coverImage && (
            <div className="absolute inset-0 z-0">
              <img
                src={coverImage}
                alt="Back Cover"
                className={`w-full h-full object-cover scale-x-[-1] ${radiusMap[radius]}`}
              />
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const BookHeader = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`flex gap-2 flex-wrap ${className}`}>{children}</div>;
export const BookTitle = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <h1
    className={`font-bold select-none mt-2 mb-1 text-balance leading-tight ${className}`}
  >
    {children}
  </h1>
);
export const BookDescription = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p
    className={`opacity-80 select-none text-[10px] uppercase tracking-wider ${className}`}
  >
    {children}
  </p>
);

export default ModernBookCover;