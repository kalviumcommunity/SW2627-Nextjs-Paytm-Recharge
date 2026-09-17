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

  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("Jio");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(299);
  const [errors, setErrors] = useState<FormErrors>({});

  const isSubmitting = rechargeMutation.isPending;

  const validateMobileNumber = () => {
    const result = rechargeSchema.safeParse({
      mobileNumber,
      selectedOperator: "Jio",
      amount: 299,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        mobileNumber: fieldErrors.mobileNumber?.[0],
      });

      return false;
    }

    setErrors({});
    return true;
  };

  const handleContinue = () => {
    if (isSubmitting) return;

    if (!validateMobileNumber()) {
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    if (isSubmitting) return;

    setErrors({});
    setStep(1);
  };

  const handlePlanSelect = (amount: number) => {
    if (isSubmitting) return;

    setSelectedPlan(amount);

    setErrors((previous) => ({
      ...previous,
      amount: undefined,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = selectedPlan ?? 0;

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

      // Reset form after successful recharge.
      setStep(1);
      setMobileNumber("");
      setSelectedOperator("Jio");
      setSelectedPlan(299);
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
      aria-busy={isSubmitting}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Mobile Prepaid Recharge
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Complete the steps below to recharge your mobile number.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-3 text-sm font-semibold">
        <span
          className={`rounded-full px-4 py-2 ${
            step === 1
              ? "bg-blue-600 text-white"
              : "bg-green-100 text-green-700"
          }`}
        >
          1. Mobile Number
        </span>

        <span className="text-gray-400">→</span>

        <span
          className={`rounded-full px-4 py-2 ${
            step === 2
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          2. Operator
        </span>
      </div>

      {/* Step 1: Mobile Number */}
      {step === 1 && (
        <div>
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
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.mobileNumber)}
                aria-describedby={
                  errors.mobileNumber ? "mobile-error" : undefined
                }
                onChange={(event) => {
                  setMobileNumber(event.target.value.replace(/\D/g, ""));

                  setErrors((previous) => ({
                    ...previous,
                    mobileNumber: undefined,
                  }));
                }}
                className="w-full px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            {errors.mobileNumber && (
              <p id="mobile-error" className="mt-2 text-sm text-red-600">
                {errors.mobileNumber}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Operator and Recharge */}
      {step === 2 && (
        <div>
          <fieldset className="mb-6">
            <legend className="mb-3 block text-sm font-semibold text-gray-700">
              Select Operator
            </legend>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {operators.map((operator) => (
                <button
                  key={operator}
                  type="button"
                  disabled={isSubmitting}
                  aria-pressed={selectedOperator === operator}
                  onClick={() => {
                    setSelectedOperator(operator);

                    setErrors((previous) => ({
                      ...previous,
                      selectedOperator: undefined,
                    }));
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    selectedOperator === operator
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
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
          </fieldset>

          <fieldset className="mb-6">
            <legend className="mb-3 block text-sm font-semibold text-gray-700">
              Recommended Plans
            </legend>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {plans.map((plan) => (
                <button
                  key={plan.amount}
                  type="button"
                  disabled={isSubmitting}
                  aria-pressed={selectedPlan === plan.amount}
                  onClick={() => handlePlanSelect(plan.amount)}
                  className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    selectedPlan === plan.amount
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
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
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Processing Recharge..." : "Proceed to Recharge"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}