"use client";

import { useState } from "react";

const operators = ["Jio", "Airtel", "Vi", "BSNL"];

const plans = [
  { amount: 199, validity: "18 days", description: "1.5 GB/day" },
  { amount: 299, validity: "28 days", description: "1.5 GB/day" },
  { amount: 479, validity: "56 days", description: "1.5 GB/day" },
  { amount: 719, validity: "84 days", description: "1.5 GB/day" },
];

export default function RechargeForm() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("Jio");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(299);
  const [customAmount, setCustomAmount] = useState("");

  const handlePlanSelect = (amount: number) => {
    setSelectedPlan(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCustomAmount(event.target.value);
    setSelectedPlan(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const amount = customAmount || selectedPlan;

    if (!amount) {
      alert("Please select a recharge plan or enter an amount.");
      return;
    }

    alert(
      `Recharge request: ${mobileNumber} | ${selectedOperator} | ₹${amount}`,
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
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

        <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-blue-500">
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
            onChange={(event) =>
              setMobileNumber(event.target.value.replace(/\D/g, ""))
            }
            className="w-full px-4 py-3 outline-none"
          />
        </div>
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
              onClick={() => setSelectedOperator(operator)}
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
                ₹{plan.amount}
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

        <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-blue-500">
          <span className="flex items-center bg-gray-50 px-4 text-gray-600">
            ₹
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
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
      >
        Proceed to Recharge
      </button>
    </form>
  );
}
