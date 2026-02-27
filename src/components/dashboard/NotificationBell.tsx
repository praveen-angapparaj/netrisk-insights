import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useNavigate } from "react-router-dom";
import { formatRiskType } from "@/lib/formatRiskType";

const NotificationBell = () => {
  const { data: accounts } = useAccounts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const highRiskAccounts = accounts?.filter(
    (a) => Number(a.risk_score) > 85 || a.is_flagged
  ) || [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-secondary transition-colors"
      >
        <Bell className="h-[18px] w-[18px] text-muted-foreground" />
        {highRiskAccounts.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-critical opacity-75" />
            <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-critical text-[8px] font-bold text-critical-foreground">
              {highRiskAccounts.length > 9 ? "9+" : highRiskAccounts.length}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card card-shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Risk Notifications</p>
            <p className="text-xs text-muted-foreground">{highRiskAccounts.length} high-risk accounts</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {highRiskAccounts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No critical alerts</p>
            ) : (
              highRiskAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => { navigate(`/accounts/${account.id}`); setOpen(false); }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/50 last:border-0"
                >
                  <div className="flex-shrink-0 mt-0.5 h-2 w-2 rounded-full bg-critical" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono font-medium text-foreground truncate">{account.account_number}</p>
                      <span className="text-xs font-bold font-mono text-critical">{Number(account.risk_score)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{account.account_holder_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {account.is_flagged ? "Flagged" : "High Risk"} · {account.last_active_at ? new Date(account.last_active_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
