"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recharge } from "@/services/recharge.service";

export function useRecharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recharge,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    },
  });
}