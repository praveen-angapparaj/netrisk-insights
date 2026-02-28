import { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAccounts } from "@/hooks/useAccounts";
import { useAlerts } from "@/hooks/useAlerts";
import { FileText, Download, Users, ShieldAlert, Ban, Search, AlertTriangle, Activity, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReportsPage = () => {
  const { data: accounts } = useAccounts();
  const { data: alerts } = useAlerts();

  const stats = useMemo(() => {
    if (!accounts || !alerts) return null;
    const totalAccounts = accounts.length;
    const highRisk = accounts.filter((a) => Number(a.risk_score) > 70).length;
    const criticalRisk = accounts.filter((a) => Number(a.risk_score) > 85).length;
    const blocked = accounts.filter((a) => (a as any).status === "blocked").length;
    const investigating = accounts.filter((a) => (a as any).status === "investigating").length;
    const confirmedMules = accounts.filter((a) => (a as any).status === "blocked" && Number(a.risk_score) > 85).length;
    const suspectedMules = accounts.filter((a) => a.is_flagged && (a as any).status !== "blocked").length;
    const totalAlerts = alerts.length;
    const todayAlerts = alerts.filter((a) => {
      const d = new Date(a.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;
    const todayBlocked = accounts.filter((a) => (a as any).status === "blocked").length;

    return {
      totalAccounts, highRisk, criticalRisk, blocked, investigating,
      confirmedMules, suspectedMules, totalAlerts, todayAlerts, todayBlocked,
    };
  }, [accounts, alerts]);

  const exportCSV = (type: string) => {
    let csvContent = "";
    let filename = "";

    if (type === "daily" && accounts && alerts) {
      const todayAlerts = alerts.filter((a) => new Date(a.created_at).toDateString() === new Date().toDateString());
      csvContent = "Alert ID,Account ID,Alert Type,Severity,Created At\n";
      todayAlerts.forEach((a) => {
        csvContent += `${a.id},${a.account_id},${a.alert_type},${a.severity},${a.created_at}\n`;
      });
      filename = `netrisk_daily_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === "high-risk" && accounts) {
      csvContent = "Account ID,Account Number,Holder Name,Risk Score,Status,Flagged\n";
      accounts.filter((a) => Number(a.risk_score) > 70).forEach((a) => {
        csvContent += `${a.id},${a.account_number},${a.account_holder_name},${a.risk_score},${(a as any).status || "active"},${a.is_flagged}\n`;
      });
      filename = `netrisk_high_risk_accounts_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === "blocked" && accounts) {
      csvContent = "Account ID,Account Number,Holder Name,Risk Score,Status\n";
      accounts.filter((a) => (a as any).status === "blocked").forEach((a) => {
        csvContent += `${a.id},${a.account_number},${a.account_holder_name},${a.risk_score},blocked\n`;
      });
      filename = `netrisk_blocked_accounts_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === "alerts" && alerts) {
      csvContent = "Alert ID,Account ID,Alert Type,Severity,Description,Created At\n";
      alerts.forEach((a) => {
        csvContent += `${a.id},${a.account_id},${a.alert_type},${a.severity},"${(a.description || "").replace(/"/g, '""')}",${a.created_at}\n`;
      });
      filename = `netrisk_full_alerts_log_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const reportCards = [
    {
      title: "Daily Fraud Summary",
      description: `${stats?.todayAlerts ?? 0} high-risk accounts detected today. ${stats?.todayBlocked ?? 0} accounts blocked.`,
      icon: FileText,
      exportKey: "daily",
    },
    {
      title: "High Risk Account Report",
      description: "Detailed breakdown of accounts scoring above the risk threshold.",
      icon: ShieldAlert,
      exportKey: "high-risk",
    },
    {
      title: "Blocked Accounts Report",
      description: "Accounts currently blocked with reasons and timestamps.",
      icon: Ban,
      exportKey: "blocked",
    },
    {
      title: "Full Alerts Log",
      description: "All alerts across categories with complete action history.",
      icon: AlertTriangle,
      exportKey: "alerts",
    },
  ];

  const summaryMetrics = [
    { label: "Total Accounts Monitored", value: stats?.totalAccounts ?? 0, icon: Users },
    { label: "High / Critical Risk", value: `${stats?.highRisk ?? 0} / ${stats?.criticalRisk ?? 0}`, icon: ShieldAlert },
    { label: "Currently Blocked", value: stats?.blocked ?? 0, icon: Ban },
    { label: "Under Review", value: stats?.investigating ?? 0, icon: Search },
    { label: "Confirmed Mules", value: stats?.confirmedMules ?? 0, icon: Shield },
    { label: "Suspected Mules", value: stats?.suspectedMules ?? 0, icon: Activity },
    { label: "Total Alerts", value: stats?.totalAlerts ?? 0, icon: AlertTriangle },
    { label: "Auto-block Actions", value: stats?.todayBlocked ?? 0, icon: CheckCircle },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Compliance and audit reporting for mule-risk activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {reportCards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-xs h-8"
                onClick={() => exportCSV(card.exportKey)}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
        <h2 className="text-sm font-semibold text-foreground mb-4">Summary Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryMetrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">{metric.label}</span>
              </div>
              <p className="text-xl font-bold font-mono text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
