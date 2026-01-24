import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const AD_COOKIE_NAME = "bookie_ad_closed";
const AD_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Random delay between 3-10 minutes (180000-600000ms)
const getRandomDelay = () => {
  const minDelay = 3 * 60 * 1000; // 3 minutes
  const maxDelay = 10 * 60 * 1000; // 10 minutes
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
};

const AdPopup = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if popup was closed previously
        const isAdClosed = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${AD_COOKIE_NAME}=`));

        if (!isAdClosed) {
            // Show popup after random delay (3-10 minutes)
            const delay = getRandomDelay();
            console.log(`Ad will appear in ${Math.round(delay / 60000)} minutes`);
            
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, delay);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Set cookie to prevent reappearing for 7 days
        document.cookie = `${AD_COOKIE_NAME}=true; path=/; max-age=${AD_COOKIE_MAX_AGE}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-border">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Ad Content */}
                <div className="flex flex-col">
                    {/* Image Area */}
                    <div className="h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-50 mix-blend-overlay" />
                        <div className="relative text-center p-6 text-white transform hover:scale-105 transition-transform duration-500">
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/30">
                                Sản phẩm nổi bật
                            </span>
                            <h3 className="text-2xl font-bold mb-1 shadow-sm">Kindle Paperwhite</h3>
                            <p className="text-white/90 text-sm">Nâng tầm trải nghiệm đọc sách</p>
                        </div>
                    </div>

                    {/* Details Area */}
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-lg">Ưu đãi giảm 20% hôm nay!</h4>
                            <p className="text-sm text-muted-foreground">
                                Màn hình 6.8 inch, đèn nền ấm có thể điều chỉnh, thời lượng pin lên đến 10 tuần.
                            </p>
                        </div>

                        <Button className="w-full gap-2 rounded-xl h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg shadow-indigo-500/20">
                            <ExternalLink className="w-4 h-4" />
                            Xem chi tiết
                        </Button>

                        <p className="text-[10px] text-center text-muted-foreground">
                            Quảng cáo từ đối tác Bookie Bee
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdPopup;
