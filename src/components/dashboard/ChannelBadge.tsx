const channelStyles: Record<string, string> = {
  UPI: "bg-primary/10 text-primary",
  ATM: "bg-warning/10 text-warning",
  NET_BANKING: "bg-info/10 text-info",
  MOBILE_BANKING: "bg-success/10 text-success",
  BRANCH: "bg-secondary text-muted-foreground",
};

const ChannelBadge = ({ channel }: { channel: string }) => {
  const style = channelStyles[channel] || channelStyles.BRANCH;
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${style}`}>
      {channel.replace("_", " ")}
    </span>
  );
};

export default ChannelBadge;
