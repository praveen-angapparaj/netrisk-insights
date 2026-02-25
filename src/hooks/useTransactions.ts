import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTransactions = (accountId?: string) => {
  return useQuery({
    queryKey: ["transactions", accountId],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("transaction_time", { ascending: false });
      
      if (accountId) {
        query = query.or(`from_account.eq.${accountId},to_account.eq.${accountId}`);
      }
      
      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data;
    },
  });
};

export const useAllTransactions = () => {
  return useQuery({
    queryKey: ["all-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_time", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });
};
