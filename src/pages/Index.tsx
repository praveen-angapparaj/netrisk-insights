import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import RiskScoreGauge from "@/components/dashboard/RiskScoreGauge";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAccounts } from "@/hooks/useAccounts";
import { useAlerts } from "@/hooks/useAlerts";
import { useAllTransactions } from "@/hooks/useTransactions";
import { Users, ArrowLeftRight, AlertTriangle, ShieldAlert, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeverityBadge from "@/components/dashboard/SeverityBadge";
import { formatRiskType } from "@/lib/formatRiskType";
import { useBlockAccount, useLaunchInvestigation } from "@/hooks/useAccountActions";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

const CHANNEL_COLORS = ["hsl(217,91%,55%)", "hsl(38,92%,50%)", "hsl(205,84%,52%)", "hsl(152,69%,41%)", "hsl(0,72%,51%)"];

const Index = () => {
  const { data: stats } = useDashboardStats();
  const { data: accounts } = useAccounts();
  const { data: alerts } = useAlerts();
  const { data: transactions } = useAllTransactions();
  const blockMutation = useBlockAccount();
  const investigateMutation = useLaunchInvestigation();

  const [confirmAction, setConfirmAction] = useState<{ type: "block" | "investigate"; accountId: string } | null>(null);

  const activeAccounts = useMemo(() => accounts?.filter((a) => (a as any).status === "active" || !(a as any).status) || [], [accounts]);
  const highRiskAccounts = useMemo(() => accounts?.filter((a) => Number(a.risk_score) > 70) || [], [accounts]);
  const blockedAccounts = useMemo(() => accounts?.filter((a) => (a as any).status === "blocked") || [], [accounts]);
  const investigatingAccounts = useMemo(() => accounts?.filter((a) => (a as any).status === "investigating") || [], [accounts]);

  const channelDistribution = transactions
    ? Object.entries(
        transactions.reduce((acc: Record<string, number>, tx) => {
          acc[tx.channel] = (acc[tx.channel] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
    : [];

  const accountMap = new Map(accounts?.map((a) => [a.id, a]) || []);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "block") blockMutation.mutate(confirmAction.accountId);
    else investigateMutation.mutate(confirmAction.accountId);
    setConfirmAction(null);
  };

  const renderAccountTable = (list: typeof accounts, showActions = false) => (
    <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Holder</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-36">Risk Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              {showActions && <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list?.map((account) => (
              <tr key={account.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/accounts/${account.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
                    {account.account_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground text-sm">{account.account_holder_name}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize text-sm">{account.account_type}</td>
                <td className="px-4 py-3"><RiskScoreGauge score={Number(account.risk_score)} /></td>
                <td className="px-4 py-3"><StatusBadge status={(account as any).status || "active"} /></td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {((account as any).status === "active" || !(account as any).status) && (
                        <>
                          <button
                            onClick={() => setConfirmAction({ type: "block", accountId: account.id })}
                            className="rounded-lg bg-critical/10 px-2.5 py-1 text-[10px] font-bold text-critical hover:bg-critical/20 transition-colors"
                          >
                            Block
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: "investigate", accountId: account.id })}
                            className="rounded-lg bg-warning/10 px-2.5 py-1 text-[10px] font-bold text-warning hover:bg-warning/20 transition-colors"
                          >
                            Investigate
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {(!list || list.length === 0) && (
              <tr><td colSpan={showActions ? 6 : 5} className="py-8 text-center text-muted-foreground text-sm">No accounts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAlertsTable = () => (
    <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-1 py-3 w-1"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Risk Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Risk Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Trigger Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts?.slice(0, 20).map((alert) => {
              const acct = accountMap.get(alert.account_id);
              const severityColor = alert.severity === "CRITICAL" ? "bg-critical" : alert.severity === "HIGH" ? "bg-risk-high" : alert.severity === "MEDIUM" ? "bg-warning" : "bg-success";
              return (
                <tr key={alert.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-0 py-3 w-1">
                    <div className={`w-1 h-8 rounded-r-full ${severityColor}`} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">
                    {acct ? <Link to={`/accounts/${acct.id}`} className="hover:underline">{acct.account_number}</Link> : "\u2014"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{acct ? Number(acct.risk_score) : "\u2014"}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{formatRiskType(alert.alert_type)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
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
            {(!alerts || alerts.length === 0) && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No alerts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Cross-channel mule account detection overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard title="Total Accounts" value={stats?.totalAccounts ?? "\u2014"} icon={Users} variant="default" />
        <MetricCard title="Total Transactions" value={stats?.totalTransactions ?? "\u2014"} icon={ArrowLeftRight} variant="default" />
        <MetricCard title="High Risk" value={stats?.highRiskAccounts ?? "\u2014"} icon={ShieldAlert} variant="danger" subtitle="Flagged accounts" />
        <MetricCard title="Critical Alerts" value={stats?.criticalAlerts ?? "\u2014"} icon={AlertTriangle} variant="warning" />
        <MetricCard title="Cross-Channel" value={`${stats?.crossChannelPct ?? 0}%`} icon={Radio} variant="info" subtitle="Channel diversity" />
      </div>

      <Tabs defaultValue="active" className="mb-6">
        <TabsList className="bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="active" className="rounded-lg text-xs">Active Accounts ({activeAccounts.length})</TabsTrigger>
          <TabsTrigger value="high-risk" className="rounded-lg text-xs">High Risk ({highRiskAccounts.length})</TabsTrigger>
          <TabsTrigger value="blocked" className="rounded-lg text-xs">Blocked ({blockedAccounts.length})</TabsTrigger>
          <TabsTrigger value="investigating" className="rounded-lg text-xs">Investigating ({investigatingAccounts.length})</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg text-xs">Alerts ({alerts?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">{renderAccountTable(activeAccounts, true)}</TabsContent>
        <TabsContent value="high-risk">{renderAccountTable(highRiskAccounts, true)}</TabsContent>
        <TabsContent value="blocked">{renderAccountTable(blockedAccounts)}</TabsContent>
        <TabsContent value="investigating">{renderAccountTable(investigatingAccounts)}</TabsContent>
        <TabsContent value="alerts">{renderAlertsTable()}</TabsContent>
      </Tabs>

      {/* Channel Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Top Risk Accounts</h2>
            <Link to="/accounts" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Account</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Holder</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground w-36">Risk Score</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {(accounts?.filter((a) => a.risk_score > 0).slice(0, 6) || []).map((account) => (
                  <tr key={account.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-3">
                      <Link to={`/accounts/${account.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
                        {account.account_number}
                      </Link>
                    </td>
                    <td className="py-3 text-foreground text-sm">{account.account_holder_name}</td>
                    <td className="py-3 w-36"><RiskScoreGauge score={Number(account.risk_score)} /></td>
                    <td className="py-3"><StatusBadge status={(account as any).status || "active"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Channel Distribution</h2>
          {channelDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={channelDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                  {channelDistribution.map((_, idx) => (
                    <Cell key={idx} fill={CHANNEL_COLORS[idx % CHANNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
          <div className="mt-2 space-y-2">
            {channelDistribution.map((ch, idx) => (
              <div key={ch.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHANNEL_COLORS[idx % CHANNEL_COLORS.length] }} />
                  <span className="text-muted-foreground capitalize">{ch.name}</span>
                </div>
                <span className="font-mono text-foreground font-medium">{ch.value}</span>
              </div>
            ))}
          </div>
        </div>
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

export default Index;
