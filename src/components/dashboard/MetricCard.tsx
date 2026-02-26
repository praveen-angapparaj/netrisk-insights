import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "danger" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "bg-card border-border",
  danger: "bg-card border-border",
  success: "bg-card border-border",
  warning: "bg-card border-border",
  info: "bg-card border-border",
};

const iconVariants = {
  default: "bg-primary/10 text-primary",
  danger: "bg-critical/10 text-critical",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border p-5 card-shadow hover:card-shadow-md transition-shadow duration-300 ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && trendValue && (
            <p className={`text-xs font-semibold ${trend === "up" ? "text-critical" : "text-success"}`}>
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconVariants[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
