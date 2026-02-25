import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SeverityBadge from "@/components/dashboard/SeverityBadge";
import SLATimer from "@/components/dashboard/SLATimer";
import { useAlerts } from "@/hooks/useAlerts";
import { useAccounts } from "@/hooks/useAccounts";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INVESTIGATORS = ["Unassigned", "Agt. R. Sharma", "Agt. P. Verma", "Agt. S. Nair", "Agt. K. Singh"];

const generateCaseId = (alertId: string, idx: number) => {
  const hash = alertId.slice(0, 4).toUpperCase();
  return `FR-${new Date().getFullYear()}-${String(idx + 1).padStart(4, "0")}`;
};

const getPriorityScore = (severity: string, createdAt: string) => {
  const base = severity === "CRITICAL" ? 85 : severity === "HIGH" ? 65 : severity === "MEDIUM" ? 40 : 20;
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  const urgency = Math.min(15, Math.round(hoursOld * 0.5));
  return Math.min(100, base + urgency);
};

const AlertsPage = () => {
  const { data: alerts, isLoading } = useAlerts();
  const { data: accounts } = useAccounts();
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const accountMap = new Map(accounts?.map((a) => [a.id, a]) || []);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    if (filterSeverity === "all") return alerts;
    return alerts.filter((a) => a.severity === filterSeverity);
  }, [alerts, filterSeverity]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alert Case Management</h1>
          <p className="text-sm text-muted-foreground">Real-time fraud alert monitoring with SLA tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-36 h-9 text-xs">
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
          <div className="rounded-lg border border-border bg-card px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Open Cases: </span>
            <span className="text-xs font-bold font-mono text-foreground">{filteredAlerts.length}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Case ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground max-w-[240px]">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SLA Timer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Investigator</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alert, idx) => {
              const acct = accountMap.get(alert.account_id);
              const priority = getPriorityScore(alert.severity, alert.created_at);
              const caseId = generateCaseId(alert.id, idx);
              return (
                <tr key={alert.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{caseId}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${priority >= 80 ? "bg-critical" : priority >= 50 ? "bg-warning" : "bg-success"}`}
                          style={{ width: `${priority}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-foreground">{priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">
                    {acct ? (
                      <Link to={`/accounts/${acct.id}`} className="hover:underline">{acct.account_number}</Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{alert.alert_type}</td>
                  <td className="px-4 py-3 text-foreground text-xs max-w-[240px] truncate">{alert.description}</td>
                  <td className="px-4 py-3"><SLATimer createdAt={alert.created_at} slaMinutes={alert.severity === "CRITICAL" ? 15 : 30} /></td>
                  <td className="px-4 py-3">
                    <Select
                      value={assignments[alert.id] || "Unassigned"}
                      onValueChange={(val) => setAssignments((prev) => ({ ...prev, [alert.id]: val }))}
                    >
                      <SelectTrigger className="h-7 w-32 text-[11px] border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVESTIGATORS.map((inv) => (
                          <SelectItem key={inv} value={inv} className="text-xs">{inv}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {acct && (
                      <Link
                        to={`/accounts/${acct.id}`}
                        className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        Investigate
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {!isLoading && filteredAlerts.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No alerts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AlertsPage;
