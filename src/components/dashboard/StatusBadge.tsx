const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success",
  blocked: "bg-critical/10 text-critical",
  investigating: "bg-warning/10 text-warning",
};

const StatusBadge = ({ status }: { status: string }) => {
  const style = statusStyles[status] || statusStyles.active;
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
