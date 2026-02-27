import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RiskScoreGauge from "@/components/dashboard/RiskScoreGauge";
import StatusBadge from "@/components/dashboard/StatusBadge";
import AIExplainabilityDrawer from "@/components/dashboard/AIExplainabilityDrawer";
import { useAccounts } from "@/hooks/useAccounts";
import { useAllTransactions } from "@/hooks/useTransactions";
import { useAlerts } from "@/hooks/useAlerts";
import { Search, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";

const generateIFSC = (idx: number) => {
  const banks = ["SBIN", "HDFC", "ICIC", "UTIB", "KKBK", "PUNB", "BKID", "CNRB"];
  return `${banks[idx % banks.length]}0${String(1000 + (idx * 7) % 9000).padStart(6, "0")}`;
};
const generatePAN = (name: string) => {
  const first = name.slice(0, 5).toUpperCase().replace(/[^A-Z]/g, "X").padEnd(5, "X");
  return `${first}****${String.fromCharCode(65 + (name.length % 26))}`;
};
const generateKYC = (riskScore: number) => {
  if (riskScore > 70) return "HIGH";
  if (riskScore > 40) return "MEDIUM";
  return "LOW";
};

const AccountsPage = () => {
  const { data: accounts, isLoading } = useAccounts();
  const { data: transactions } = useAllTransactions();
  const { data: alerts } = useAlerts();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerAccountId, setDrawerAccountId] = useState<string | null>(null);

  const filtered = accounts?.filter(
    (a) =>
      a.account_number.toLowerCase().includes(search.toLowerCase()) ||
      a.account_holder_name.toLowerCase().includes(search.toLowerCase())
  );

  const drawerAccount = accounts?.find((a) => a.id === drawerAccountId) || null;
  const drawerTxCount = transactions?.filter((tx) => tx.from_account === drawerAccountId || tx.to_account === drawerAccountId).length || 0;
  const drawerChannelCount = new Set(
    transactions?.filter((tx) => tx.from_account === drawerAccountId || tx.to_account === drawerAccountId).map((tx) => tx.channel) || []
  ).size;
  const drawerAlertCount = alerts?.filter((a) => a.account_id === drawerAccountId).length || 0;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">Monitor and investigate account risk profiles</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50 border-0 rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Account #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Holder Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">IFSC</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">PAN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">KYC Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Inward</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Outward</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-36">Risk Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">AI</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((account, idx) => {
                const kycRisk = generateKYC(Number(account.risk_score));
                return (
                  <tr key={account.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/accounts/${account.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
                        {account.account_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{account.account_holder_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{generateIFSC(idx)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{generatePAN(account.account_holder_name)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        kycRisk === "HIGH" ? "bg-critical/10 text-critical" : kycRisk === "MEDIUM" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                      }`}>
                        {kycRisk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{account.account_type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-success font-medium">₹{Number(account.total_inward_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-critical font-medium">₹{Number(account.total_outward_amount).toLocaleString()}</td>
                    <td className="px-4 py-3"><RiskScoreGauge score={Number(account.risk_score)} /></td>
                    <td className="px-4 py-3"><StatusBadge status={(account as any).status || "active"} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setDrawerAccountId(account.id); setDrawerOpen(true); }}
                        className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition-colors"
                        title="AI Risk Analysis"
                      >
                        <Brain className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && (!filtered || filtered.length === 0) && (
                <tr><td colSpan={11} className="py-12 text-center text-muted-foreground">No accounts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AIExplainabilityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        account={drawerAccount}
        transactionCount={drawerTxCount}
        channelCount={drawerChannelCount}
        alertCount={drawerAlertCount}
      />
    </DashboardLayout>
  );
};

export default AccountsPage;
