import { useQuery } from "@tanstack/react-query";
import { operatorService } from "@/services/operator.service";

export function useOperators() {
  return useQuery({
    queryKey: ["operators"],
    queryFn: operatorService.getOperators,
  });
}
