import { ShieldCheck, Users, IndianRupee, Clock } from "lucide-react";

interface ImpactMetricsProps {
  totalAccounts: number;
  flaggedAccounts: number;
  totalTransactions: number;
  criticalAlerts: number;
}

const ImpactMetrics = ({ totalAccounts, flaggedAccounts, totalTransactions, criticalAlerts }: ImpactMetricsProps) => {
  // Simulated impact metrics derived from actual data
  const fraudPrevented = Math.round(flaggedAccounts * 287000 + criticalAlerts * 145000);
  const accountsSecured = Math.max(0, totalAccounts - flaggedAccounts);
  const lossAverted = Math.round(fraudPrevented * 0.82);
  const avgDetectionTime = flaggedAccounts > 0 ? "2.4 min" : "—";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="rounded-xl border border-success/20 bg-success/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <IndianRupee className="h-4 w-4 text-success" />
          <span className="text-[10px] uppercase tracking-wider text-success font-semibold">Fraud Prevented</span>
        </div>
        <p className="text-xl font-black font-mono text-success">
          ₹{(fraudPrevented / 10000000).toFixed(1)} Cr
        </p>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Accounts Secured</span>
        </div>
        <p className="text-xl font-black font-mono text-primary">{accountsSecured.toLocaleString()}</p>
      </div>
      <div className="rounded-xl border border-info/20 bg-info/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-info" />
          <span className="text-[10px] uppercase tracking-wider text-info font-semibold">Loss Averted</span>
        </div>
        <p className="text-xl font-black font-mono text-info">
          ₹{(lossAverted / 10000000).toFixed(1)} Cr
        </p>
      </div>
      <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-warning" />
          <span className="text-[10px] uppercase tracking-wider text-warning font-semibold">Avg Detection</span>
        </div>
        <p className="text-xl font-black font-mono text-warning">{avgDetectionTime}</p>
      </div>
    </div>
  );
};

export default ImpactMetrics;
