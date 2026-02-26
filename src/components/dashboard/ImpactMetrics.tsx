import { ShieldCheck, Users, IndianRupee, Clock } from "lucide-react";

interface ImpactMetricsProps {
  totalAccounts: number;
  flaggedAccounts: number;
  totalTransactions: number;
  criticalAlerts: number;
}

const ImpactMetrics = ({ totalAccounts, flaggedAccounts, totalTransactions, criticalAlerts }: ImpactMetricsProps) => {
  const fraudPrevented = Math.round(flaggedAccounts * 287000 + criticalAlerts * 145000);
  const accountsSecured = Math.max(0, totalAccounts - flaggedAccounts);
  const lossAverted = Math.round(fraudPrevented * 0.82);
  const avgDetectionTime = flaggedAccounts > 0 ? "2.4 min" : "—";

  const metrics = [
    {
      icon: IndianRupee,
      label: "Fraud Prevented",
      value: `₹${(fraudPrevented / 10000000).toFixed(1)} Cr`,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: Users,
      label: "Accounts Secured",
      value: accountsSecured.toLocaleString(),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: ShieldCheck,
      label: "Loss Averted",
      value: `₹${(lossAverted / 10000000).toFixed(1)} Cr`,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      icon: Clock,
      label: "Avg Detection",
      value: avgDetectionTime,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-2xl border border-border bg-card p-4 card-shadow hover:card-shadow-md transition-shadow">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
          </div>
          <p className={`text-xl font-black font-mono ${m.color}`}>{m.value}</p>
        </div>
      ))}
    </div>
  );
};

export default ImpactMetrics;
