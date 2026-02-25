import { useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAccounts } from "@/hooks/useAccounts";
import { useAllTransactions } from "@/hooks/useTransactions";
import cytoscape from "cytoscape";

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

  const buildGraph = useCallback(() => {
    if (!containerRef.current || !accounts || !transactions) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [];

    // Only include accounts that have transactions
    const txAccountIds = new Set<string>();
    transactions.forEach((tx) => {
      txAccountIds.add(tx.from_account);
      txAccountIds.add(tx.to_account);
    });

    const relevantAccounts = accounts.filter((a) => txAccountIds.has(a.id));

    relevantAccounts.forEach((account) => {
      elements.push({
        data: {
          id: account.id,
          label: account.account_number.slice(-6),
          name: account.account_holder_name,
          riskScore: Number(account.risk_score),
          isFlagged: account.is_flagged,
        },
      });
    });

    // Aggregate edges by from+to pair
    const edgeMap = new Map<string, { channel: string; amount: number; count: number }>();
    transactions.forEach((tx) => {
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
            "font-size": "10px",
            "text-valign": "bottom",
            "text-margin-y": 8,
            width: 30,
            height: 30,
            "border-width": 2,
            "border-color": "#1E3A5F",
            "font-family": "JetBrains Mono, monospace",
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
        name: "cose",
        padding: 50,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        animate: true,
        animationDuration: 800,
      },
      minZoom: 0.3,
      maxZoom: 3,
    });

    // Tooltip on hover
    cyRef.current.on("mouseover", "node", (e) => {
      const node = e.target;
      node.style("border-width", 4);
      node.style("border-color", node.data("isFlagged") ? "#EF4444" : "#3B82F6");
    });
    cyRef.current.on("mouseout", "node", (e) => {
      const node = e.target;
      node.style("border-width", node.data("isFlagged") ? 3 : 2);
      node.style("border-color", node.data("isFlagged") ? "#991B1B" : "#1E3A5F");
    });
  }, [accounts, transactions]);

  useEffect(() => {
    buildGraph();
    return () => {
      if (cyRef.current) cyRef.current.destroy();
    };
  }, [buildGraph]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Transaction Network Graph</h1>
        <p className="text-sm text-muted-foreground">Visual representation of account transaction relationships</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-6 border-b border-border px-5 py-3">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Legend:</span>
          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Normal</span></div>
          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-critical" /><span className="text-xs text-muted-foreground">Flagged</span></div>
          {Object.entries(CHANNEL_EDGE_COLORS).map(([ch, color]) => (
            <div key={ch} className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{ch.replace("_", " ")}</span>
            </div>
          ))}
        </div>
        <div ref={containerRef} className="h-[600px] w-full" style={{ background: "hsl(222,47%,5%)" }} />
      </div>
    </DashboardLayout>
  );
};

export default GraphPage;
