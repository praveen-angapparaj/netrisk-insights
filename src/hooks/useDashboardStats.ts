import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [accountsRes, txRes, flaggedRes, alertsRes, channelsRes] = await Promise.all([
        supabase.from("accounts").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        supabase.from("accounts").select("id", { count: "exact", head: true }).eq("is_flagged", true),
        supabase.from("alerts").select("id", { count: "exact", head: true }).eq("severity", "CRITICAL"),
        supabase.from("transactions").select("channel"),
      ]);

      const channels = channelsRes.data || [];
      const uniqueChannels = new Set(channels.map((c) => c.channel));
      const crossChannelPct = channels.length > 0
        ? Math.round((uniqueChannels.size / 5) * 100)
        : 0;

      return {
        totalAccounts: accountsRes.count || 0,
        totalTransactions: txRes.count || 0,
        highRiskAccounts: flaggedRes.count || 0,
        criticalAlerts: alertsRes.count || 0,
        crossChannelPct,
      };
    },
  });
};
