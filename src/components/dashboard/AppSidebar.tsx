import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  StickyNote,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Library
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Trang chủ", icon: Home, path: "/dashboard" },
  { title: "Thư viện", icon: Library, path: "/library" },
  { title: "Highlights", icon: StickyNote, path: "/notes" },
  { title: "Báo cáo", icon: BarChart3, path: "/reports" },
  { title: "Cộng đồng", icon: Users, path: "/community" },
];

const systemNavItems = [
  { title: "Cài đặt", icon: Settings, path: "/settings" },
  { title: "Trợ giúp", icon: HelpCircle, path: "/help" },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <SidebarHeader className="p-6">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warm-pink via-coral to-peach flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-2xl">🐝</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-sage rounded-full border-2 border-sidebar animate-pulse-soft" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-sidebar-foreground">Bookie Bee</h1>
            <p className="text-xs text-muted-foreground">Đọc sách mỗi ngày</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive(item.path) && "bg-gradient-to-r from-warm-pink/20 to-coral/10 text-warm-pink font-semibold shadow-sm"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive(item.path) ? "text-warm-pink" : "text-muted-foreground"
                    )} />
                    <span>{item.title}</span>
                    {isActive(item.path) && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-warm-pink animate-pulse-soft" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-6">

        {/* System Navigation */}
        <SidebarMenu>
          {systemNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )}
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Logout Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all hover:bg-destructive/10 hover:text-destructive text-destructive/70"
            >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}