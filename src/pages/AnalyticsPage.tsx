import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAccounts } from "@/hooks/useAccounts";
import { useAllTransactions } from "@/hooks/useTransactions";
import { useAlerts } from "@/hooks/useAlerts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from "recharts";

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid hsl(220,13%,91%)",
  borderRadius: "12px",
  color: "hsl(220,30%,15%)",
  fontSize: "12px",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06)",
};

const axisTickStyle = { fill: "hsl(220,10%,50%)", fontSize: 11 };

const AnalyticsPage = () => {
  const { data: accounts } = useAccounts();
  const { data: transactions } = useAllTransactions();
  const { data: alerts } = useAlerts();

  // Risk distribution
  const riskBuckets = [
    { range: "0-20", count: 0, color: "hsl(152,69%,41%)" },
    { range: "21-40", count: 0, color: "hsl(152,69%,41%)" },
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

  // Fraud trend
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

  // Cross-channel correlation
  const channelPairs: Record<string, number> = {};
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

  // Device sharing clusters
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskBuckets}>
              <XAxis dataKey="range" tick={axisTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {riskBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Fraud Trend Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={fraudTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="hour" tick={axisTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="alerts" stroke="hsl(0,72%,51%)" fill="hsl(0,72%,51%)" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Transaction Volume (Last 24h)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="hour" tick={axisTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="hsl(217,91%,55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Cross-Channel Correlation</h2>
          {correlationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={correlationData} layout="vertical">
                <XAxis type="number" tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="pair" tick={{ ...axisTickStyle, fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(205,84%,52%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Fraud Propagation</h2>
          <div className="space-y-4">
            {[
              { label: "Flagged Accounts", value: flaggedCount, color: "text-critical" },
              { label: "Dormant Reactivated", value: dormantCount, color: "text-warning" },
              { label: "Total Accounts", value: accounts?.length || 0, color: "text-foreground" },
              { label: "Flag Rate", value: `${accounts?.length ? ((flaggedCount / accounts.length) * 100).toFixed(1) : 0}%`, color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Device-Sharing Clusters</h2>
          {clusterSizes.length > 0 ? (
            <div className="space-y-2.5">
              {clusterSizes.map((c) => {
                const maxAccounts = clusterSizes[0].accounts;
                const pct = (c.accounts / maxAccounts) * 100;
                return (
                  <div key={c.device} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-muted-foreground font-mono truncate">{c.device}</span>
                    <div className="flex-1 h-3 rounded-full bg-secondary relative overflow-hidden">
                      <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-xs text-foreground w-6 text-right font-medium">{c.accounts}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No shared devices</div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-4">Geo-Risk Distribution</h2>
          {geoData.length > 0 ? (
            <div className="space-y-2.5">
              {geoData.map((g, idx) => {
                const maxCount = geoData[0].count;
                const pct = (g.count / maxCount) * 100;
                return (
                  <div key={g.city} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-muted-foreground truncate">{g.city}</span>
                    <div className="flex-1 h-3 rounded-full bg-secondary relative overflow-hidden">
                      <div className="h-full rounded-full transition-all bg-primary" style={{ width: `${pct}%`, opacity: 1 - idx * 0.08 }} />
                    </div>
                    <span className="font-mono text-xs text-foreground w-8 text-right font-medium">{g.count}</span>
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
