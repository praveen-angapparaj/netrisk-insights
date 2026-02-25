import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAccounts } from "@/hooks/useAccounts";
import { useAllTransactions } from "@/hooks/useTransactions";
import { useAlerts } from "@/hooks/useAlerts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from "recharts";

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
  const { data: alerts } = useAlerts();

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

  // Fraud trend over time (alerts by hour)
  const alertsByHour: Record<string, number> = {};
  alerts?.forEach((a) => {
    const hour = new Date(a.created_at).toISOString().slice(0, 13);
    alertsByHour[hour] = (alertsByHour[hour] || 0) + 1;
  });
  const fraudTrendData = Object.entries(alertsByHour)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([hour, count]) => ({ hour: hour.slice(11) + ":00", alerts: count }));

  // Transaction volume
  const hourlyVolume: Record<string, number> = {};
  transactions?.forEach((tx) => {
    const hour = new Date(tx.transaction_time).toISOString().slice(0, 13);
    hourlyVolume[hour] = (hourlyVolume[hour] || 0) + 1;
  });
  const volumeData = Object.entries(hourlyVolume)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([hour, count]) => ({ hour: hour.slice(11) + ":00", count }));

  // Cross-channel correlation matrix
  const channelPairs: Record<string, number> = {};
  const channels = ["UPI", "ATM", "NET_BANKING", "MOBILE_BANKING", "BRANCH"];
  if (transactions) {
    const accountChannels: Record<string, Set<string>> = {};
    transactions.forEach((tx) => {
      if (!accountChannels[tx.from_account]) accountChannels[tx.from_account] = new Set();
      accountChannels[tx.from_account].add(tx.channel);
    });
    Object.values(accountChannels).forEach((chs) => {
      const arr = [...chs];
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const key = [arr[i], arr[j]].sort().join("-");
          channelPairs[key] = (channelPairs[key] || 0) + 1;
        }
      }
    });
  }
  const correlationData = Object.entries(channelPairs)
    .map(([pair, count]) => ({ pair: pair.replace(/_/g, " ").replace("BANKING", "BK"), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Device sharing cluster sizes
  const deviceAccounts: Record<string, Set<string>> = {};
  transactions?.forEach((tx) => {
    if (tx.device_id) {
      if (!deviceAccounts[tx.device_id]) deviceAccounts[tx.device_id] = new Set();
      deviceAccounts[tx.device_id].add(tx.from_account);
      deviceAccounts[tx.device_id].add(tx.to_account);
    }
  });
  const clusterSizes = Object.entries(deviceAccounts)
    .filter(([, accts]) => accts.size > 1)
    .map(([device, accts]) => ({ device: device.slice(0, 10), accounts: accts.size }))
    .sort((a, b) => b.accounts - a.accounts)
    .slice(0, 10);

  // Geo distribution
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

  const flaggedCount = accounts?.filter((a) => a.is_flagged).length || 0;
  const dormantCount = accounts?.filter((a) => a.dormant_flag).length || 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Advanced Analytics</h1>
        <p className="text-sm text-muted-foreground">Data-science grade fraud pattern analysis</p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskBuckets}>
              <XAxis dataKey="range" tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {riskBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">🔥 Fraud Trend Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={fraudTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,16%)" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="alerts" stroke="hsl(0,72%,51%)" fill="hsl(0,72%,51%)" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Cross-Channel Correlation</h2>
          {correlationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={correlationData} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="pair" tick={{ fill: "hsl(215,20%,55%)", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(199,89%,48%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <span className="text-lg font-bold text-primary font-mono">{accounts?.length ? ((flaggedCount / accounts.length) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Device Sharing Clusters */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Device-Sharing Clusters</h2>
          {clusterSizes.length > 0 ? (
            <div className="space-y-2">
              {clusterSizes.map((c) => {
                const maxAccounts = clusterSizes[0].accounts;
                const pct = (c.accounts / maxAccounts) * 100;
                return (
                  <div key={c.device} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-muted-foreground font-mono truncate">{c.device}</span>
                    <div className="flex-1 h-4 rounded bg-secondary relative overflow-hidden">
                      <div className="h-full rounded bg-warning transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-xs text-foreground w-6 text-right">{c.accounts}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No shared devices</div>
          )}
        </div>

        {/* Geo Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Geo-Risk Distribution</h2>
          {geoData.length > 0 ? (
            <div className="space-y-2">
              {geoData.map((g, idx) => {
                const maxCount = geoData[0].count;
                const pct = (g.count / maxCount) * 100;
                return (
                  <div key={g.city} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-muted-foreground truncate">{g.city}</span>
                    <div className="flex-1 h-4 rounded bg-secondary relative overflow-hidden">
                      <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: `hsl(${Math.max(0, 217 - idx * 20)},${Math.max(50, 91 - idx * 5)}%,60%)` }} />
                    </div>
                    <span className="font-mono text-xs text-foreground w-8 text-right">{g.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No geo data</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
