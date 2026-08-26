import { useMutation } from "@tanstack/react-query";
import { rechargeService } from "@/services/recharge.service";

export function useRecharge() {
  return useMutation({
    mutationFn: rechargeService.createRecharge,
  });
}