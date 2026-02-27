import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBlockAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("accounts")
        .update({ status: "blocked", is_flagged: true } as any)
        .eq("id", accountId);
      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("account_actions" as any)
        .insert({
          account_id: accountId,
          action_type: "Blocked",
          admin_id: userData.user.id,
        } as any);
      if (logError) throw logError;
    },
    onSuccess: () => {
      toast.success("Account successfully blocked");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to block account"),
  });
};

export const useLaunchInvestigation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("accounts")
        .update({ status: "investigating" } as any)
        .eq("id", accountId);
      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("account_actions" as any)
        .insert({
          account_id: accountId,
          action_type: "Investigation Started",
          admin_id: userData.user.id,
        } as any);
      if (logError) throw logError;
    },
    onSuccess: () => {
      toast.success("Investigation launched");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to launch investigation"),
  });
};
