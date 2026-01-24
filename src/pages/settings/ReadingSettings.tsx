import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Type, AlignJustify, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const ReadingSettings = () => {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState([18]);
  const [lineHeight, setLineHeight] = useState([1.5]);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("sepia");
  const [fontFamily, setFontFamily] = useState<"nunito" | "serif" | "mono">("nunito");

  useEffect(() => {
    const savedTheme = localStorage.getItem("readerTheme");
    const savedFontSize = localStorage.getItem("readerFontSize");
    const savedLineHeight = localStorage.getItem("readerLineHeight");
    const savedFontFamily = localStorage.getItem("readerFontFamily");

    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "sepia") {
      setTheme(savedTheme);
    }
    if (savedFontSize) {
      const parsed = Number(savedFontSize);
      if (!Number.isNaN(parsed)) setFontSize([parsed]);
    }
    if (savedLineHeight) {
      const parsed = Number(savedLineHeight);
      if (!Number.isNaN(parsed)) setLineHeight([parsed]);
    }
    if (savedFontFamily === "sans" || savedFontFamily === "serif") {
      setFontFamily(savedFontFamily === "serif" ? "serif" : "nunito");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("readerTheme", theme);
    localStorage.setItem("readerFontSize", String(fontSize[0]));
    localStorage.setItem("readerLineHeight", String(lineHeight[0]));
    localStorage.setItem(
      "readerFontFamily",
      fontFamily === "serif" ? "serif" : "sans"
    );
  }, [theme, fontSize, lineHeight, fontFamily]);
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-10 px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 mt-4 md:mt-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-nunito font-bold text-slate-800">
              Tuỳ chỉnh đọc sách
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Font chữ, màu nền & trải nghiệm đọc
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Theme Selection */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Chủ đề đọc
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "light", name: "Trắng sáng", bg: "bg-white", text: "text-slate-800" },
                { id: "sepia", name: "Vàng ấm", bg: "bg-[#FDF6E3]", text: "text-[#5F4B32]" },
                { id: "dark", name: "Ban đêm", bg: "bg-[#1A1A1A]", text: "text-slate-300" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={cn(
                    "group relative h-32 rounded-2xl border-2 transition-all overflow-hidden text-left p-4 flex flex-col justify-between shadow-sm",
                    theme === t.id ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-transparent hover:border-slate-200",
                    t.bg
                  )}
                >
                  <span className={cn("text-2xl font-bold font-serif", t.text)}>Aa</span>
                  <div className="flex justify-between items-end w-full">
                    <span className={cn("text-xs font-bold", t.text)}>{t.name}</span>
                    {theme === t.id && (
                      <div className="bg-primary text-white p-1 rounded-full shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="space-y-6 bg-white/60 p-6 rounded-3xl border border-white/60 shadow-sm backdrop-blur-sm">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              Typography
            </h3>

            {/* Font Family */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Font chữ</label>
              <div className="flex gap-3">
                {[
                  { id: "nunito", name: "Nunito (Tròn)", font: "font-nunito" },
                  { id: "serif", name: "Merriweather", font: "font-serif" },
                  { id: "mono", name: "Space Mono", font: "font-mono" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFontFamily(f.id as any)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border border-slate-200 text-sm transition-all hover:bg-white hover:shadow-sm",
                      f.font,
                      fontFamily === f.id ? "bg-white border-primary text-primary font-bold shadow-md" : "bg-transparent text-slate-600"
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cỡ chữ</label>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{fontSize[0]}px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400">A</span>
                <Slider
                  value={fontSize}
                  onValueChange={setFontSize}
                  min={12} max={32} step={1}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-slate-400">A</span>
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dãn dòng</label>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{lineHeight[0]}</span>
              </div>
              <div className="flex items-center gap-4">
                <AlignJustify className="w-4 h-4 text-slate-400" />
                <Slider
                  value={lineHeight}
                  onValueChange={setLineHeight}
                  min={1.0} max={2.5} step={0.1}
                  className="flex-1"
                />
                <AlignJustify className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </section>

          {/* Preview Box - Sticky Bottom or just there */}
          <div className={cn(
            "p-6 rounded-3xl shadow-lg border transition-all duration-300",
            theme === "light" ? "bg-white border-slate-100 text-slate-800" :
              theme === "sepia" ? "bg-[#FDF6E3] border-[#EEE8D5] text-[#5F4B32]" :
                "bg-[#1A1A1A] border-[#333] text-slate-300"
          )}>
            <div className="flex items-center justify-between mb-4 opacity-50">
              <span className="text-xs font-bold uppercase tracking-widest">Preview</span>
              <span className="text-xs font-bold">{fontFamily === "nunito" ? "Nunito" : fontFamily === "serif" ? "Merriweather" : "Mono"} • {fontSize[0]}px</span>
            </div>
            <p
              style={{ fontSize: `${fontSize[0]}px`, lineHeight: lineHeight[0] }}
              className={cn(
                "transition-all duration-300",
                fontFamily === "nunito" ? "font-nunito" : fontFamily === "serif" ? "font-serif" : "font-mono"
              )}
            >
              "Sách là giấc mơ mà bạn cầm trên tay. Hãy để những trang sách đưa bạn đến những vùng đất mới, gặp gỡ những người bạn mới và khám phá chính bản thân mình."
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ReadingSettings;