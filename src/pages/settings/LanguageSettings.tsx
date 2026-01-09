import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Language {
  code: string;
  flag: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: Language[] = [
  { code: "vi", flag: "🇻🇳", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "en", flag: "🇺🇸", name: "English", nativeName: "English" },
  { code: "zh", flag: "🇨🇳", name: "Chinese", nativeName: "中文" },
  { code: "ja", flag: "🇯🇵", name: "Japanese", nativeName: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "Korean", nativeName: "한국어" },
  { code: "fr", flag: "🇫🇷", name: "French", nativeName: "Français" },
];

const LanguageSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState("vi");
  const [originalLanguage, setOriginalLanguage] = useState("vi");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved language
  useEffect(() => {
    const loadLanguage = async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem(`language_${user?.id}`);
        if (saved) {
          setSelectedLanguage(saved);
          setOriginalLanguage(saved);
        }
      } catch (error) {
        console.error("Error loading language:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      loadLanguage();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Check for changes
  useEffect(() => {
    setHasChanges(selectedLanguage !== originalLanguage);
  }, [selectedLanguage, originalLanguage]);

  // Save language
  const saveLanguage = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`language_${user?.id}`, selectedLanguage);
      setOriginalLanguage(selectedLanguage);
      setHasChanges(false);

      const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName;
      toast({
        title: "Đã lưu!",
        description: `Ngôn ngữ đã được đổi thành ${langName}`,
      });

      // In a real app, this would trigger i18n locale change
    } catch (error) {
      console.error("Error saving language:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Ngôn ngữ
          </h1>
          <p className="text-sm text-muted-foreground">
            Chọn ngôn ngữ bạn muốn sử dụng trong ứng dụng
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        {/* Language Grid */}
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                selectedLanguage === lang.code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              {/* Selected indicator */}
              {selectedLanguage === lang.code && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              {/* Flag */}
              <span className="text-3xl">{lang.flag}</span>
              
              {/* Language names */}
              <div className="mt-2">
                <p className="font-medium text-foreground">
                  {lang.nativeName}
                </p>
                {lang.nativeName !== lang.name && (
                  <p className="text-sm text-muted-foreground">
                    {lang.name}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Note */}
        <div className="rounded-xl bg-muted/30 p-4 border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Lưu ý:</span> Một số nội dung sách có thể chỉ khả dụng bằng ngôn ngữ gốc. Thay đổi ngôn ngữ chỉ ảnh hưởng đến giao diện ứng dụng.
          </p>
        </div>
      </main>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
          <Button
            className="w-full"
            onClick={saveLanguage}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default LanguageSettings;
