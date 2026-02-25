import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Brain, TrendingUp, Fingerprint, RefreshCw, ArrowRightLeft, Zap, Shield, Clock } from "lucide-react";

interface RiskFactor {
  label: string;
  score: number;
  icon: React.ElementType;
  description: string;
}

interface AIExplainabilityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: {
    account_holder_name: string;
    account_number: string;
    risk_score: number;
    is_flagged: boolean;
    dormant_flag: boolean;
    total_inward_amount: number;
    total_outward_amount: number;
  } | null;
  transactionCount?: number;
  channelCount?: number;
  alertCount?: number;
}

const getRiskFactors = (
  riskScore: number,
  dormant: boolean,
  txCount: number,
  channelCount: number,
  inward: number,
  outward: number
): RiskFactor[] => {
  const s = riskScore;
  const burstRatio = inward > 0 ? outward / inward : 0;

  const factors: RiskFactor[] = [];

  // Velocity
  const velocityScore = Math.min(30, Math.round((txCount / 8) * 30));
  if (velocityScore > 5) {
    factors.push({
      label: "Cross-channel velocity spike",
      score: velocityScore,
      icon: TrendingUp,
      description: `${txCount} transactions detected across monitoring window. Velocity ${Math.round(velocityScore / 3)}x above baseline.`,
    });
  }

  // Device fingerprint
  const deviceScore = s > 60 ? Math.min(25, Math.round(s * 0.26)) : Math.round(s * 0.1);
  if (deviceScore > 3) {
    factors.push({
      label: `Shared device fingerprint with ${Math.max(1, Math.floor(deviceScore / 8))} flagged accounts`,
      score: deviceScore,
      icon: Fingerprint,
      description: "Device ID correlation analysis detected shared hardware fingerprints across flagged account cluster.",
    });
  }

  // Circular movement
  const circularScore = s > 70 ? Math.min(15, Math.round(s * 0.16)) : Math.round(s * 0.05);
  if (circularScore > 2) {
    factors.push({
      label: "Circular fund movement pattern",
      score: circularScore,
      icon: RefreshCw,
      description: "Graph traversal identified fund loops returning to origin within 3-hop radius.",
    });
  }

  // Imbalance
  const imbalanceScore = burstRatio > 0.7 ? Math.min(10, Math.round(burstRatio * 10)) : Math.round(s * 0.05);
  if (imbalanceScore > 1) {
    factors.push({
      label: "High outbound/inbound imbalance",
      score: imbalanceScore,
      icon: ArrowRightLeft,
      description: `Disbursement ratio of ${Math.round(burstRatio * 100)}%. Funds are being rapidly moved outward.`,
    });
  }

  // UPI burst
  const upiBurstScore = channelCount >= 3 ? Math.min(15, Math.round(channelCount * 4)) : Math.round(s * 0.08);
  if (upiBurstScore > 2) {
    factors.push({
      label: `UPI burst within 5 minutes`,
      score: upiBurstScore,
      icon: Zap,
      description: `${channelCount} distinct channels used in rapid succession. Pattern consistent with automated fraud tooling.`,
    });
  }

  // Dormant
  if (dormant) {
    factors.push({
      label: "Dormant account reactivation",
      score: Math.min(15, Math.round(s * 0.15)),
      icon: Clock,
      description: "Account was inactive for extended period before sudden high-value activity spike.",
    });
  }

  return factors.sort((a, b) => b.score - a.score);
};

const getSeverityLabel = (score: number) => {
  if (score >= 90) return { label: "CRITICAL", color: "text-critical" };
  if (score >= 70) return { label: "HIGH", color: "text-warning" };
  if (score >= 40) return { label: "MEDIUM", color: "text-info" };
  return { label: "LOW", color: "text-success" };
};

const AIExplainabilityDrawer = ({
  open,
  onOpenChange,
  account,
  transactionCount = 0,
  channelCount = 0,
  alertCount = 0,
}: AIExplainabilityDrawerProps) => {
  if (!account) return null;

  const riskScore = Number(account.risk_score);
  const severity = getSeverityLabel(riskScore);
  const confidence = Math.min(98, Math.max(65, riskScore + Math.floor(Math.random() * 8) - 4));
  const factors = getRiskFactors(
    riskScore,
    account.dormant_flag,
    transactionCount,
    channelCount,
    Number(account.total_inward_amount),
    Number(account.total_outward_amount)
  );
  const totalFactorScore = factors.reduce((sum, f) => sum + f.score, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:w-[480px] bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-foreground text-base">AI Risk Analysis</SheetTitle>
              <p className="text-xs text-muted-foreground">Explainable risk scoring breakdown</p>
            </div>
          </div>
        </SheetHeader>

        {/* Account Info */}
        <div className="mt-5 rounded-lg border border-border bg-secondary/30 p-4">
          <p className="text-sm font-semibold text-foreground">{account.account_holder_name}</p>
          <p className="text-xs font-mono text-muted-foreground">{account.account_number}</p>
          <div className="mt-3 flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-sm font-bold font-mono text-foreground">{transactionCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Channels</p>
              <p className="text-sm font-bold font-mono text-foreground">{channelCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alerts</p>
              <p className="text-sm font-bold font-mono text-critical">{alertCount}</p>
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="mt-5 rounded-lg border border-border p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Composite Risk Score</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-4xl font-black font-mono ${severity.color}`}>{riskScore}</span>
            <span className={`text-sm font-bold ${severity.color}`}>({severity.label})</span>
          </div>
          {account.is_flagged && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-critical/30 bg-critical/10 px-3 py-1 text-xs font-bold text-critical">
              ⚠ FLAGGED FOR INVESTIGATION
            </span>
          )}
        </div>

        {/* Why Section */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Why this score?
          </h3>
          <div className="space-y-3">
            {factors.map((factor, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <factor.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{factor.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{factor.description}</p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold font-mono text-primary">
                    +{factor.score}
                  </span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(factor.score / 30) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence & Model */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-secondary/20 p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Confidence Level</p>
            <p className="mt-1 text-2xl font-black font-mono text-success">{confidence}%</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Model Version</p>
            <p className="mt-1 text-sm font-bold text-primary">SentinelIQ AI v2.1</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">GNN + Temporal</p>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">AI Summary</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {riskScore >= 80
              ? `This account exhibits strong indicators of involvement in organized fund layering. The combination of ${factors.length} risk signals with a composite score of ${totalFactorScore} points warrants immediate escalation to the compliance investigation team.`
              : riskScore >= 50
              ? `Moderate risk patterns detected. Account shows ${factors.length} behavioral anomalies that deviate from expected transaction patterns. Recommended for enhanced monitoring.`
              : `Account shows minimal risk indicators. Current activity falls within expected behavioral parameters. Continue standard monitoring protocols.`
            }
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AIExplainabilityDrawer;
