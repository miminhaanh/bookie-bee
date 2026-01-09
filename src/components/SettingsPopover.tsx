import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface SettingsPopoverProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    icon: User,
    label: "Thông tin cá nhân",
    href: "/settings/profile",
  },
  {
    icon: Shield,
    label: "Bảo mật & Quyền riêng tư",
    href: "/settings/security",
  },
  {
    icon: Bell,
    label: "Cài đặt Thông báo",
    href: "/settings/notifications",
  },
  {
    icon: Palette,
    label: "Giao diện & Trải nghiệm",
    href: "/settings/appearance",
  },
  {
    icon: Globe,
    label: "Ngôn ngữ",
    href: "/settings/language",
  },
  {
    icon: LogOut,
    label: "Đăng xuất",
    href: "/settings/logout",
    isDestructive: true,
  },
];

const SettingsPopover = ({ children }: SettingsPopoverProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const initials = (profile?.display_name || user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const handleMenuClick = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        align="end"
        side="top"
        sideOffset={12}
      >
        {/* User info header */}
        <div className="p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {profile?.display_name || "Chưa đặt tên"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Menu items */}
        <div className="py-2">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleMenuClick(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                (item as any).isDestructive
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className={`h-4 w-4 ${
                (item as any).isDestructive ? "" : "text-muted-foreground"
              }`} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className={`h-4 w-4 ${
                (item as any).isDestructive ? "" : "text-muted-foreground"
              }`} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SettingsPopover;
