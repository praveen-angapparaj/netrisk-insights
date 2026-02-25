import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import SeverityBadge from "@/components/dashboard/SeverityBadge";
import RiskScoreGauge from "@/components/dashboard/RiskScoreGauge";
import ImpactMetrics from "@/components/dashboard/ImpactMetrics";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAccounts } from "@/hooks/useAccounts";
import { useAlerts } from "@/hooks/useAlerts";
import { useAllTransactions } from "@/hooks/useTransactions";
import { Users, ArrowLeftRight, AlertTriangle, ShieldAlert, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CHANNEL_COLORS = ["hsl(217,91%,60%)", "hsl(38,92%,50%)", "hsl(199,89%,48%)", "hsl(142,71%,45%)", "hsl(0,72%,51%)"];

const Index = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: accounts } = useAccounts();
  const { data: alerts } = useAlerts();
  const { data: transactions } = useAllTransactions();

  const channelDistribution = transactions
    ? Object.entries(
        transactions.reduce((acc: Record<string, number>, tx) => {
          acc[tx.channel] = (acc[tx.channel] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name: name.replace("_", " "), value }))
    : [];

  const topRiskAccounts = accounts?.filter((a) => a.risk_score > 0).slice(0, 8) || [];
  const recentAlerts = alerts?.slice(0, 5) || [];
  const accountMap = new Map(accounts?.map((a) => [a.id, a]) || []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Fraud Monitoring Dashboard</h1>
        <p className="text-sm text-muted-foreground">Cross-channel mule account detection overview</p>
      </div>

      {/* Impact Metrics */}
      <ImpactMetrics
        totalAccounts={stats?.totalAccounts ?? 0}
        flaggedAccounts={stats?.highRiskAccounts ?? 0}
        totalTransactions={stats?.totalTransactions ?? 0}
        criticalAlerts={stats?.criticalAlerts ?? 0}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard title="Total Accounts" value={stats?.totalAccounts ?? "—"} icon={Users} variant="default" />
        <MetricCard title="Total Transactions" value={stats?.totalTransactions ?? "—"} icon={ArrowLeftRight} variant="default" />
        <MetricCard title="High Risk" value={stats?.highRiskAccounts ?? "—"} icon={ShieldAlert} variant="danger" subtitle="Flagged accounts" />
        <MetricCard title="Critical Alerts" value={stats?.criticalAlerts ?? "—"} icon={AlertTriangle} variant="warning" />
        <MetricCard title="Cross-Channel" value={`${stats?.crossChannelPct ?? 0}%`} icon={Radio} variant="info" subtitle="Channel diversity" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Accounts Table */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Top Risk Accounts</h2>
            <Link to="/accounts" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Holder</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {topRiskAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3">
                      <Link to={`/accounts/${account.id}`} className="font-mono text-xs text-primary hover:underline">
                        {account.account_number}
                      </Link>
                    </td>
                    <td className="py-3 text-foreground">{account.account_holder_name}</td>
                    <td className="py-3 text-muted-foreground capitalize">{account.account_type}</td>
                    <td className="py-3 w-40"><RiskScoreGauge score={Number(account.risk_score)} /></td>
                    <td className="py-3">
                      {account.is_flagged && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-critical/20 bg-critical/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">Flagged</span>
                      )}
                    </td>
                  </tr>
                ))}
                {topRiskAccounts.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No risk data available. Seed the database first.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Channel Distribution</h2>
          {channelDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={channelDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                  {channelDistribution.map((_, idx) => (
                    <Cell key={idx} fill={CHANNEL_COLORS[idx % CHANNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,44%,10%)", border: "1px solid hsl(222,30%,16%)", borderRadius: "8px", color: "hsl(210,40%,93%)", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
          <div className="mt-2 space-y-1.5">
            {channelDistribution.map((ch, idx) => (
              <div key={ch.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHANNEL_COLORS[idx % CHANNEL_COLORS.length] }} />
                  <span className="text-muted-foreground">{ch.name}</span>
                </div>
                <span className="font-mono text-foreground">{ch.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Alerts</h2>
          <Link to="/alerts" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {recentAlerts.map((alert) => {
            const acct = accountMap.get(alert.account_id);
            return (
              <div key={alert.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-4 py-3">
                <div className="flex items-center gap-4">
                  <SeverityBadge severity={alert.severity} />
                  <div>
                    <p className="text-sm text-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">{acct?.account_number || "—"} · {new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {acct && <Link to={`/accounts/${acct.id}`} className="text-xs text-primary hover:underline">Investigate</Link>}
              </div>
            );
          })}
          {recentAlerts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No alerts</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
