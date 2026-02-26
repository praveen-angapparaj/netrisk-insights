import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Network,
  Users,
  AlertTriangle,
  Activity,
  Zap,
  LogOut,
  Shield,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/accounts", icon: Users, label: "Accounts" },
  { to: "/graph", icon: Network, label: "Network Graph" },
  { to: "/alerts", icon: AlertTriangle, label: "Alerts" },
  { to: "/analytics", icon: Activity, label: "Analytics" },
  { to: "/simulate", icon: Zap, label: "Simulation" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[260px] border-r border-border bg-sidebar flex flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">NetRisk</h1>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Mule Detection AI</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Main Menu</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3 space-y-2">
        <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">System Status</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-foreground font-medium">Monitoring Active</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
