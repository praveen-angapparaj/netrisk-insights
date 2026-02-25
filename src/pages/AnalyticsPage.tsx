import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAccounts } from "@/hooks/useAccounts";
import { useAllTransactions } from "@/hooks/useTransactions";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(222,44%,10%)",
  border: "1px solid hsl(222,30%,16%)",
  borderRadius: "8px",
  color: "hsl(210,40%,93%)",
  fontSize: "12px",
};

const AnalyticsPage = () => {
  const { data: accounts } = useAccounts();
  const { data: transactions } = useAllTransactions();

  // Risk distribution
  const riskBuckets = [
    { range: "0-20", count: 0, color: "hsl(142,71%,45%)" },
    { range: "21-40", count: 0, color: "hsl(142,71%,45%)" },
    { range: "41-60", count: 0, color: "hsl(38,92%,50%)" },
    { range: "61-80", count: 0, color: "hsl(25,95%,53%)" },
    { range: "81-100", count: 0, color: "hsl(0,72%,51%)" },
  ];
  accounts?.forEach((a) => {
    const s = Number(a.risk_score);
    if (s <= 20) riskBuckets[0].count++;
    else if (s <= 40) riskBuckets[1].count++;
    else if (s <= 60) riskBuckets[2].count++;
    else if (s <= 80) riskBuckets[3].count++;
    else riskBuckets[4].count++;
  });

  // Transaction volume over time (hourly bins)
  const hourlyVolume: Record<string, number> = {};
  transactions?.forEach((tx) => {
    const hour = new Date(tx.transaction_time).toISOString().slice(0, 13);
    hourlyVolume[hour] = (hourlyVolume[hour] || 0) + 1;
  });
  const volumeData = Object.entries(hourlyVolume)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([hour, count]) => ({ hour: hour.slice(11) + ":00", count }));

  // Layering depth: how many accounts form chains
  const flaggedCount = accounts?.filter((a) => a.is_flagged).length || 0;
  const dormantCount = accounts?.filter((a) => a.dormant_flag).length || 0;

  // Geographic distribution
  const geoMap: Record<string, number> = {};
  transactions?.forEach((tx) => {
    if (tx.geo_location) {
      const city = tx.geo_location.split(",")[0].trim();
      geoMap[city] = (geoMap[city] || 0) + 1;
    }
  });
  const geoData = Object.entries(geoMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Advanced fraud pattern analysis and heat maps</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Risk Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskBuckets}>
              <XAxis dataKey="range" tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {riskBuckets.map((b, i) => (
                  <Cell key={i} fill={b.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Volume */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Transaction Volume (Last 24h)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,16%)" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="hsl(217,91%,60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Propagation Metrics */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Fraud Propagation</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Flagged Accounts</span>
              <span className="text-lg font-bold text-critical font-mono">{flaggedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dormant Reactivated</span>
              <span className="text-lg font-bold text-warning font-mono">{dormantCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Accounts</span>
              <span className="text-lg font-bold text-foreground font-mono">{accounts?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Flag Rate</span>
              <span className="text-lg font-bold text-primary font-mono">
                {accounts?.length ? ((flaggedCount / accounts.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Heat Map - Geographic Distribution */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Transaction Heat Map (By Location)</h2>
          {geoData.length > 0 ? (
            <div className="space-y-2">
              {geoData.map((g, idx) => {
                const maxCount = geoData[0].count;
                const pct = (g.count / maxCount) * 100;
                return (
                  <div key={g.city} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-muted-foreground truncate">{g.city}</span>
                    <div className="flex-1 h-5 rounded bg-secondary relative overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, hsl(217,91%,60%), hsl(${Math.max(0, 217 - idx * 20)},${Math.max(50, 91 - idx * 5)}%,${Math.min(70, 60 + idx * 2)}%))`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-foreground w-8 text-right">{g.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No geo data available</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
