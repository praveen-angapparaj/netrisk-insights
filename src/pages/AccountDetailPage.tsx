import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RiskScoreGauge from "@/components/dashboard/RiskScoreGauge";
import SeverityBadge from "@/components/dashboard/SeverityBadge";
import ChannelBadge from "@/components/dashboard/ChannelBadge";
import StatusBadge from "@/components/dashboard/StatusBadge";
import AIExplainabilityDrawer from "@/components/dashboard/AIExplainabilityDrawer";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import { useAccount } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { useAlerts } from "@/hooks/useAlerts";
import { useBlockAccount, useLaunchInvestigation } from "@/hooks/useAccountActions";
import { formatRiskType } from "@/lib/formatRiskType";
import { ArrowLeft, TrendingUp, TrendingDown, Brain, Fingerprint, Globe, CreditCard, Ban, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CHANNEL_COLORS: Record<string, string> = {
  UPI: "hsl(217,91%,55%)",
  ATM: "hsl(38,92%,50%)",
  NET_BANKING: "hsl(205,84%,52%)",
  MOBILE_BANKING: "hsl(152,69%,41%)",
  BRANCH: "hsl(220,10%,50%)",
};

const AccountDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: account, isLoading } = useAccount(id || "");
  const { data: transactions } = useTransactions(id);
  const { data: alerts } = useAlerts(id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const blockMutation = useBlockAccount();
  const investigateMutation = useLaunchInvestigation();
  const [confirmAction, setConfirmAction] = useState<"block" | "investigate" | null>(null);

  if (isLoading) return <DashboardLayout><div className="flex h-64 items-center justify-center text-muted-foreground">Loading...</div></DashboardLayout>;
  if (!account) return <DashboardLayout><div className="flex h-64 items-center justify-center text-muted-foreground">Account not found</div></DashboardLayout>;

  const channelDist = transactions
    ? Object.entries(transactions.reduce((acc: Record<string, number>, tx) => { acc[tx.channel] = (acc[tx.channel] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }))
    : [];

  const riskScore = Number(account.risk_score);
  const riskBreakdown = [
    { factor: "Transaction Velocity", weight: 30, score: Math.min(100, riskScore * 1.1) },
    { factor: "Channel Diversity", weight: 20, score: Math.min(100, riskScore * 0.9) },
    { factor: "Burst Ratio", weight: 20, score: Math.min(100, riskScore * 1.0) },
    { factor: "Multi-Hop Layering", weight: 20, score: Math.min(100, riskScore * 1.2) },
    { factor: "Dormant Reactivation", weight: 10, score: account.dormant_flag ? 80 : riskScore * 0.5 },
  ];

  const uniqueDevices = new Set(transactions?.map((tx) => tx.device_id).filter(Boolean) || []);
  const uniqueLocations = new Set(transactions?.map((tx) => tx.geo_location).filter(Boolean) || []);
  const channelCount = new Set(transactions?.map((tx) => tx.channel) || []).size;
  const status = (account as any).status || "active";
  const canAct = status === "active";

  const handleConfirm = () => {
    if (!confirmAction || !id) return;
    if (confirmAction === "block") blockMutation.mutate(id);
    else investigateMutation.mutate(id);
    setConfirmAction(null);
  };

  return (
    <DashboardLayout>
      <Link to="/accounts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Accounts
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{account.account_holder_name}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{account.account_number} · {account.account_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Brain className="h-4 w-4" /> AI Analysis
          </button>
          {canAct && (
            <>
              <button
                onClick={() => setConfirmAction("block")}
                className="inline-flex items-center gap-2 rounded-xl bg-critical/10 px-4 py-2 text-sm font-medium text-critical hover:bg-critical/20 transition-colors"
              >
                <Ban className="h-4 w-4" /> Block Account
              </button>
              <button
                onClick={() => setConfirmAction("investigate")}
                className="inline-flex items-center gap-2 rounded-xl bg-warning/10 px-4 py-2 text-sm font-medium text-warning hover:bg-warning/20 transition-colors"
              >
                <Search className="h-4 w-4" /> Launch Investigation
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Risk Score", content: <RiskScoreGauge score={riskScore} /> },
          { label: "Total Inward", content: <p className="mt-1 text-xl font-bold text-success flex items-center gap-1"><TrendingDown className="h-4 w-4" /> ₹{Number(account.total_inward_amount).toLocaleString()}</p> },
          { label: "Total Outward", content: <p className="mt-1 text-xl font-bold text-critical flex items-center gap-1"><TrendingUp className="h-4 w-4" /> ₹{Number(account.total_outward_amount).toLocaleString()}</p> },
          { label: "Transactions", content: <p className="mt-1 text-xl font-bold text-foreground">{transactions?.length ?? 0}</p> },
          { label: "Unique Devices", content: <p className="mt-1 text-xl font-bold text-info">{uniqueDevices.size}</p> },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4 card-shadow">
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <div className="mt-2">{item.content}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">IFSC Code</span>
          </div>
          <p className="font-mono text-xs text-foreground">SBIN0{account.account_number.slice(-6)}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Device Hash</span>
          </div>
          <p className="font-mono text-xs text-foreground truncate">{[...uniqueDevices][0] || "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Locations</span>
          </div>
          <p className="text-xs text-foreground">{uniqueLocations.size} unique</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Channels Used</span>
          <p className="mt-1 text-xs font-bold text-foreground">{channelCount} channels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Risk Score Breakdown</h2>
          <div className="space-y-3">
            {riskBreakdown.map((item) => (
              <div key={item.factor}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{item.factor} ({item.weight}%)</span>
                  <span className="font-mono text-foreground font-medium">{item.score.toFixed(0)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div className={`h-full rounded-full transition-all ${item.score >= 70 ? "bg-critical" : item.score >= 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Channel Distribution</h2>
          {channelDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelDist}>
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))", fontSize: "12px" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {channelDist.map((entry) => <Cell key={entry.name} fill={CHANNEL_COLORS[entry.name] || "hsl(217,91%,55%)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No transactions</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 mb-6 card-shadow">
        <h2 className="text-sm font-semibold text-foreground mb-4">Transaction History</h2>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Time</th>
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Direction</th>
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Channel</th>
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Device</th>
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Location</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.slice(0, 50).map((tx) => (
                <tr key={tx.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 text-xs text-muted-foreground">{new Date(tx.transaction_time).toLocaleString()}</td>
                  <td className="py-2.5">
                    {tx.from_account === id ? (
                      <span className="text-xs font-medium text-critical">OUTWARD</span>
                    ) : (
                      <span className="text-xs font-medium text-success">INWARD</span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-xs text-foreground font-medium">₹{Number(tx.amount).toLocaleString()}</td>
                  <td className="py-2.5"><ChannelBadge channel={tx.channel} /></td>
                  <td className="py-2.5 font-mono text-[10px] text-muted-foreground">{tx.device_id || "—"}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">{tx.geo_location || "—"}</td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
        <h2 className="text-sm font-semibold text-foreground mb-4">Alert History</h2>
        <div className="space-y-2">
          {alerts?.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <SeverityBadge severity={alert.severity} />
                <div>
                  <p className="text-sm text-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">{formatRiskType(alert.alert_type)} · {new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          {(!alerts || alerts.length === 0) && <p className="py-6 text-center text-sm text-muted-foreground">No alerts for this account</p>}
        </div>
      </div>

      <AIExplainabilityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        account={account}
        transactionCount={transactions?.length || 0}
        channelCount={channelCount}
        alertCount={alerts?.length || 0}
      />

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction === "block" ? "Block Account" : "Launch Investigation"}
        description={confirmAction === "block"
          ? "Are you sure you want to block this account? This will restrict all transactions."
          : "Are you sure you want to launch an investigation on this account?"}
        confirmLabel={confirmAction === "block" ? "Block Account" : "Launch Investigation"}
        onConfirm={handleConfirm}
        variant={confirmAction === "block" ? "destructive" : "default"}
      />
    </DashboardLayout>
  );
};

export default AccountDetailPage;
