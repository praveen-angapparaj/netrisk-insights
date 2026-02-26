import { ReactNode, useState } from "react";
import AppSidebar from "./AppSidebar";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "NR";

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Top Navbar */}
      <div className="ml-[260px] border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="pl-10 h-10 bg-secondary/50 border-0 rounded-xl text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-critical" />
            </button>

            <div className="h-6 w-px bg-border" />

            <button className="flex items-center gap-2.5 rounded-xl hover:bg-secondary px-2.5 py-1.5 transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {initials}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-foreground leading-tight">{userEmail || "Officer"}</p>
                <p className="text-[10px] text-muted-foreground">Fraud Analyst</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <main className="ml-[260px] min-h-[calc(100vh-4rem)]">
        <div className="p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
