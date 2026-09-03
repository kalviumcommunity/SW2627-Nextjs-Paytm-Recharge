"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRecharge } from "@/hooks/useRecharge";
import { rechargeSchema } from "./rechargeSchema";

const operators = ["Jio", "Airtel", "Vi", "BSNL"];

const operatorIds: Record<string, number> = {
  Airtel: 1,
  Jio: 2,
  Vi: 3,
  BSNL: 4,
};

const plans = [
  { amount: 199, validity: "18 days", description: "1.5 GB/day" },
  { amount: 299, validity: "28 days", description: "1.5 GB/day" },
  { amount: 479, validity: "56 days", description: "1.5 GB/day" },
  { amount: 719, validity: "84 days", description: "1.5 GB/day" },
];

type FormErrors = {
  mobileNumber?: string;
  selectedOperator?: string;
  amount?: string;
};

export default function RechargeForm() {
  const rechargeMutation = useRecharge();
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("Jio");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(299);
  const [customAmount, setCustomAmount] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const handlePlanSelect = (amount: number) => {
    setSelectedPlan(amount);
    setCustomAmount("");

    setErrors((previous) => ({
      ...previous,
      amount: undefined,
    }));
  };

  const handleCustomAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCustomAmount(event.target.value);
    setSelectedPlan(null);

    setErrors((previous) => ({
      ...previous,
      amount: undefined,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = customAmount
      ? Number(customAmount)
      : selectedPlan ?? 0;

    const result = rechargeSchema.safeParse({
      mobileNumber,
      selectedOperator,
      amount,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        mobileNumber: fieldErrors.mobileNumber?.[0],
        selectedOperator: fieldErrors.selectedOperator?.[0],
        amount: fieldErrors.amount?.[0],
      });

      return;
    }

    setErrors({});

    try {
      const response = await rechargeMutation.mutateAsync({
        mobileNumber: result.data.mobileNumber,
        operatorId: operatorIds[result.data.selectedOperator],
        amount: result.data.amount,
      });

      toast.success("Recharge successful", {
        description: `Transaction ID: ${response.transactionId}`,
      });
    } catch (error) {
      console.error("Recharge failed:", error);

      toast.error("Recharge failed", {
        description: "Please check your details and try again.",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Mobile Prepaid Recharge
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter your details to recharge your mobile number.
        </p>
      </div>

      {/* Mobile Number */}
      <div className="mb-6">
        <label
          htmlFor="mobile"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Mobile Number
        </label>

        <div
          className={`flex overflow-hidden rounded-xl border ${
            errors.mobileNumber
              ? "border-red-500"
              : "border-gray-300 focus-within:border-blue-500"
          }`}
        >
          <span className="flex items-center border-r border-gray-300 bg-gray-50 px-4 text-sm text-gray-600">
            +91
          </span>

          <input
            id="mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter 10-digit mobile number"
            value={mobileNumber}
            onChange={(event) => {
              setMobileNumber(event.target.value.replace(/\D/g, ""));

              setErrors((previous) => ({
                ...previous,
                mobileNumber: undefined,
              }));
            }}
            className="w-full px-4 py-3 outline-none"
          />
        </div>

        {errors.mobileNumber && (
          <p className="mt-2 text-sm text-red-600">
            {errors.mobileNumber}
          </p>
        )}
      </div>

      {/* Operator */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-semibold text-gray-700">
          Select Operator
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {operators.map((operator) => (
            <button
              key={operator}
              type="button"
              onClick={() => {
                setSelectedOperator(operator);

                setErrors((previous) => ({
                  ...previous,
                  selectedOperator: undefined,
                }));
              }}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                selectedOperator === operator
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
              }`}
            >
              {operator}
            </button>
          ))}
        </div>

        {errors.selectedOperator && (
          <p className="mt-2 text-sm text-red-600">
            {errors.selectedOperator}
          </p>
        )}
      </div>

      {/* Plans */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-semibold text-gray-700">
          Recommended Plans
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {plans.map((plan) => (
            <button
              key={plan.amount}
              type="button"
              onClick={() => handlePlanSelect(plan.amount)}
              className={`rounded-xl border p-4 text-left transition ${
                selectedPlan === plan.amount
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <p className="text-lg font-bold text-gray-900">
                Rs. {plan.amount}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {plan.description}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {plan.validity}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="mb-6">
        <label
          htmlFor="amount"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Custom Amount
        </label>

        <div
          className={`flex overflow-hidden rounded-xl border ${
            errors.amount
              ? "border-red-500"
              : "border-gray-300 focus-within:border-blue-500"
          }`}
        >
          <span className="flex items-center border-r border-gray-300 bg-gray-50 px-4 text-gray-600">
            Rs.
          </span>

          <input
            id="amount"
            type="number"
            min="10"
            placeholder="Enter amount"
            value={customAmount}
            onChange={handleCustomAmountChange}
            className="w-full px-4 py-3 outline-none"
          />
        </div>

        {errors.amount && (
          <p className="mt-2 text-sm text-red-600">
            {errors.amount}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
  type="submit"
  disabled={rechargeMutation.isPending}
  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {rechargeMutation.isPending ? "Processing Recharge..." : "Proceed to Recharge"}
</button>
    </form>
  );
}