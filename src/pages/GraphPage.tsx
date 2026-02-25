import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAccounts } from "@/hooks/useAccounts";
import { useAllTransactions } from "@/hooks/useTransactions";
import cytoscape from "cytoscape";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const CHANNEL_EDGE_COLORS: Record<string, string> = {
  UPI: "#3B82F6",
  ATM: "#F59E0B",
  NET_BANKING: "#0EA5E9",
  MOBILE_BANKING: "#22C55E",
  BRANCH: "#6B7280",
};

const GraphPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { data: accounts } = useAccounts();
  const { data: transactions } = useAllTransactions();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pick default: highest risk flagged account
  const defaultAccountId = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    const flagged = accounts.filter((a) => a.is_flagged);
    const pool = flagged.length > 0 ? flagged : accounts;
    return pool.reduce((best, a) => (Number(a.risk_score) > Number(best.risk_score) ? a : best), pool[0]).id;
  }, [accounts]);

  const activeAccountId = selectedAccountId ?? defaultAccountId;

  // Accounts involved with the selected account
  const { involvedAccountIds, relevantTransactions } = useMemo(() => {
    if (!activeAccountId || !transactions) return { involvedAccountIds: new Set<string>(), relevantTransactions: [] };
    const relevant = transactions.filter(
      (tx) => tx.from_account === activeAccountId || tx.to_account === activeAccountId
    );
    const ids = new Set<string>();
    ids.add(activeAccountId);
    relevant.forEach((tx) => {
      ids.add(tx.from_account);
      ids.add(tx.to_account);
    });
    return { involvedAccountIds: ids, relevantTransactions: relevant };
  }, [activeAccountId, transactions]);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    if (!searchTerm) return accounts;
    const lower = searchTerm.toLowerCase();
    return accounts.filter(
      (a) =>
        a.account_holder_name.toLowerCase().includes(lower) ||
        a.account_number.includes(searchTerm)
    );
  }, [accounts, searchTerm]);

  const buildGraph = useCallback(() => {
    if (!containerRef.current || !accounts || !transactions || !activeAccountId) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [];

    const graphAccounts = accounts.filter((a) => involvedAccountIds.has(a.id));

    graphAccounts.forEach((account) => {
      elements.push({
        data: {
          id: account.id,
          label: account.account_holder_name.split(" ")[0] + "\n" + account.account_number.slice(-6),
          name: account.account_holder_name,
          riskScore: Number(account.risk_score),
          isFlagged: account.is_flagged,
          isCenter: account.id === activeAccountId,
        },
      });
    });

    const edgeMap = new Map<string, { channel: string; amount: number; count: number }>();
    relevantTransactions.forEach((tx) => {
      const key = `${tx.from_account}::${tx.to_account}`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.amount += Number(tx.amount);
        existing.count += 1;
      } else {
        edgeMap.set(key, { channel: tx.channel, amount: Number(tx.amount), count: 1 });
      }
    });

    edgeMap.forEach((val, key) => {
      const [source, target] = key.split("::");
      elements.push({
        data: {
          id: `e-${key}`,
          source,
          target,
          channel: val.channel,
          amount: val.amount,
          count: val.count,
        },
      });
    });

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#3B82F6",
            color: "#E2E8F0",
            "font-size": "9px",
            "text-valign": "bottom",
            "text-margin-y": 8,
            "text-wrap": "wrap",
            "text-max-width": "80px",
            width: 30,
            height: 30,
            "border-width": 2,
            "border-color": "#1E3A5F",
            "font-family": "JetBrains Mono, monospace",
          },
        },
        {
          selector: "node[?isCenter]",
          style: {
            "background-color": "#8B5CF6",
            "border-color": "#6D28D9",
            width: 50,
            height: 50,
            "border-width": 4,
            "font-size": "11px",
          },
        },
        {
          selector: "node[?isFlagged]",
          style: {
            "background-color": "#EF4444",
            "border-color": "#991B1B",
            width: 40,
            height: 40,
            "border-width": 3,
          },
        },
        {
          selector: "node[?isFlagged][?isCenter]",
          style: {
            "background-color": "#EF4444",
            "border-color": "#8B5CF6",
            width: 50,
            height: 50,
            "border-width": 5,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#334155",
            "target-arrow-color": "#334155",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.8,
            opacity: 0.6,
          },
        },
        {
          selector: "edge[channel='UPI']",
          style: { "line-color": "#3B82F6", "target-arrow-color": "#3B82F6" },
        },
        {
          selector: "edge[channel='ATM']",
          style: { "line-color": "#F59E0B", "target-arrow-color": "#F59E0B" },
        },
        {
          selector: "edge[channel='NET_BANKING']",
          style: { "line-color": "#0EA5E9", "target-arrow-color": "#0EA5E9" },
        },
        {
          selector: "edge[channel='MOBILE_BANKING']",
          style: { "line-color": "#22C55E", "target-arrow-color": "#22C55E" },
        },
      ],
      layout: {
        name: "concentric",
        concentric: (node: any) => (node.data("isCenter") ? 10 : 1),
        levelWidth: () => 1,
        padding: 50,
        animate: true,
        animationDuration: 600,
      },
      minZoom: 0.3,
      maxZoom: 3,
    });

    // Click node to switch focus
    cyRef.current.on("tap", "node", (e) => {
      const nodeId = e.target.id();
      if (nodeId !== activeAccountId) {
        setSelectedAccountId(nodeId);
      }
    });

    cyRef.current.on("mouseover", "node", (e) => {
      const node = e.target;
      node.style("border-width", 5);
    });
    cyRef.current.on("mouseout", "node", (e) => {
      const node = e.target;
      const isCenter = node.data("isCenter");
      const isFlagged = node.data("isFlagged");
      node.style("border-width", isCenter ? (isFlagged ? 5 : 4) : isFlagged ? 3 : 2);
    });
  }, [accounts, transactions, activeAccountId, involvedAccountIds, relevantTransactions]);

  useEffect(() => {
    buildGraph();
    return () => {
      if (cyRef.current) cyRef.current.destroy();
    };
  }, [buildGraph]);

  const activeAccount = accounts?.find((a) => a.id === activeAccountId);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Transaction Network Graph</h1>
        <p className="text-sm text-muted-foreground">Select an account to view its transaction network</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Account selector sidebar */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-4 max-h-[700px] flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-1">
            {filteredAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  account.id === activeAccountId
                    ? "bg-primary/20 border border-primary/40"
                    : "hover:bg-secondary/40 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium truncate">{account.account_holder_name}</span>
                  {account.is_flagged && <span className="h-2 w-2 rounded-full bg-critical flex-shrink-0" />}
                </div>
                <span className="text-xs text-muted-foreground font-mono">{account.account_number.slice(-6)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Graph area */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          {activeAccount && (
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm font-semibold text-foreground">{activeAccount.account_holder_name}</span>
                  <span className="ml-2 text-xs text-muted-foreground font-mono">{activeAccount.account_number.slice(-6)}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  Number(activeAccount.risk_score) >= 70 ? "bg-critical/20 text-critical" : "bg-success/20 text-success"
                }`}>
                  Risk: {Number(activeAccount.risk_score).toFixed(0)}
                </span>
                {activeAccount.is_flagged && (
                  <span className="text-xs font-bold text-critical">⚠ FLAGGED</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {Object.entries(CHANNEL_EDGE_COLORS).map(([ch, color]) => (
                  <div key={ch} className="flex items-center gap-1.5">
                    <div className="h-0.5 w-4 rounded" style={{ backgroundColor: color }} />
                    <span className="text-xs text-muted-foreground">{ch.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div ref={containerRef} className="h-[600px] w-full" style={{ background: "hsl(222,47%,5%)" }} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GraphPage;
