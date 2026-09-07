import { NextRequest } from "next/server";
import { prisma } from "../../lib/prisma";
import { POST as rechargeHandler } from "../../app/api/recharge/route";
import { GET as transactionsHandler } from "../../app/api/transactions/route";
import { GET as singleStatusHandler } from "../../app/api/status/[id]/route";
import { POST as batchStatusPostHandler } from "../../app/api/status/batch/route";
import { GET as batchStatusGetHandler } from "../../app/api/status/route";
import { GET as healthHandler } from "../../app/api/health/route";
import {
  publishTransactionUpdate,
  subscribeToTransactionUpdates,
} from "../../lib/events.server";

interface BenchmarkMetric {
  endpoint: string;
  totalRequests: number;
  concurrency: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  throughputRps: number;
  successRate: number;
  passTarget: boolean; // Target < 500ms
}

function calculatePercentile(latencies: number[], percentile: number): number {
  if (!latencies.length) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function createJsonRequest(url: string, method: string, body?: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runPerformanceTestSuite() {
  console.log("\n=======================================================");
  console.log("    PAYTM RECHARGE: PERFORMANCE & LOAD TEST SUITE      ");
  console.log("=======================================================\n");

  const metricsReport: BenchmarkMetric[] = [];

  // Setup prerequisites in database
  let testUser = await prisma.user.findFirst();
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: "Perf Test User",
        email: "perf@test.local",
        phone: "9111111111",
      },
    });
  }

  let testOperator = await prisma.operator.findFirst();
  if (!testOperator) {
    testOperator = await prisma.operator.create({
      data: { name: "Jio" },
    });
  }

  // Create sample transaction for status lookup tests
  const seedTx = await prisma.rechargeTransaction.create({
    data: {
      userId: testUser.id,
      operatorId: testOperator.id,
      mobileNumber: "9876543210",
      amount: 199,
      status: "PENDING",
    },
  });

  // -------------------------------------------------------------
  // BENCHMARK 1: Baseline Single-Request Latencies
  // -------------------------------------------------------------
  console.log("▶ [Benchmark 1] Measuring Baseline Single-Request Latencies...");

  const baselineEndpoints: Array<{ name: string; runner: () => Promise<Response> }> = [
    {
      name: "GET /api/health",
      runner: () => healthHandler(),
    },
    {
      name: "GET /api/transactions",
      runner: () => transactionsHandler(),
    },
    {
      name: "GET /api/status/[id]",
      runner: () => singleStatusHandler(createJsonRequest(`/api/status/${seedTx.transactionId}`, "GET"), { params: Promise.resolve({ id: seedTx.transactionId }) }),
    },
    {
      name: "GET /api/status?ids=...",
      runner: () => batchStatusGetHandler(createJsonRequest(`/api/status?ids=${seedTx.transactionId}`, "GET")),
    },
    {
      name: "POST /api/status/batch",
      runner: () => batchStatusPostHandler(createJsonRequest("/api/status/batch", "POST", { transactionIds: [seedTx.transactionId] })),
    },
    {
      name: "POST /api/recharge (new unique)",
      runner: () => rechargeHandler(createJsonRequest("/api/recharge", "POST", {
        mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        operatorId: testOperator.id,
        amount: 299,
      })),
    },
  ];

  for (const ep of baselineEndpoints) {
    const latencies: number[] = [];
    const iterations = 10;
    let successful = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await ep.runner();
      const duration = performance.now() - start;
      latencies.push(duration);
      if (res.status >= 200 && res.status < 300) successful++;
    }

    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);

    metricsReport.push({
      endpoint: `${ep.name} (Sequential)`,
      totalRequests: iterations,
      concurrency: 1,
      minMs: Number(min.toFixed(2)),
      maxMs: Number(max.toFixed(2)),
      avgMs: Number(avg.toFixed(2)),
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      p99Ms: Number(p99.toFixed(2)),
      throughputRps: Number((1000 / avg).toFixed(1)),
      successRate: (successful / iterations) * 100,
      passTarget: p95 < 500,
    });

    console.log(`  ✓ ${ep.name.padEnd(35)}: avg=${avg.toFixed(1)}ms, p95=${p95.toFixed(1)}ms, max=${max.toFixed(1)}ms`);
  }

  // -------------------------------------------------------------
  // BENCHMARK 2: High Concurrency Load Test (50 concurrent queries)
  // -------------------------------------------------------------
  console.log("\n▶ [Benchmark 2] Running High-Concurrency Load Tests (50 Concurrent Clients)...");

  const concurrencyEndpoints: Array<{ name: string; generator: () => Promise<Response> }> = [
    {
      name: "GET /api/transactions (50 concurrent)",
      generator: () => transactionsHandler(),
    },
    {
      name: "POST /api/status/batch (50 concurrent)",
      generator: () => batchStatusPostHandler(createJsonRequest("/api/status/batch", "POST", { transactionIds: [seedTx.transactionId] })),
    },
    {
      name: "GET /api/health (50 concurrent)",
      generator: () => healthHandler(),
    },
  ];

  for (const ep of concurrencyEndpoints) {
    const totalRequests = 100;
    const concurrency = 50;
    const latencies: number[] = [];
    let successful = 0;

    const testStart = performance.now();

    // Execute in 2 concurrent waves of 50
    for (let wave = 0; wave < totalRequests / concurrency; wave++) {
      const promises = Array.from({ length: concurrency }).map(async () => {
        const start = performance.now();
        const res = await ep.generator();
        const duration = performance.now() - start;
        latencies.push(duration);
        if (res.status >= 200 && res.status < 300) successful++;
      });
      await Promise.all(promises);
    }

    const testTotalDurationSec = (performance.now() - testStart) / 1000;
    const rps = totalRequests / testTotalDurationSec;

    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);

    metricsReport.push({
      endpoint: ep.name,
      totalRequests,
      concurrency,
      minMs: Number(min.toFixed(2)),
      maxMs: Number(max.toFixed(2)),
      avgMs: Number(avg.toFixed(2)),
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      p99Ms: Number(p99.toFixed(2)),
      throughputRps: Number(rps.toFixed(1)),
      successRate: (successful / totalRequests) * 100,
      passTarget: p95 < 500,
    });

    console.log(`  ✓ ${ep.name.padEnd(42)}: avg=${avg.toFixed(1)}ms, p95=${p95.toFixed(1)}ms, throughput=${rps.toFixed(0)} req/s`);
  }

  // -------------------------------------------------------------
  // BENCHMARK 3: Concurrent Duplicate Recharge Storm
  // -------------------------------------------------------------
  console.log("\n▶ [Benchmark 3] Stress Testing Duplicate Recharge Race Condition...");

  const burstMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const burstAmount = 499;
  const burstConcurrentRequests = 10;

  console.log(`  -> Firing ${burstConcurrentRequests} simultaneous duplicate recharges for mobile ${burstMobile}...`);

  const burstPromises = Array.from({ length: burstConcurrentRequests }).map(() =>
    rechargeHandler(createJsonRequest("/api/recharge", "POST", {
      mobileNumber: burstMobile,
      operatorId: testOperator.id,
      amount: burstAmount,
    }))
  );

  const burstResponses = await Promise.all(burstPromises);
  const statusCodes = burstResponses.map((r) => r.status);

  const successCount = statusCodes.filter((s) => s === 201).length;
  const duplicateConflictCount = statusCodes.filter((s) => s === 409).length;

  console.log(`  -> Response Codes Received: 201 (Created): ${successCount}, 409 (Duplicate Blocked): ${duplicateConflictCount}`);

  if (successCount !== 1) {
    throw new Error(`Duplicate race condition failure! Expected exactly 1 successful transaction, but got ${successCount}`);
  }

  if (duplicateConflictCount !== burstConcurrentRequests - 1) {
    throw new Error(`Expected ${burstConcurrentRequests - 1} rejections with 409 Conflict, but got ${duplicateConflictCount}`);
  }

  // Verify in database: exactly 1 record created
  const dbRecords = await prisma.rechargeTransaction.findMany({
    where: {
      mobileNumber: burstMobile,
      amount: burstAmount,
    },
  });

  if (dbRecords.length !== 1) {
    throw new Error(`Database integrity failure: expected 1 record in DB, found ${dbRecords.length}`);
  }

  console.log("  ✓ PASS: Atomic duplicate prevention succeeded under concurrent burst storm. Exactly 1 created, rest blocked.");

  // -------------------------------------------------------------
  // BENCHMARK 4: Event Hub Real-Time Dispatch Latency
  // -------------------------------------------------------------
  console.log("\n▶ [Benchmark 4] Real-time SSE / Event Hub Latency Benchmark...");

  const dispatchLatencies: number[] = [];
  const eventCount = 100;

  for (let i = 0; i < eventCount; i++) {
    const testTxId = `perf-txn-${i}-${Date.now()}`;
    await new Promise<void>((resolve) => {
      const start = performance.now();
      const unsubscribe = subscribeToTransactionUpdates((payload) => {
        if (payload.transactionId === testTxId) {
          const latency = performance.now() - start;
          dispatchLatencies.push(latency);
          unsubscribe();
          resolve();
        }
      });

      publishTransactionUpdate({
        transactionId: testTxId,
        status: "SUCCESS",
        updatedAt: new Date().toISOString(),
      });
    });
  }

  const avgEventLatency = dispatchLatencies.reduce((a, b) => a + b, 0) / dispatchLatencies.length;
  const p95EventLatency = calculatePercentile(dispatchLatencies, 95);
  console.log(`  ✓ Real-time event dispatch: avg=${avgEventLatency.toFixed(3)}ms, p95=${p95EventLatency.toFixed(3)}ms across 100 dispatches`);

  // -------------------------------------------------------------
  // FINAL PERFORMANCE REPORT TABLE
  // -------------------------------------------------------------
  console.log("\n==========================================================================================================");
  console.log("                                    PERFORMANCE BENCHMARK SUMMARY REPORT                                  ");
  console.log("==========================================================================================================");
  console.log(
    "Endpoint".padEnd(44) +
    "Reqs".padStart(6) +
    "Avg (ms)".padStart(11) +
    "p50 (ms)".padStart(11) +
    "p95 (ms)".padStart(11) +
    "p99 (ms)".padStart(11) +
    "RPS".padStart(10) +
    "Status".padStart(10)
  );
  console.log("-".repeat(106));

  for (const m of metricsReport) {
    const status = m.passTarget && m.successRate === 100 ? "PASS (<500ms)" : "FAIL";
    console.log(
      m.endpoint.padEnd(44) +
      String(m.totalRequests).padStart(6) +
      m.avgMs.toFixed(1).padStart(11) +
      m.p50Ms.toFixed(1).padStart(11) +
      m.p95Ms.toFixed(1).padStart(11) +
      m.p99Ms.toFixed(1).padStart(11) +
      m.throughputRps.toFixed(0).padStart(10) +
      status.padStart(13)
    );
  }
  console.log("==========================================================================================================\n");

  const allPassed = metricsReport.every((m) => m.passTarget && m.successRate === 100);
  if (!allPassed) {
    throw new Error("One or more performance metrics exceeded target SLA (<500ms response time)!");
  }

  console.log("🎉 ALL PERFORMANCE & LOAD BENCHMARKS MET AND PASSED PRODUCTION SLA (<500ms)!\n");
}

runPerformanceTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Performance test failed:", err);
    process.exit(1);
  });
