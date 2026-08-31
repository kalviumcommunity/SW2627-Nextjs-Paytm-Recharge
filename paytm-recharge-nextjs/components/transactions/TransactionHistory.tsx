"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";

type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING";
type Operator = "Jio" | "Airtel" | "Vi" | "BSNL";
type DateFilter = "ALL" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS";

type Transaction = {
  id: number;
  mobileNumber: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  operator: {
    name: string;
  };
};

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

function isWithinDateRange(
  createdAt: string,
  dateFilter: DateFilter,
): boolean {
  if (dateFilter === "ALL") {
    return true;
  }

  const transactionDate = new Date(createdAt);
  const now = new Date();

  if (dateFilter === "TODAY") {
    return transactionDate.toDateString() === now.toDateString();
  }

  const days = dateFilter === "LAST_7_DAYS" ? 7 : 30;
  const startDate = new Date();

  startDate.setDate(now.getDate() - days);

  return transactionDate >= startDate;
}

export default function TransactionHistory() {
  const { data: transactions = [], isLoading, isError } = useTransactions();

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | TransactionStatus>("ALL");

  const [operatorFilter, setOperatorFilter] =
    useState<"ALL" | Operator>("ALL");

  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction: Transaction) => {
      const matchesStatus =
        statusFilter === "ALL" || transaction.status === statusFilter;

      const matchesOperator =
        operatorFilter === "ALL" ||
        transaction.operator.name === operatorFilter;

      const matchesDate = isWithinDateRange(
        transaction.createdAt,
        dateFilter,
      );

      return matchesStatus && matchesOperator && matchesDate;
    });
  }, [transactions, statusFilter, operatorFilter, dateFilter]);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setOperatorFilter("ALL");
    setDateFilter("ALL");
  };

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    operatorFilter !== "ALL" ||
    dateFilter !== "ALL";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
        <p className="font-semibold text-red-700">
          Failed to load transactions.
        </p>
        <p className="mt-1 text-sm text-red-600">
          Please try again later.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
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

        {/* Filters */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {/* Status */}
          <div>
            <label
              htmlFor="status-filter"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "ALL" | TransactionStatus,
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* Operator */}
          <div>
            <label
              htmlFor="operator-filter"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Operator
            </label>

            <select
              id="operator-filter"
              value={operatorFilter}
              onChange={(event) =>
                setOperatorFilter(
                  event.target.value as "ALL" | Operator,
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Operators</option>
              <option value="Jio">Jio</option>
              <option value="Airtel">Airtel</option>
              <option value="Vi">Vi</option>
              <option value="BSNL">BSNL</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="date-filter"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Date
            </label>

            <select
              id="date-filter"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value as DateFilter)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-4">Mobile Number</th>
              <th className="px-6 py-4">Operator</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction: Transaction) => (
              <tr
                key={transaction.id}
                className="transition hover:bg-gray-50"
              >
                <td className="px-6 py-5">
                  <p className="font-semibold text-gray-900">
                    {transaction.mobileNumber}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    #{transaction.id}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex h-9 min-w-14 items-center justify-center rounded-lg px-3 text-xs font-bold text-white ${
                      operatorStyles[transaction.operator.name] ??
                      "bg-gray-600"
                    }`}
                  >
                    {transaction.operator.name}
                  </span>
                </td>

                <td className="px-6 py-5 font-bold text-gray-900">
                  ₹{transaction.amount}
                </td>

                <td className="px-6 py-5">
                  <StatusBadge status={transaction.status} />
                </td>

                <td className="px-6 py-5 text-sm text-gray-500">
                  {new Date(transaction.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 md:hidden">
        {filteredTransactions.map((transaction: Transaction) => (
          <div key={transaction.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {transaction.mobileNumber}
                </p>

                <p className="text-xs text-gray-400">
                  #{transaction.id}
                </p>
              </div>

              <p className="font-bold text-gray-900">
                ₹{transaction.amount}
              </p>
            </div>

            <div className="mt-4 flex justify-between">
              <span
                className={`inline-flex rounded-lg px-3 py-2 text-xs font-bold text-white ${
                  operatorStyles[transaction.operator.name] ??
                  "bg-gray-600"
                }`}
              >
                {transaction.operator.name}
              </span>

              <StatusBadge status={transaction.status} />
            </div>

            <p className="mt-3 text-xs text-gray-400">
              {new Date(transaction.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredTransactions.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="font-semibold text-gray-900">
            No transactions found
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Try changing or clearing your filters.
          </p>
        </div>
      )}
    </section>
  );
}