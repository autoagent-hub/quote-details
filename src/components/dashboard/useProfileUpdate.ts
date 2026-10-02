import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { updateDetailerProfile } from "@/lib/profile.functions";
import type { TablesUpdate } from "@/integrations/supabase/types";

export function useProfileUpdate(onDone: string) {
  const queryClient = useQueryClient();
  const doUpdate = useServerFn(updateDetailerProfile);

  return useMutation({
    mutationFn: async (payload: TablesUpdate<"profiles"> & { id: string }) => {
      const { id: _id, ...rest } = payload;
      // Executes server-side validation against database subscription status
      await doUpdate({ data: rest });
    },
    onSuccess: () => {
      toast.success(onDone);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["trial-state"] });
    },
    onError: (error: Error) => {
      if (
        error.message?.includes("profiles_slug_key") ||
        error.message?.includes("duplicate key")
      ) {
        toast.error(
          "This URL slug is already taken by another shop. Please select an available alternative.",
        );
      } else {
        toast.error(error.message);
      }
    },
  });
}
