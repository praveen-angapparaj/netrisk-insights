import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PatternBadge from "@/components/dashboard/PatternBadge";
import AIExplainabilityDrawer from "@/components/dashboard/AIExplainabilityDrawer";
import { useAccounts } from "@/hooks/useAccounts";
import { useAllTransactions } from "@/hooks/useTransactions";
import { useAlerts } from "@/hooks/useAlerts";
import cytoscape from "cytoscape";
import { Search, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const NODE_COLORS = {
  normal: "#3B82F6",
  flagged: "#EF4444",
  muleSuspect: "#F97316",
  center: "#8B5CF6",
  merchant: "#22C55E",
  dormant: "#EAB308",
};

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
  const { data: allAlerts } = useAlerts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerAccountId, setDrawerAccountId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState([0]); // 0 = all, 1-24 = hours ago

  const defaultAccountId = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    const flagged = accounts.filter((a) => a.is_flagged);
    const pool = flagged.length > 0 ? flagged : accounts;
    return pool.reduce((best, a) => (Number(a.risk_score) > Number(best.risk_score) ? a : best), pool[0]).id;
  }, [accounts]);

  const activeAccountId = selectedAccountId ?? defaultAccountId;

  // Filter transactions by time range
  const timeFilteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (timeRange[0] === 0) return transactions;
    const cutoff = Date.now() - timeRange[0] * 3600000;
    return transactions.filter((tx) => new Date(tx.transaction_time).getTime() >= cutoff);
  }, [transactions, timeRange]);

  const { involvedAccountIds, relevantTransactions } = useMemo(() => {
    if (!activeAccountId || !timeFilteredTransactions) return { involvedAccountIds: new Set<string>(), relevantTransactions: [] };
    const relevant = timeFilteredTransactions.filter(
      (tx) => tx.from_account === activeAccountId || tx.to_account === activeAccountId
    );
    const ids = new Set<string>();
    ids.add(activeAccountId);
    relevant.forEach((tx) => {
      ids.add(tx.from_account);
      ids.add(tx.to_account);
    });
    return { involvedAccountIds: ids, relevantTransactions: relevant };
  }, [activeAccountId, timeFilteredTransactions]);

  // Detect patterns
  const detectedPatterns = useMemo(() => {
    const patterns: string[] = [];
    if (!accounts || !relevantTransactions || relevantTransactions.length === 0) return patterns;

    const activeAcct = accounts.find((a) => a.id === activeAccountId);
    if (!activeAcct) return patterns;

    // Mule chain: multiple hops
    const outTargets = new Set(relevantTransactions.filter((tx) => tx.from_account === activeAccountId).map((tx) => tx.to_account));
    const inSources = new Set(relevantTransactions.filter((tx) => tx.to_account === activeAccountId).map((tx) => tx.from_account));
    if (outTargets.size >= 2 && inSources.size >= 1) patterns.push("Mule Chain Detected");

    // Circular: A sends to B and B sends back
    const circular = [...outTargets].some((t) => inSources.has(t));
    if (circular) patterns.push("Circular Laundering Loop");

    // Velocity: many transactions in short window
    if (relevantTransactions.length >= 8) patterns.push("Velocity Cluster");

    // Shared device
    const devices = new Set(relevantTransactions.map((tx) => tx.device_id).filter(Boolean));
    if (devices.size <= 2 && relevantTransactions.length >= 5) patterns.push("Shared KYC Cluster");

    // Dormant
    if (activeAcct.dormant_flag) patterns.push("Dormant Reactivation");

    return patterns;
  }, [accounts, relevantTransactions, activeAccountId]);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    if (!searchTerm) return accounts;
    const lower = searchTerm.toLowerCase();
    return accounts.filter(
      (a) => a.account_holder_name.toLowerCase().includes(lower) || a.account_number.includes(searchTerm)
    );
  }, [accounts, searchTerm]);

  // Per-account stats for drawer
  const drawerAccount = accounts?.find((a) => a.id === drawerAccountId) || null;
  const drawerTxCount = useMemo(() => {
    if (!drawerAccountId || !transactions) return 0;
    return transactions.filter((tx) => tx.from_account === drawerAccountId || tx.to_account === drawerAccountId).length;
  }, [drawerAccountId, transactions]);
  const drawerChannelCount = useMemo(() => {
    if (!drawerAccountId || !transactions) return 0;
    const chs = new Set(
      transactions.filter((tx) => tx.from_account === drawerAccountId || tx.to_account === drawerAccountId).map((tx) => tx.channel)
    );
    return chs.size;
  }, [drawerAccountId, transactions]);
  const drawerAlertCount = useMemo(() => {
    if (!drawerAccountId || !allAlerts) return 0;
    return allAlerts.filter((a) => a.account_id === drawerAccountId).length;
  }, [drawerAccountId, allAlerts]);

  const getNodeType = useCallback(
    (account: { id: string; is_flagged: boolean; dormant_flag: boolean; account_type: string; risk_score: number }) => {
      if (account.id === activeAccountId) return "center";
      if (account.is_flagged && Number(account.risk_score) >= 60) return "muleSuspect";
      if (account.is_flagged) return "flagged";
      if (account.dormant_flag) return "dormant";
      if (account.account_type === "current") return "merchant";
      return "normal";
    },
    [activeAccountId]
  );

  const buildGraph = useCallback(() => {
    if (!containerRef.current || !accounts || !transactions || !activeAccountId) return;
    if (cyRef.current) cyRef.current.destroy();

    const elements: cytoscape.ElementDefinition[] = [];
    const graphAccounts = accounts.filter((a) => involvedAccountIds.has(a.id));

    graphAccounts.forEach((account) => {
      const nodeType = getNodeType(account);
      elements.push({
        data: {
          id: account.id,
          label: account.account_holder_name.split(" ")[0] + "\n" + account.account_number.slice(-6),
          riskScore: Number(account.risk_score),
          isFlagged: account.is_flagged,
          isCenter: account.id === activeAccountId,
          nodeType,
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
        data: { id: `e-${key}`, source, target, channel: val.channel, amount: val.amount, count: val.count },
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
            "background-color": NODE_COLORS.normal,
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
          selector: "node[nodeType='center']",
          style: { "background-color": NODE_COLORS.center, "border-color": "#6D28D9", width: 50, height: 50, "border-width": 4, "font-size": "11px" },
        },
        {
          selector: "node[nodeType='flagged']",
          style: { "background-color": NODE_COLORS.flagged, "border-color": "#991B1B", width: 40, height: 40, "border-width": 3 },
        },
        {
          selector: "node[nodeType='muleSuspect']",
          style: { "background-color": NODE_COLORS.muleSuspect, "border-color": "#C2410C", width: 38, height: 38, "border-width": 3 },
        },
        {
          selector: "node[nodeType='merchant']",
          style: { "background-color": NODE_COLORS.merchant, "border-color": "#15803D", width: 32, height: 32 },
        },
        {
          selector: "node[nodeType='dormant']",
          style: { "background-color": NODE_COLORS.dormant, "border-color": "#A16207", width: 32, height: 32 },
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
        { selector: "edge[channel='UPI']", style: { "line-color": "#3B82F6", "target-arrow-color": "#3B82F6" } },
        { selector: "edge[channel='ATM']", style: { "line-color": "#F59E0B", "target-arrow-color": "#F59E0B" } },
        { selector: "edge[channel='NET_BANKING']", style: { "line-color": "#0EA5E9", "target-arrow-color": "#0EA5E9" } },
        { selector: "edge[channel='MOBILE_BANKING']", style: { "line-color": "#22C55E", "target-arrow-color": "#22C55E" } },
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

    cyRef.current.on("tap", "node", (e) => {
      const nodeId = e.target.id();
      if (nodeId !== activeAccountId) setSelectedAccountId(nodeId);
    });

    // Double-click to open AI drawer
    cyRef.current.on("dbltap", "node", (e) => {
      const nodeId = e.target.id();
      setDrawerAccountId(nodeId);
      setDrawerOpen(true);
    });

    cyRef.current.on("mouseover", "node", (e) => e.target.style("border-width", 5));
    cyRef.current.on("mouseout", "node", (e) => {
      const node = e.target;
      const type = node.data("nodeType");
      node.style("border-width", type === "center" ? 4 : type === "flagged" || type === "muleSuspect" ? 3 : 2);
    });
  }, [accounts, transactions, activeAccountId, involvedAccountIds, relevantTransactions, getNodeType]);

  useEffect(() => {
    buildGraph();
    return () => { if (cyRef.current) cyRef.current.destroy(); };
  }, [buildGraph]);

  const activeAccount = accounts?.find((a) => a.id === activeAccountId);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Transaction Network Graph</h1>
        <p className="text-sm text-muted-foreground">Select an account to view its transaction network · Double-click a node for AI analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-4 max-h-[700px] flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>

          {/* Node legend */}
          <div className="mb-3 rounded-lg border border-border bg-secondary/20 p-2.5 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Node Types</p>
            {[
              { color: NODE_COLORS.normal, label: "Normal Account" },
              { color: NODE_COLORS.flagged, label: "Flagged" },
              { color: NODE_COLORS.muleSuspect, label: "Mule Suspect" },
              { color: NODE_COLORS.center, label: "Selected" },
              { color: NODE_COLORS.merchant, label: "Merchant (Current)" },
              { color: NODE_COLORS.dormant, label: "Dormant" },
            ].map((n) => (
              <div key={n.label} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: n.color }} />
                <span className="text-[11px] text-muted-foreground">{n.label}</span>
              </div>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 space-y-1">
            {filteredAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  account.id === activeAccountId ? "bg-primary/20 border border-primary/40" : "hover:bg-secondary/40 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium truncate">{account.account_holder_name}</span>
                  <div className="flex items-center gap-1.5">
                    {account.is_flagged && <span className="h-2 w-2 rounded-full bg-critical flex-shrink-0" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDrawerAccountId(account.id); setDrawerOpen(true); }}
                      className="p-0.5 rounded hover:bg-primary/20 transition-colors"
                    >
                      <Brain className="h-3 w-3 text-primary" />
                    </button>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{account.account_number.slice(-6)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Graph */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          {activeAccount && (
            <div className="border-b border-border px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{activeAccount.account_holder_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground font-mono">{activeAccount.account_number.slice(-6)}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(activeAccount.risk_score) >= 70 ? "bg-critical/20 text-critical" : "bg-success/20 text-success"}`}>
                    Risk: {Number(activeAccount.risk_score).toFixed(0)}
                  </span>
                  {activeAccount.is_flagged && <span className="text-xs font-bold text-critical">⚠ FLAGGED</span>}
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

              {/* Pattern badges */}
              {detectedPatterns.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {detectedPatterns.map((p) => <PatternBadge key={p} pattern={p} />)}
                </div>
              )}
            </div>
          )}

          {/* Time slider */}
          <div className="border-b border-border px-5 py-2 flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">⏱ Time Window:</span>
            <Slider
              value={timeRange}
              onValueChange={setTimeRange}
              min={0}
              max={168}
              step={1}
              className="flex-1 max-w-xs"
            />
            <span className="text-xs font-mono text-foreground w-28">
              {timeRange[0] === 0 ? "All time" : `Last ${timeRange[0]}h`}
            </span>
          </div>

          <div ref={containerRef} className="h-[560px] w-full" style={{ background: "hsl(222,47%,5%)" }} />
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

export default GraphPage;
