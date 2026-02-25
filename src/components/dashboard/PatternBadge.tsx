interface PatternBadgeProps {
  pattern: string;
}

const PATTERN_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  "Mule Chain Detected": { bg: "bg-critical/15 border-critical/30", text: "text-critical", icon: "🔗" },
  "Circular Laundering Loop": { bg: "bg-warning/15 border-warning/30", text: "text-warning", icon: "🔄" },
  "Velocity Cluster": { bg: "bg-info/15 border-info/30", text: "text-info", icon: "⚡" },
  "Shared KYC Cluster": { bg: "bg-primary/15 border-primary/30", text: "text-primary", icon: "🧩" },
  "Dormant Reactivation": { bg: "bg-warning/15 border-warning/30", text: "text-warning", icon: "💤" },
};

const PatternBadge = ({ pattern }: PatternBadgeProps) => {
  const style = PATTERN_STYLES[pattern] || PATTERN_STYLES["Velocity Cluster"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
      {style.icon} {pattern}
    </span>
  );
};

export default PatternBadge;
