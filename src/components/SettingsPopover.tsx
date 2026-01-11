import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  BookOpen,
  Shield,
  Bell,
  Database,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface SettingsPopoverProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    icon: User,
    label: "Thông tin cá nhân",
    emoji: "👤",
    href: "/settings/profile",
  },
  {
    icon: BookOpen,
    label: "Cài đặt đọc sách",
    emoji: "📖",
    href: "/settings/reading",
  },
  {
    icon: Shield,
    label: "Quyền riêng tư",
    emoji: "🔒",
    href: "/settings/privacy",
  },
  {
    icon: Bell,
    label: "Thông báo",
    emoji: "🔔",
    href: "/settings/notifications",
  },
  {
    icon: Database,
    label: "Dữ liệu & Đồng bộ",
    emoji: "☁️",
    href: "/settings/data",
  },
];

const SettingsPopover = ({ children }: SettingsPopoverProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const initials = (profile?.display_name || user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const handleMenuClick = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 rounded-2xl border-border/50 shadow-lg overflow-hidden"
        align="end"
        side="top"
        sideOffset={12}
      >
        {/* User info header */}
        <div className="p-3 bg-gradient-to-br from-soft-pink/30 to-peach/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-warm-pink/30 shadow-sm">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-warm-pink/20 text-warm-pink font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">
                {profile?.display_name || "Chưa đặt tên"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="py-1.5">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleMenuClick(item.href)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-soft-pink/20"
            >
              <span className="text-base">{item.emoji}</span>
              <span className="flex-1 text-left text-foreground">{item.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-muted/30 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Bookie Bee v1.0 🐝
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SettingsPopover;
