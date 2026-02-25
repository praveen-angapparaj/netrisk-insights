import DashboardLayout from "@/components/layout/DashboardLayout";
import SeverityBadge from "@/components/dashboard/SeverityBadge";
import { useAlerts } from "@/hooks/useAlerts";
import { useAccounts } from "@/hooks/useAccounts";
import { Link } from "react-router-dom";

const AlertsPage = () => {
  const { data: alerts, isLoading } = useAlerts();
  const { data: accounts } = useAccounts();

  const accountMap = new Map(accounts?.map((a) => [a.id, a]) || []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
        <p className="text-sm text-muted-foreground">Real-time fraud alert monitoring</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts?.map((alert) => {
              const acct = accountMap.get(alert.account_id);
              return (
                <tr key={alert.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3"><SeverityBadge severity={alert.severity} /></td>
                  <td className="px-5 py-3 font-mono text-xs text-primary">
                    {acct ? (
                      <Link to={`/accounts/${acct.id}`} className="hover:underline">{acct.account_number}</Link>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{alert.alert_type}</td>
                  <td className="px-5 py-3 text-foreground max-w-sm truncate">{alert.description}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    {acct && (
                      <Link to={`/accounts/${acct.id}`} className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                        Investigate
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {!isLoading && (!alerts || alerts.length === 0) && (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No alerts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AlertsPage;
