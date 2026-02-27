import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SeverityBadge from "@/components/dashboard/SeverityBadge";
import { useAlerts } from "@/hooks/useAlerts";
import { useAccounts } from "@/hooks/useAccounts";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRiskType } from "@/lib/formatRiskType";
import { useBlockAccount, useLaunchInvestigation } from "@/hooks/useAccountActions";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

const AlertsPage = () => {
  const { data: alerts, isLoading } = useAlerts();
  const { data: accounts } = useAccounts();
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const blockMutation = useBlockAccount();
  const investigateMutation = useLaunchInvestigation();
  const [confirmAction, setConfirmAction] = useState<{ type: "block" | "investigate"; accountId: string } | null>(null);

  const accountMap = new Map(accounts?.map((a) => [a.id, a]) || []);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    if (filterSeverity === "all") return alerts;
    return alerts.filter((a) => a.severity === filterSeverity);
  }, [alerts, filterSeverity]);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "block") blockMutation.mutate(confirmAction.accountId);
    else investigateMutation.mutate(confirmAction.accountId);
    setConfirmAction(null);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground">Real-time fraud alert monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Filter severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-xl border border-border bg-card px-3 py-1.5 card-shadow">
            <span className="text-xs text-muted-foreground">Open: </span>
            <span className="text-xs font-bold font-mono text-foreground">{filteredAlerts.length}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-1 py-3 w-1"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Risk Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Risk Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Trigger Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground max-w-[200px]">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alert) => {
              const acct = accountMap.get(alert.account_id);
              const severityColor = alert.severity === "CRITICAL" ? "bg-critical" : alert.severity === "HIGH" ? "bg-risk-high" : alert.severity === "MEDIUM" ? "bg-warning" : "bg-success";
              return (
                <tr key={alert.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-0 py-3 w-1">
                    <div className={`w-1 h-8 rounded-r-full ${severityColor}`} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">
                    {acct ? <Link to={`/accounts/${acct.id}`} className="hover:underline">{acct.account_number}</Link> : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{acct ? Number(acct.risk_score) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{formatRiskType(alert.alert_type)}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-foreground max-w-[200px] truncate">{alert.description}</td>
                  <td className="px-4 py-3">
                    {acct && ((acct as any).status === "active" || !(acct as any).status) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmAction({ type: "block", accountId: acct.id })}
                          className="rounded-lg bg-critical/10 px-2 py-1 text-[10px] font-bold text-critical hover:bg-critical/20 transition-colors"
                        >
                          Block
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: "investigate", accountId: acct.id })}
                          className="rounded-lg bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning hover:bg-warning/20 transition-colors"
                        >
                          Investigate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!isLoading && filteredAlerts.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No alerts</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction?.type === "block" ? "Block Account" : "Launch Investigation"}
        description={confirmAction?.type === "block"
          ? "Are you sure you want to block this account? This will restrict all transactions."
          : "Are you sure you want to launch an investigation on this account?"}
        confirmLabel={confirmAction?.type === "block" ? "Block Account" : "Launch Investigation"}
        onConfirm={handleConfirm}
        variant={confirmAction?.type === "block" ? "destructive" : "default"}
      />
    </DashboardLayout>
  );
};

export default AlertsPage;
