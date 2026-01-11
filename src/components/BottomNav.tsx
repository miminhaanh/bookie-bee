import { BookOpen, PenLine, BarChart3, Globe, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import SettingsPopover from "./SettingsPopover";

const navItems = [
  { icon: BookOpen, path: "/", label: "Thư viện" },
  { icon: PenLine, path: "/notes", label: "Ghi chú" },
  { icon: BarChart3, path: "/dashboard", label: "Báo cáo" },
  { icon: Globe, path: "/community", label: "Cộng đồng" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSettingsActive = location.pathname.startsWith("/settings");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map(({ icon: Icon, path, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                "hover:bg-muted active:scale-95",
                isActive && "bg-primary/10"
              )}
              aria-label={label}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-all duration-200",
                  isActive 
                    ? "text-primary scale-110" 
                    : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </button>
          );
        })}
        
        {/* Settings with Popover */}
        <SettingsPopover>
          <button
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
              "hover:bg-muted active:scale-95",
              isSettingsActive && "bg-primary/10"
            )}
            aria-label="Cài đặt"
          >
            <Settings
              className={cn(
                "h-6 w-6 transition-all duration-200",
                isSettingsActive 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground"
              )}
              strokeWidth={isSettingsActive ? 2.5 : 2}
            />
          </button>
        </SettingsPopover>
      </div>
    </nav>
  );
};

export default BottomNav;