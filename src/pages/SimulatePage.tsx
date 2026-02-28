import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const SimulatePage = () => {
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<string[]>([]);

  const seedMutation = useMutation({
    mutationFn: async () => {
      setLogs(["[INFO] Seeding database with sample accounts and transactions..."]);

      const accountNames = [
        "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sunita Devi", "Vikram Singh",
        "Neha Gupta", "Suresh Yadav", "Kavita Joshi", "Rahul Verma", "Anita Mishra",
        "Deepak Chauhan", "Meena Thakur", "Arun Nair", "Pooja Reddy", "Sanjay Dubey",
        "Ritu Agarwal", "Manoj Tiwari", "Shweta Pandey", "Nitin Saxena", "Rekha Bhat",
        "Govind Rajan", "Lata Iyer", "Prakash Jha", "Suman Chandra", "Vijay Malhotra",
        "Kiran Desai", "Ashok Kapoor", "Geeta Mehta", "Ramesh Pillai", "Uma Shankar",
        "Harish Menon", "Divya Srinivasan", "Mohan Lal", "Sarita Goswami", "Rakesh Bansal",
        "Anu Krishnan", "Tarun Bhatt", "Jaya Prakash", "Dinesh Choudhary", "Swati Kulkarni",
        "Pankaj Rawat", "Nirmala Das", "Aakash Tandon", "Bhavna Sethi", "Rajiv Kohli",
        "Sangeetha Rao", "Manish Grover", "Padma Naidu", "Vivek Arora", "Kamala Hegde",
      ];

      const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"];
      const channels: string[] = ["UPI", "ATM", "NET_BANKING", "MOBILE_BANKING", "BRANCH"];

      const accountsData = accountNames.map((name, i) => ({
        account_number: `ACCN${String(1000 + i).padStart(6, "0")}`,
        account_holder_name: name,
        account_type: i % 3 === 0 ? "current" : "savings",
        total_inward_amount: 0,
        total_outward_amount: 0,
        risk_score: 0,
        is_flagged: false,
        dormant_flag: i >= 45,
      }));

      const { data: insertedAccounts, error: accErr } = await supabase
        .from("accounts")
        .insert(accountsData)
        .select();

      if (accErr) throw accErr;
      if (!insertedAccounts) throw new Error("No accounts created");

      setLogs((l) => [...l, `[OK] Created ${insertedAccounts.length} accounts`]);

      const txns: Array<{
        from_account: string;
        to_account: string;
        amount: number;
        channel: string;
        device_id: string;
        geo_location: string;
        transaction_time: string;
      }> = [];

      const now = new Date();

      for (let i = 0; i < 200; i++) {
        const from = insertedAccounts[Math.floor(Math.random() * 40)];
        let to = insertedAccounts[Math.floor(Math.random() * 40)];
        while (to.id === from.id) to = insertedAccounts[Math.floor(Math.random() * 40)];

        const hoursAgo = Math.floor(Math.random() * 168);
        const txTime = new Date(now.getTime() - hoursAgo * 3600000);

        txns.push({
          from_account: from.id,
          to_account: to.id,
          amount: Math.floor(Math.random() * 50000) + 1000,
          channel: channels[Math.floor(Math.random() * channels.length)],
          device_id: `DEV${Math.floor(Math.random() * 100)}`,
          geo_location: `${cities[Math.floor(Math.random() * cities.length)]}, India`,
          transaction_time: txTime.toISOString(),
        });
      }

      const muleChain1 = insertedAccounts.slice(0, 5);
      for (let hop = 0; hop < 4; hop++) {
        for (let burst = 0; burst < 8; burst++) {
          const minutesOffset = hop * 5 + burst;
          const txTime = new Date(now.getTime() - minutesOffset * 60000);
          txns.push({
            from_account: muleChain1[hop].id,
            to_account: muleChain1[hop + 1].id,
            amount: Math.floor(Math.random() * 200000) + 100000,
            channel: channels[burst % channels.length],
            device_id: `MULE_DEV_${hop}`,
            geo_location: `${cities[hop]}, India`,
            transaction_time: txTime.toISOString(),
          });
        }
      }

      const muleChain2 = insertedAccounts.slice(10, 14);
      for (let hop = 0; hop < 3; hop++) {
        for (let burst = 0; burst < 6; burst++) {
          const minutesOffset = hop * 3 + burst;
          const txTime = new Date(now.getTime() - (30 + minutesOffset) * 60000);
          txns.push({
            from_account: muleChain2[hop].id,
            to_account: muleChain2[hop + 1].id,
            amount: Math.floor(Math.random() * 150000) + 80000,
            channel: channels[(burst + 1) % channels.length],
            device_id: `MULE2_DEV_${hop}`,
            geo_location: `${cities[hop + 3]}, India`,
            transaction_time: txTime.toISOString(),
          });
        }
      }

      const burstAccount = insertedAccounts[20];
      for (let i = 0; i < 10; i++) {
        const to = insertedAccounts[21 + (i % 5)];
        const txTime = new Date(now.getTime() - i * 60000);
        txns.push({
          from_account: burstAccount.id,
          to_account: to.id,
          amount: Math.floor(Math.random() * 100000) + 50000,
          channel: channels[i % channels.length],
          device_id: `BURST_DEV`,
          geo_location: "Mumbai, India",
          transaction_time: txTime.toISOString(),
        });
      }

      const dormantAcc = insertedAccounts[45];
      for (let i = 0; i < 5; i++) {
        const to = insertedAccounts[Math.floor(Math.random() * 10)];
        txns.push({
          from_account: dormantAcc.id,
          to_account: to.id,
          amount: Math.floor(Math.random() * 500000) + 200000,
          channel: "UPI",
          device_id: "DORMANT_DEV",
          geo_location: "Delhi, India",
          transaction_time: new Date(now.getTime() - i * 120000).toISOString(),
        });
      }

      setLogs((l) => [...l, `[INFO] Inserting ${txns.length} transactions...`]);

      for (let i = 0; i < txns.length; i += 50) {
        const batch = txns.slice(i, i + 50);
        const { error: txErr } = await supabase.from("transactions").insert(batch);
        if (txErr) throw txErr;
      }

      setLogs((l) => [...l, `[OK] Inserted ${txns.length} transactions`]);
      setLogs((l) => [...l, "[INFO] Calculating risk scores..."]);

      const txCountByAccount: Record<string, number> = {};
      const channelsByAccount: Record<string, Set<string>> = {};
      const inwardByAccount: Record<string, number> = {};
      const outwardByAccount: Record<string, number> = {};

      txns.forEach((tx) => {
        txCountByAccount[tx.from_account] = (txCountByAccount[tx.from_account] || 0) + 1;
        txCountByAccount[tx.to_account] = (txCountByAccount[tx.to_account] || 0) + 1;
        if (!channelsByAccount[tx.from_account]) channelsByAccount[tx.from_account] = new Set();
        channelsByAccount[tx.from_account].add(tx.channel);
        outwardByAccount[tx.from_account] = (outwardByAccount[tx.from_account] || 0) + tx.amount;
        inwardByAccount[tx.to_account] = (inwardByAccount[tx.to_account] || 0) + tx.amount;
      });

      const alertsToInsert: Array<{
        account_id: string;
        alert_type: string;
        severity: string;
        description: string;
      }> = [];

      for (const account of insertedAccounts) {
        const txCount = txCountByAccount[account.id] || 0;
        const channelCount = channelsByAccount[account.id]?.size || 0;
        const inward = inwardByAccount[account.id] || 0;
        const outward = outwardByAccount[account.id] || 0;

        const velocityScore = Math.min(100, (txCount / 5) * 20);
        const channelScore = Math.min(100, (channelCount / 3) * 50);
        const burstRatio = inward > 0 ? (outward / inward) : 0;
        const burstScore = burstRatio > 0.8 ? Math.min(100, burstRatio * 60) : 0;
        const isMule = muleChain1.some((m) => m.id === account.id) || muleChain2.some((m) => m.id === account.id);
        const layeringScore = isMule ? 90 : Math.min(100, txCount * 3);
        const dormantScore = account.dormant_flag && txCount > 0 ? 80 : 0;

        const riskScore =
          velocityScore * 0.3 +
          channelScore * 0.2 +
          burstScore * 0.2 +
          layeringScore * 0.2 +
          dormantScore * 0.1;

        const finalRisk = Math.min(100, Math.round(riskScore));
        const isFlagged = finalRisk > 70;

        await supabase
          .from("accounts")
          .update({
            risk_score: finalRisk,
            is_flagged: isFlagged,
            total_inward_amount: inward,
            total_outward_amount: outward,
            last_active_at: new Date().toISOString(),
          })
          .eq("id", account.id);

        if (isFlagged) {
          const severity = finalRisk > 90 ? "CRITICAL" : finalRisk > 80 ? "HIGH" : "MEDIUM";
          const isMuleChain1 = muleChain1.some((m) => m.id === account.id);
          const isMuleChain2 = muleChain2.some((m) => m.id === account.id);
          const isBurstAccount = account.id === burstAccount.id;
          const isDormantReactivation = account.dormant_flag && txCount > 0;

          let alertType = "RISK_THRESHOLD";
          let description = "";

          if (isMuleChain1) {
            const hopIndex = muleChain1.findIndex((m) => m.id === account.id);
            alertType = "MULE_CHAIN";
            description = `Multi-hop mule chain detected (hop ${hopIndex + 1}/4). ${txCount} rapid transfers via ${Array.from(channelsByAccount[account.id] || []).join(", ")}. Outflow: INR ${outward.toLocaleString("en-IN")}.`;
          } else if (isMuleChain2) {
            const hopIndex = muleChain2.findIndex((m) => m.id === account.id);
            alertType = "MULE_CHAIN";
            description = `Secondary mule network (hop ${hopIndex + 1}/3). ${txCount} transactions, INR ${outward.toLocaleString("en-IN")} transferred.`;
          } else if (isBurstAccount) {
            alertType = "BURST_ACTIVITY";
            description = `Cross-channel burst: ${txCount} transactions across ${channelCount} channels within 10 minutes. Total outflow INR ${outward.toLocaleString("en-IN")}.`;
          } else if (isDormantReactivation) {
            alertType = "DORMANT_REACTIVATION";
            description = `Dormant account reactivated. ${txCount} high-value transactions totaling INR ${outward.toLocaleString("en-IN")} via UPI.`;
          } else if (velocityScore > 60 && channelScore > 40) {
            alertType = "VELOCITY_ANOMALY";
            description = `Transaction velocity anomaly: ${txCount} operations across ${channelCount} channels. Disbursement ratio ${Math.round((outward / Math.max(inward, 1)) * 100)}%.`;
          } else if (burstScore > 50) {
            alertType = "RAPID_DISBURSEMENT";
            description = `Rapid fund disbursement: ${Math.round((outward / Math.max(inward, 1)) * 100)}% of received funds transferred out.`;
          } else {
            alertType = "RISK_THRESHOLD";
            description = `Composite risk score ${finalRisk} exceeds threshold. Velocity: ${Math.round(velocityScore)}%, Channels: ${Math.round(channelScore)}%, Burst: ${Math.round(burstScore)}%.`;
          }

          alertsToInsert.push({
            account_id: account.id,
            alert_type: alertType,
            severity,
            description,
          });
        }
      }

      if (alertsToInsert.length > 0) {
        const { error: alertErr } = await supabase.from("alerts").insert(alertsToInsert);
        if (alertErr) throw alertErr;
      }

      setLogs((l) => [...l, `[ALERT] Generated ${alertsToInsert.length} alerts`, "[OK] Simulation complete"]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Fraud simulation complete");
    },
    onError: (err: Error) => {
      setLogs((l) => [...l, `[ERROR] ${err.message}`]);
      toast.error(`Simulation failed: ${err.message}`);
    },
  });

  const burstMutation = useMutation({
    mutationFn: async () => {
      setLogs(["[INFO] Simulating fraud burst..."]);

      const { data: accounts, error } = await supabase
        .from("accounts")
        .select("id, account_number")
        .limit(10);

      if (error || !accounts || accounts.length < 5) {
        throw new Error("Need at least 5 accounts. Please seed data first.");
      }

      const now = new Date();
      const channels = ["UPI", "ATM", "NET_BANKING", "MOBILE_BANKING", "BRANCH"];
      const txns = [];

      for (let i = 0; i < 15; i++) {
        const from = accounts[0];
        const to = accounts[1 + (i % 4)];
        txns.push({
          from_account: from.id,
          to_account: to.id,
          amount: Math.floor(Math.random() * 300000) + 100000,
          channel: channels[i % channels.length],
          device_id: "BURST_SIM",
          geo_location: "Mumbai, India",
          transaction_time: new Date(now.getTime() - i * 20000).toISOString(),
        });
      }

      const { error: txErr } = await supabase.from("transactions").insert(txns);
      if (txErr) throw txErr;

      setLogs((l) => [...l, `[INFO] Inserted ${txns.length} burst transactions`]);

      const riskScore = 95;
      await supabase
        .from("accounts")
        .update({ risk_score: riskScore, is_flagged: true })
        .eq("id", accounts[0].id);

      await supabase.from("alerts").insert({
        account_id: accounts[0].id,
        alert_type: "BURST_ACTIVITY",
        severity: "CRITICAL",
        description: `Rapid cross-channel burst: 15 transactions in 5 minutes across ${channels.length} channels. Account ${accounts[0].account_number}`,
      });

      setLogs((l) => [...l, "[ALERT] Critical alert generated", "[OK] Burst simulation complete"]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Fraud burst simulated");
    },
    onError: (err: Error) => {
      setLogs((l) => [...l, `[ERROR] ${err.message}`]);
      toast.error(err.message);
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Fraud Simulation</h1>
        <p className="text-sm text-muted-foreground">Seed data and simulate fraud patterns for testing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border border-border bg-card p-6 card-shadow hover:card-shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Seed Database</h2>
              <p className="text-xs text-muted-foreground">50 accounts, 300+ transactions, mule chains</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Creates sample data with normal behavior accounts, mule chains (4-hop layering), cross-channel burst, and dormant account reactivation patterns.
          </p>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="w-full rounded-xl h-10"
          >
            {seedMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Seed Sample Data
          </Button>
        </div>

        <div className="rounded-2xl border border-critical/20 bg-critical/5 p-6 card-shadow hover:card-shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-critical/10">
              <AlertTriangle className="h-5 w-5 text-critical" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Simulate Fraud Burst</h2>
              <p className="text-xs text-muted-foreground">Inject suspicious transactions in real-time</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Inserts 15 rapid transactions across all channels in 5 minutes, triggers risk recalculation, and generates a CRITICAL alert.
          </p>
          <Button
            onClick={() => burstMutation.mutate()}
            disabled={burstMutation.isPending}
            variant="destructive"
            className="w-full rounded-xl h-10"
          >
            {burstMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Simulate Fraud Burst
          </Button>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <h2 className="text-sm font-semibold text-foreground mb-3">Simulation Log</h2>
          <div className="space-y-1 font-mono text-xs max-h-64 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className={`py-1 ${log.includes("[ERROR]") ? "text-critical" : log.includes("[OK]") ? "text-success" : log.includes("[ALERT]") ? "text-warning" : "text-muted-foreground"}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SimulatePage;
