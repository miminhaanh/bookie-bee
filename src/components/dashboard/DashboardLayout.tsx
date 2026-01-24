import type { PropsWithChildren } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

type DashboardLayoutProps = PropsWithChildren<{
  mobileTitle?: string;
}>;

import AdPopup from "@/components/common/AdPopup";

export default function DashboardLayout({ children, mobileTitle = "Bookie Bee" }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <main className="flex-1 flex flex-col min-h-screen">
          <header className="lg:hidden h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center px-4 sticky top-0 z-40">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐝</span>
              <span className="font-bold text-lg">{mobileTitle}</span>
            </div>
          </header>

          <div className="flex-1 overflow-auto">{children}</div>
          <AdPopup />
        </main>
      </div>
    </SidebarProvider>
  );
}