import { useNavigate } from "react-router-dom";
import { Globe, Users, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

const Community = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  return (
    <DashboardLayout mobileTitle="Cộng đồng">
      <div className="min-h-screen bg-background safe-area-top">
        {/* Header */}
        <header className="sticky top-16 lg:top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-foreground">Cộng đồng</h1>
            <p className="text-sm text-muted-foreground">Kết nối với độc giả khác</p>
          </div>
        </header>

        {/* Coming Soon Content */}
        <main className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="relative mb-6">
            <div className="rounded-full bg-secondary/10 p-6">
              <Globe className="h-16 w-16 text-secondary" />
            </div>
            {/* Decorative icons */}
            <div className="absolute -left-4 -top-2 rounded-full bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="absolute -right-4 top-4 rounded-full bg-accent/20 p-2">
              <MessageCircle className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="absolute -bottom-2 -left-2 rounded-full bg-reading/10 p-2">
              <Heart className="h-5 w-5 text-reading" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Sắp ra mắt! 🚀</h2>

          <p className="text-muted-foreground max-w-xs mb-6">
            Tính năng cộng đồng đang được phát triển. Bạn sẽ có thể chia sẻ highlights,
            theo dõi bạn bè và khám phá sách mới!
          </p>

          {/* Feature preview */}
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border text-left">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Theo dõi bạn bè</p>
                <p className="text-sm text-muted-foreground">Xem họ đang đọc gì</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border text-left">
              <div className="rounded-lg bg-secondary/10 p-2">
                <MessageCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Chia sẻ Highlights</p>
                <p className="text-sm text-muted-foreground">Chia sẻ trích dẫn hay</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border text-left">
              <div className="rounded-lg bg-accent/20 p-2">
                <Heart className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Đề xuất sách</p>
                <p className="text-sm text-muted-foreground">Khám phá sách mới từ cộng đồng</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Community;