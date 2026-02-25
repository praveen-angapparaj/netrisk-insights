import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Network,
  Users,
  AlertTriangle,
  Activity,
  Shield,
  Zap,
} from "lucide-react";

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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-tight">NetRisk</h1>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Graph Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="rounded-lg bg-secondary/50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">System Status</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs text-foreground font-medium">Monitoring Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
