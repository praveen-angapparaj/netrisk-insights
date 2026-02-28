import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [autoBlockThreshold, setAutoBlockThreshold] = useState([85]);
  const [autoBlockEnabled, setAutoBlockEnabled] = useState(true);
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [confirmThreshold, setConfirmThreshold] = useState(false);
  const [pendingThreshold, setPendingThreshold] = useState<number | null>(null);

  const riskBoundaries = [
    { label: "Low Risk", range: "0 - 30%", color: "bg-success" },
    { label: "Medium Risk", range: "31 - 60%", color: "bg-warning" },
    { label: "High Risk", range: "61 - 80%", color: "bg-risk-high" },
    { label: "Critical Risk", range: "81 - 100%", color: "bg-critical" },
  ];

  const handleThresholdCommit = (val: number[]) => {
    setPendingThreshold(val[0]);
    setConfirmThreshold(true);
  };

  const confirmThresholdChange = () => {
    if (pendingThreshold !== null) {
      setAutoBlockThreshold([pendingThreshold]);
      toast.success(`Auto-block threshold updated to ${pendingThreshold}%`);
    }
    setConfirmThreshold(false);
    setPendingThreshold(null);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure risk thresholds, system controls, and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Thresholds */}
        <div className="rounded-2xl border border-border bg-card p-6 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-1">Risk Thresholds</h2>
          <p className="text-xs text-muted-foreground mb-5">Configure scoring boundaries and automated enforcement thresholds.</p>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Auto-Block Threshold</span>
              <span className="text-2xl font-bold font-mono text-foreground">{autoBlockThreshold[0]}%</span>
            </div>
            <Slider
              value={autoBlockThreshold}
              onValueChange={setAutoBlockThreshold}
              onValueCommit={handleThresholdCommit}
              min={60}
              max={95}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>60%</span>
              <span>95%</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Risk Boundaries</p>
            <div className="space-y-2.5">
              {riskBoundaries.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-sm ${b.color}`} />
                  <span className="text-xs text-foreground font-medium flex-1">{b.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{b.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Controls */}
        <div className="rounded-2xl border border-border bg-card p-6 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-1">System Controls</h2>
          <p className="text-xs text-muted-foreground mb-5">Manage detection engine behavior and notification preferences.</p>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-foreground">Auto-Block Engine</p>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically block accounts exceeding risk threshold.</p>
              </div>
              <Switch
                checked={autoBlockEnabled}
                onCheckedChange={(checked) => {
                  setAutoBlockEnabled(checked);
                  toast.success(checked ? "Auto-block engine enabled" : "Auto-block engine disabled");
                }}
              />
            </div>

            {!autoBlockEnabled && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
                <p className="text-xs text-warning font-medium">Auto-block is disabled. Accounts exceeding threshold will be placed under review instead.</p>
              </div>
            )}

            <div className="border-t border-border pt-5 flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Switch to dark theme for reduced eye strain.</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>

            <div className="border-t border-border pt-5 flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-foreground">Real-Time Alerts</p>
                <p className="text-xs text-muted-foreground mt-0.5">Show toast notifications for high-risk accounts.</p>
              </div>
              <Switch
                checked={realTimeAlerts}
                onCheckedChange={(checked) => {
                  setRealTimeAlerts(checked);
                  toast.success(checked ? "Real-time alerts enabled" : "Real-time alerts disabled");
                }}
              />
            </div>

            <div className="border-t border-border pt-5 flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">Send email alerts for critical risk events.</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  setEmailNotifications(checked);
                  toast.success(checked ? "Email notifications enabled" : "Email notifications disabled");
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmThreshold}
        onOpenChange={setConfirmThreshold}
        title="Update Auto-Block Threshold"
        description={`Changing this value to ${pendingThreshold}% will impact real-time blocking decisions. Proceed?`}
        confirmLabel="Confirm Change"
        onConfirm={confirmThresholdChange}
      />
    </DashboardLayout>
  );
};

export default SettingsPage;
