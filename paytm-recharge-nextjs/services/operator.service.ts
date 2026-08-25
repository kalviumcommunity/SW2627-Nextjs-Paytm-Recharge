import { apiRequest } from "./api";
import type { Operator } from "../types/operator";

export function getOperators() {
  return apiRequest<Operator[]>("/operators");
}