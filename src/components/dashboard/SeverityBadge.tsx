const severityStyles: Record<string, string> = {
  LOW: "bg-success/10 text-success",
  MEDIUM: "bg-warning/10 text-warning",
  HIGH: "bg-risk-high/10 text-risk-high",
  CRITICAL: "bg-critical/10 text-critical",
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const style = severityStyles[severity] || severityStyles.LOW;
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
