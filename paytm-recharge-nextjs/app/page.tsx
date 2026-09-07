import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const totalTransactions = await prisma.rechargeTransaction.count();
    const successfulTransactions = await prisma.rechargeTransaction.count({
      where: { status: "SUCCESS" },
    });
    const pendingTransactions = await prisma.rechargeTransaction.count({
      where: { status: "PENDING" },
    });
    return {
      total: totalTransactions,
      successful: successfulTransactions,
      pending: pendingTransactions,
    };
  } catch {
    return { total: 0, successful: 0, pending: 0 };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 px-6 py-20 text-white sm:py-28">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-100 backdrop-blur-sm">
            ⚡ Real-Time Fintech Platform
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Paytm Mobile Recharge <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-200 to-blue-100 bg-clip-text text-transparent">
              with Live Status Tracking
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-blue-100 sm:text-lg">
            Experience blazing-fast mobile recharges with real-time SSE stream updates,
            smart background polling fallbacks, and intelligent 10-second duplicate payment prevention.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/recharge"
              className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-700 shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 hover:shadow-xl sm:w-auto"
            >
              Recharge Mobile Now →
            </Link>

            <Link
              href="/transactions"
              className="w-full rounded-xl border border-blue-400/40 bg-blue-800/40 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-blue-800/70 sm:w-auto"
            >
              View Live History ({stats.pending} Active)
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 grid grid-cols-3 divide-x divide-blue-500/30 rounded-2xl border border-blue-400/30 bg-blue-950/40 p-4 text-center backdrop-blur-md">
            <div className="px-3">
              <p className="text-2xl font-black text-white sm:text-3xl">{stats.total}</p>
              <p className="text-xs font-medium text-blue-200 sm:text-sm">Total Recharges</p>
            </div>
            <div className="px-3">
              <p className="text-2xl font-black text-emerald-300 sm:text-3xl">{stats.successful}</p>
              <p className="text-xs font-medium text-blue-200 sm:text-sm">Completed</p>
            </div>
            <div className="px-3">
              <p className="text-2xl font-black text-amber-300 sm:text-3xl">{stats.pending}</p>
              <p className="text-xs font-medium text-blue-200 sm:text-sm">Pending Live</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Engineered for High-Reliability Fintech Flows
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Built with Next.js App Router, PostgreSQL, Prisma, and reactive state management.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-600">
              ⚡
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">Live SSE & Adaptive Polling</h3>
            <p className="mt-2 text-sm text-slate-600">
              Transactions update instantly via Server-Sent Events stream. If connections drop, an optimized jittered backoff polling engine seamlessly takes over.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl text-emerald-600">
              🛡️
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">Duplicate Shield</h3>
            <p className="mt-2 text-sm text-slate-600">
              Prevents accidental double payments within a 10-second window using atomic lock guards and indexed database lookup.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-600">
              🔍
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">Smart Filterable History</h3>
            <p className="mt-2 text-sm text-slate-600">
              Sort and slice transactions by operator (Jio, Airtel, Vi, BSNL), status (Pending, Success, Failed), and date ranges in real time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
