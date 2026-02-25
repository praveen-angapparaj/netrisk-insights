const severityStyles: Record<string, string> = {
  LOW: "bg-success/10 text-success border-success/20",
  MEDIUM: "bg-warning/10 text-warning border-warning/20",
  HIGH: "bg-risk-high/10 text-risk-high border-risk-high/20",
  CRITICAL: "bg-critical/10 text-critical border-critical/20",
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const style = severityStyles[severity] || severityStyles.LOW;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
