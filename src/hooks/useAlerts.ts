import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAlerts = (accountId?: string) => {
  return useQuery({
    queryKey: ["alerts", accountId],
    queryFn: async () => {
      let query = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (accountId) {
        query = query.eq("account_id", accountId);
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data;
    },
  });
};
