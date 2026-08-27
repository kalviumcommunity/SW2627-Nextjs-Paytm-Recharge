"use client";

import { useState } from "react";

type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING";

type Transaction = {
  id: string;
  mobileNumber: string;
  operator: string;
  amount: number;
  plan: string;
  status: TransactionStatus;
  date: string;
};

const transactions: Transaction[] = [
  {
    id: "TXN883901",
    mobileNumber: "+91 9876543210",
    operator: "Jio",
    amount: 299,
    plan: "1.5GB/day • 28 Days Pack",
    status: "SUCCESS",
    date: "Today, 02:07 PM",
  },
  {
    id: "TXN883895",
    mobileNumber: "+91 9123456789",
    operator: "Airtel",
    amount: 479,
    plan: "1.5GB/day • 56 Days Pack",
    status: "SUCCESS",
    date: "Today, 01:47 PM",
  },
  {
    id: "TXN883710",
    mobileNumber: "+91 9988776655",
    operator: "Vi",
    amount: 199,
    plan: "1GB/day • 18 Days Pack",
    status: "FAILED",
    date: "Today, 12:07 PM",
  },
  {
    id: "TXN881022",
    mobileNumber: "+91 9876543210",
    operator: "Jio",
    amount: 719,
    plan: "2GB/day • 84 Days Pack",
    status: "SUCCESS",
    date: "Today, 10:15 AM",
  },
  {
    id: "TXN879001",
    mobileNumber: "+91 9411223344",
    operator: "BSNL",
    amount: 147,
    plan: "Unlimited Voice • 30 Days",
    status: "SUCCESS",
    date: "Today, 04:45 AM",
  },
];

const operatorStyles: Record<string, string> = {
  Jio: "bg-blue-600",
  Airtel: "bg-red-500",
  Vi: "bg-purple-600",
  BSNL: "bg-orange-500",
};

const statusStyles: Record<TransactionStatus, string> = {
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default function TransactionHistory() {
  const [filter, setFilter] = useState<"ALL" | TransactionStatus>("ALL");

  const filteredTransactions =
    filter === "ALL"
      ? transactions
      : transactions.filter((transaction) => transaction.status === filter);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Recharge History
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and track your recent mobile recharges.
            </p>
          </div>

          <span className="text-sm font-medium text-gray-500">
            {filteredTransactions.length} transactions
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["ALL", "SUCCESS", "FAILED", "PENDING"] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  filter === status
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {status === "ALL"
                  ? "All"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-4">Mobile Number</th>
              <th className="px-6 py-4">Operator</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="transition hover:bg-gray-50"
              >
                <td className="px-6 py-5">
                  <p className="font-semibold text-gray-900">
                    {transaction.mobileNumber}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {transaction.id}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex h-9 min-w-14 items-center justify-center rounded-lg px-3 text-xs font-bold text-white ${
                      operatorStyles[transaction.operator]
                    }`}
                  >
                    {transaction.operator}
                  </span>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600">
                  {transaction.plan}
                </td>

                <td className="px-6 py-5 font-bold text-gray-900">
                  ₹{transaction.amount}
                </td>

                <td className="px-6 py-5">
                  <StatusBadge status={transaction.status} />
                </td>

                <td className="px-6 py-5 text-sm text-gray-500">
                  {transaction.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 md:hidden">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">
                  {transaction.mobileNumber}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {transaction.id}
                </p>
              </div>

              <p className="text-lg font-bold text-gray-900">
                ₹{transaction.amount}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span
                className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-bold text-white ${
                  operatorStyles[transaction.operator]
                }`}
              >
                {transaction.operator}
              </span>

              <StatusBadge status={transaction.status} />
            </div>

            <p className="mt-3 text-sm text-gray-600">
              {transaction.plan}
            </p>

            <p className="mt-1 text-xs text-gray-400">{transaction.date}</p>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="font-semibold text-gray-900">
            No transactions found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try selecting a different status filter.
          </p>
        </div>
      )}
    </section>
  );
}