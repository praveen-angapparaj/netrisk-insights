import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { Sun, Moon } from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";
import ProfileDropdown from "@/components/dashboard/ProfileDropdown";
import { useTheme } from "@/hooks/useTheme";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Top Navbar */}
      <div className="ml-[260px] border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center justify-end h-14 px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px] text-warning" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-muted-foreground" />
              )}
            </button>

            <NotificationBell />

            <div className="h-6 w-px bg-border" />

            <ProfileDropdown />
          </div>
        </div>
      </div>

      <main className="ml-[260px] min-h-[calc(100vh-3.5rem)]">
        <div className="p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
