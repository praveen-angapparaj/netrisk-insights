import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RiskScoreGauge from "@/components/dashboard/RiskScoreGauge";
import { useAccounts } from "@/hooks/useAccounts";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const AccountsPage = () => {
  const { data: accounts, isLoading } = useAccounts();
  const [search, setSearch] = useState("");

  const filtered = accounts?.filter(
    (a) =>
      a.account_number.toLowerCase().includes(search.toLowerCase()) ||
      a.account_holder_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">Monitor and investigate account risk profiles</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account #</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Holder Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inward</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outward</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-40">Risk Score</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((account) => (
              <tr key={account.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3">
                  <Link to={`/accounts/${account.id}`} className="font-mono text-xs text-primary hover:underline">
                    {account.account_number}
                  </Link>
                </td>
                <td className="px-5 py-3 text-foreground">{account.account_holder_name}</td>
                <td className="px-5 py-3 text-muted-foreground capitalize">{account.account_type}</td>
                <td className="px-5 py-3 font-mono text-xs text-success">₹{Number(account.total_inward_amount).toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-xs text-critical">₹{Number(account.total_outward_amount).toLocaleString()}</td>
                <td className="px-5 py-3">
                  <RiskScoreGauge score={Number(account.risk_score)} />
                </td>
                <td className="px-5 py-3">
                  {account.is_flagged ? (
                    <span className="inline-flex items-center rounded-md border border-critical/20 bg-critical/10 px-2 py-0.5 text-[10px] font-bold uppercase text-critical">Flagged</span>
                  ) : account.dormant_flag ? (
                    <span className="inline-flex items-center rounded-md border border-warning/20 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">Dormant</span>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">Normal</span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && (!filtered || filtered.length === 0) && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No accounts found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AccountsPage;
