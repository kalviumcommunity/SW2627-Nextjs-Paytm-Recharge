"use client";

import { useMutation } from "@tanstack/react-query";
import { recharge } from "@/services/recharge.service";

export function useRecharge() {
  return useMutation({
    mutationFn: recharge,
  });
}