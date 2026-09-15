import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";

export function useProfileUpdate(onDone: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesUpdate<"profiles"> & { id: string }) => {
      const { id, ...rest } = payload;
      // Anti-cheat: strip protected billing and subscription fields
      delete (rest as Record<string, unknown>).trial_status;
      delete (rest as Record<string, unknown>).trial_expiry;
      delete (rest as Record<string, unknown>).whop_membership_id;
      const { error } = await supabase.from("profiles").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(onDone);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["trial-state"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
