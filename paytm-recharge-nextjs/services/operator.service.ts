import { api } from "./api";
import { Operator } from "@/types/operator";

export const operatorService = {
  getOperators() {
    return api.get<Operator[]>("/operators");
  },
};