import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RiskScoreGauge from "@/components/dashboard/RiskScoreGauge";
import SeverityBadge from "@/components/dashboard/SeverityBadge";
import ChannelBadge from "@/components/dashboard/ChannelBadge";
import { useAccount } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { useAlerts } from "@/hooks/useAlerts";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CHANNEL_COLORS: Record<string, string> = {
  UPI: "hsl(217,91%,60%)",
  ATM: "hsl(38,92%,50%)",
  NET_BANKING: "hsl(199,89%,48%)",
  MOBILE_BANKING: "hsl(142,71%,45%)",
  BRANCH: "hsl(215,20%,55%)",
};

const AccountDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: account, isLoading } = useAccount(id || "");
  const { data: transactions } = useTransactions(id);
  const { data: alerts } = useAlerts(id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground">Account not found</div>
      </DashboardLayout>
    );
  }

  const channelDist = transactions
    ? Object.entries(
        transactions.reduce((acc: Record<string, number>, tx) => {
          acc[tx.channel] = (acc[tx.channel] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  const riskScore = Number(account.risk_score);
  // Simulated breakdown proportional to score
  const riskBreakdown = [
    { factor: "Transaction Velocity", weight: 30, score: Math.min(100, riskScore * 1.1) },
    { factor: "Channel Diversity", weight: 20, score: Math.min(100, riskScore * 0.9) },
    { factor: "Burst Ratio", weight: 20, score: Math.min(100, riskScore * 1.0) },
    { factor: "Multi-Hop Layering", weight: 20, score: Math.min(100, riskScore * 1.2) },
    { factor: "Dormant Reactivation", weight: 10, score: account.dormant_flag ? 80 : riskScore * 0.5 },
  ];

  return (
    <DashboardLayout>
      <Link to="/accounts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Accounts
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{account.account_holder_name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{account.account_number} · {account.account_type}</p>
        </div>
        <div className="flex items-center gap-3">
          {account.is_flagged && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-critical/30 bg-critical/10 px-3 py-1.5 text-sm font-bold text-critical glow-danger">
              ⚠ FLAGGED
            </span>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Risk Score</p>
          <div className="mt-2"><RiskScoreGauge score={riskScore} /></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Inward</p>
          <p className="mt-1 text-xl font-bold text-success flex items-center gap-1">
            <TrendingDown className="h-4 w-4" /> ₹{Number(account.total_inward_amount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Outward</p>
          <p className="mt-1 text-xl font-bold text-critical flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> ₹{Number(account.total_outward_amount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Transactions</p>
          <p className="mt-1 text-xl font-bold text-foreground">{transactions?.length ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Risk Breakdown */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Risk Score Breakdown</h2>
          <div className="space-y-3">
            {riskBreakdown.map((item) => (
              <div key={item.factor}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.factor} ({item.weight}%)</span>
                  <span className="font-mono text-foreground">{item.score.toFixed(0)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.score >= 70 ? "bg-critical" : item.score >= 40 ? "bg-warning" : "bg-success"
                    }`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Channel Distribution</h2>
          {channelDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelDist}>
                <XAxis dataKey="name" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222,44%,10%)",
                    border: "1px solid hsl(222,30%,16%)",
                    borderRadius: "8px",
                    color: "hsl(210,40%,93%)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {channelDist.map((entry) => (
                    <Cell key={entry.name} fill={CHANNEL_COLORS[entry.name] || "hsl(217,91%,60%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No transactions</div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Transaction History</h2>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direction</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.slice(0, 50).map((tx) => (
                <tr key={tx.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="py-2.5 text-xs text-muted-foreground">{new Date(tx.transaction_time).toLocaleString()}</td>
                  <td className="py-2.5">
                    {tx.from_account === id ? (
                      <span className="text-xs font-medium text-critical">OUTWARD</span>
                    ) : (
                      <span className="text-xs font-medium text-success">INWARD</span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-xs text-foreground">₹{Number(tx.amount).toLocaleString()}</td>
                  <td className="py-2.5"><ChannelBadge channel={tx.channel} /></td>
                  <td className="py-2.5 text-xs text-muted-foreground">{tx.geo_location || "—"}</td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert History */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Alert History</h2>
        <div className="space-y-2">
          {alerts?.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <SeverityBadge severity={alert.severity} />
                <div>
                  <p className="text-sm text-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">{alert.alert_type} · {new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          {(!alerts || alerts.length === 0) && (
            <p className="py-6 text-center text-sm text-muted-foreground">No alerts for this account</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountDetailPage;
