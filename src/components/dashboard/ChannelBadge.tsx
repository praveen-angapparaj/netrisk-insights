const channelStyles: Record<string, string> = {
  UPI: "bg-primary/10 text-primary border-primary/20",
  ATM: "bg-warning/10 text-warning border-warning/20",
  NET_BANKING: "bg-info/10 text-info border-info/20",
  MOBILE_BANKING: "bg-success/10 text-success border-success/20",
  BRANCH: "bg-muted text-muted-foreground border-border",
};

const ChannelBadge = ({ channel }: { channel: string }) => {
  const style = channelStyles[channel] || channelStyles.BRANCH;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style}`}>
      {channel.replace("_", " ")}
    </span>
  );
};

export default ChannelBadge;
