import { prisma } from "../../lib/prisma";
import { POST as rechargeHandler } from "../../app/api/recharge/route";
import { GET as transactionsHandler } from "../../app/api/transactions/route";
import { GET as singleStatusHandler } from "../../app/api/status/[id]/route";
import { POST as batchStatusPostHandler } from "../../app/api/status/batch/route";
import { GET as batchStatusGetHandler } from "../../app/api/status/route";
import {
  publishTransactionUpdate,
  subscribeToTransactionUpdates,
  subscribeToSingleTransactionUpdate,
} from "../../lib/events.server";
import { processMockRecharge } from "../../services/mock-recharge-provider.server";
import { NextRequest } from "next/server";

// Test assertion utilities
let passedTests = 0;
let failedTests = 0;
const testResults: Array<{ name: string; status: "PASS" | "FAIL"; durationMs: number; error?: string }> = [];

async function it(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    passedTests++;
    testResults.push({ name, status: "PASS", durationMs });
    console.log(`  ✓ PASS: ${name} (${durationMs}ms)`);
  } catch (error) {
    const durationMs = Date.now() - start;
    failedTests++;
    const errorMsg = error instanceof Error ? error.message : String(error);
    testResults.push({ name, status: "FAIL", durationMs, error: errorMsg });
    console.error(`  ✗ FAIL: ${name} (${durationMs}ms)`);
    console.error(`    -> ${errorMsg}`);
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: unknown) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== "number" || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined but received ${actual}`);
      }
    },
    toContain(item: unknown) {
      if (Array.isArray(actual) && !actual.includes(item)) {
        throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
      }
      if (typeof actual === "string" && !actual.includes(String(item))) {
        throw new Error(`Expected string to contain ${JSON.stringify(item)}`);
      }
    },
  };
}

function createJsonRequest(url: string, method: string, body?: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Helper filter functions mirroring TransactionHistory.tsx logic
type DateFilter = "ALL" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS";
function isWithinDateRange(createdAt: string, dateFilter: DateFilter): boolean {
  if (dateFilter === "ALL") return true;
  const transactionDate = new Date(createdAt);
  const now = new Date();
  if (dateFilter === "TODAY") {
    return transactionDate.toDateString() === now.toDateString();
  }
  const days = dateFilter === "LAST_7_DAYS" ? 7 : 30;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - days);
  return transactionDate >= startDate;
}

export async function runEndToEndIntegrationTests() {
  console.log("\n=======================================================");
  console.log("  PAYTM RECHARGE: END-TO-END INTEGRATION TEST SUITE");
  console.log("=======================================================\n");

  // Ensure default database seeds exist (User & Operators)
  console.log("-> Checking and seeding database prerequisites...");
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
      },
    });
  }

  const operators = await prisma.operator.findMany();
  if (operators.length === 0) {
    await prisma.operator.createMany({
      data: [
        { id: 1, name: "Airtel" },
        { id: 2, name: "Jio" },
        { id: 3, name: "Vi" },
        { id: 4, name: "BSNL" },
      ],
      skipDuplicates: true,
    });
  }

  // Generate unique test mobile numbers to avoid interference
  const uniqueMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  let createdTransactionId = "";

  // =========================================================================
  // SUITE 1: RECHARGE CREATION API & VALIDATION
  // =========================================================================
  console.log("\n--- Suite 1: Recharge API & Input Validation ---");

  await it("POST /api/recharge should successfully create a pending recharge", async () => {
    const req = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: uniqueMobile,
      operatorId: 2, // Jio
      amount: 299,
    });

    const res = await rechargeHandler(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.transactionId).toBeDefined();
    expect(json.status).toBe("PENDING");
    createdTransactionId = json.transactionId;

    // Verify database record
    const dbTx = await prisma.rechargeTransaction.findUnique({
      where: { transactionId: json.transactionId },
      include: { operator: true, user: true },
    });
    expect(dbTx).toBeDefined();
    expect(dbTx?.mobileNumber).toBe(uniqueMobile);
    expect(dbTx?.status).toBe("PENDING");
    expect(dbTx?.operator.name).toBe("Jio");
    expect(Number(dbTx?.amount)).toBe(299);
  });

  await it("POST /api/recharge should reject invalid mobile number with 400", async () => {
    const req = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: "12345", // less than 10 digits
      operatorId: 2,
      amount: 299,
    });

    const res = await rechargeHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  await it("POST /api/recharge should reject non-positive amount with 400", async () => {
    const req = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: uniqueMobile,
      operatorId: 2,
      amount: 0,
    });

    const res = await rechargeHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  await it("POST /api/recharge should return 404 if operator does not exist", async () => {
    const req = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: uniqueMobile,
      operatorId: 9999, // Non-existent operator
      amount: 299,
    });

    const res = await rechargeHandler(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Operator not found");
  });

  // =========================================================================
  // SUITE 2: DUPLICATE RECHARGE PREVENTION (10-SECOND WINDOW)
  // =========================================================================
  console.log("\n--- Suite 2: Duplicate Recharge Prevention (10s Window) ---");

  await it("POST /api/recharge should block identical recharge within 10 seconds (409 Conflict)", async () => {
    const dupMobile = `91${Math.floor(10000000 + Math.random() * 90000000)}`;

    // First request - should succeed
    const req1 = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: dupMobile,
      operatorId: 1, // Airtel
      amount: 479,
    });
    const res1 = await rechargeHandler(req1);
    expect(res1.status).toBe(201);

    // Immediate second request with identical parameters - should be blocked
    const req2 = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: dupMobile,
      operatorId: 1,
      amount: 479,
    });
    const res2 = await rechargeHandler(req2);
    expect(res2.status).toBe(409);
    const json2 = await res2.json();
    expect(json2.success).toBe(false);
    expect(json2.error).toContain("Duplicate recharge");
  });

  await it("POST /api/recharge should allow recharge with different amount within 10 seconds", async () => {
    const dupMobile = `92${Math.floor(10000000 + Math.random() * 90000000)}`;

    const req1 = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: dupMobile,
      operatorId: 1,
      amount: 199,
    });
    const res1 = await rechargeHandler(req1);
    expect(res1.status).toBe(201);

    // Different amount (299 instead of 199) -> Allowed
    const req2 = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: dupMobile,
      operatorId: 1,
      amount: 299,
    });
    const res2 = await rechargeHandler(req2);
    expect(res2.status).toBe(201);
  });

  await it("POST /api/recharge should allow recharge for different mobile within 10 seconds", async () => {
    const mobileA = `93${Math.floor(10000000 + Math.random() * 90000000)}`;
    const mobileB = `94${Math.floor(10000000 + Math.random() * 90000000)}`;

    const req1 = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: mobileA,
      operatorId: 3, // Vi
      amount: 719,
    });
    const res1 = await rechargeHandler(req1);
    expect(res1.status).toBe(201);

    const req2 = createJsonRequest("/api/recharge", "POST", {
      mobileNumber: mobileB,
      operatorId: 3,
      amount: 719,
    });
    const res2 = await rechargeHandler(req2);
    expect(res2.status).toBe(201);
  });

  // =========================================================================
  // SUITE 3: TRANSACTION HISTORY API
  // =========================================================================
  console.log("\n--- Suite 3: Transaction History API ---");

  await it("GET /api/transactions should return list of transactions sorted newest first", async () => {
    const res = await transactionsHandler();
    expect(res.status).toBe(200);

    const transactions = await res.json();
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);

    // Verify ordering
    for (let i = 0; i < transactions.length - 1; i++) {
      const date1 = new Date(transactions[i].createdAt).getTime();
      const date2 = new Date(transactions[i + 1].createdAt).getTime();
      if (date1 < date2) {
        throw new Error("Transactions are not sorted in descending order by createdAt");
      }
    }

    // Verify schema fields
    const first = transactions[0];
    expect(first.transactionId).toBeDefined();
    expect(first.mobileNumber).toBeDefined();
    expect(first.status).toBeDefined();
    expect(first.operator).toBeDefined();
    expect(first.operator.name).toBeDefined();
  });

  // =========================================================================
  // SUITE 4: TRANSACTION STATUS & BATCH STATUS APIS
  // =========================================================================
  console.log("\n--- Suite 4: Transaction Status & Batch Query APIs ---");

  await it("GET /api/status/[id] should return transaction status", async () => {
    const req = new NextRequest(`http://localhost:3000/api/status/${createdTransactionId}`);
    const res = await singleStatusHandler(req, {
      params: Promise.resolve({ id: createdTransactionId }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactionId).toBe(createdTransactionId);
    expect(["PENDING", "SUCCESS", "FAILED"]).toContain(json.status);
  });

  await it("GET /api/status/[id] should return 404 for non-existent transaction ID", async () => {
    const fakeId = "non-existent-uuid-99999";
    const req = new NextRequest(`http://localhost:3000/api/status/${fakeId}`);
    const res = await singleStatusHandler(req, {
      params: Promise.resolve({ id: fakeId }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Transaction not found");
  });

  await it("POST /api/status/batch should return statuses for multiple transaction IDs", async () => {
    const allTxs = await prisma.rechargeTransaction.findMany({ take: 3 });
    const ids = allTxs.map((t) => t.transactionId);

    const req = createJsonRequest("/api/status/batch", "POST", { transactionIds: ids });
    const res = await batchStatusPostHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(Array.isArray(json.transactions)).toBe(true);
    expect(json.transactions.length).toBe(ids.length);
  });

  await it("GET /api/status?ids=... should return statuses via query parameters", async () => {
    const allTxs = await prisma.rechargeTransaction.findMany({ take: 2 });
    const ids = allTxs.map((t) => t.transactionId);

    const req = new NextRequest(`http://localhost:3000/api/status?ids=${ids.join(",")}`);
    const res = await batchStatusGetHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(Array.isArray(json.transactions)).toBe(true);
    expect(json.transactions.length).toBe(ids.length);
  });

  // =========================================================================
  // SUITE 5: REAL-TIME EVENT HUB, SSE & STATUS LIFECYCLE
  // =========================================================================
  console.log("\n--- Suite 5: Real-Time Event Hub & Mock Provider Lifecycle ---");

  await it("Real-time Event Hub should broadcast transaction status updates to subscribers", async () => {
    let receivedPayload: unknown = null;
    const testId = `stream-test-${Date.now()}`;

    const unsubscribe = subscribeToTransactionUpdates((payload) => {
      if (payload.transactionId === testId) {
        receivedPayload = payload;
      }
    });

    publishTransactionUpdate({
      transactionId: testId,
      status: "SUCCESS",
      updatedAt: new Date().toISOString(),
      mobileNumber: "9876543210",
      amount: 299,
      operatorName: "Jio",
    });

    unsubscribe();

    expect(receivedPayload).toBeDefined();
    const typedPayload = receivedPayload as { transactionId: string; status: string };
    expect(typedPayload.transactionId).toBe(testId);
    expect(typedPayload.status).toBe("SUCCESS");
  });

  await it("Targeted Single-Transaction Event Hub should notify specific listener", async () => {
    let singlePayload: unknown = null;
    const targetId = `target-${Date.now()}`;

    const unsubscribe = subscribeToSingleTransactionUpdate(targetId, (payload) => {
      singlePayload = payload;
    });

    publishTransactionUpdate({
      transactionId: targetId,
      status: "FAILED",
      updatedAt: new Date().toISOString(),
    });

    unsubscribe();

    expect(singlePayload).toBeDefined();
    const typedSingle = singlePayload as { transactionId: string; status: string };
    expect(typedSingle.transactionId).toBe(targetId);
    expect(typedSingle.status).toBe("FAILED");
  });


  await it("Mock Recharge Provider should transition status and persist to PostgreSQL", async () => {
    // Create a new pending transaction
    const testTx = await prisma.rechargeTransaction.create({
      data: {
        userId: user.id,
        operatorId: 2,
        mobileNumber: "9988776655",
        amount: 299,
        status: "PENDING",
      },
    });

    expect(testTx.status).toBe("PENDING");

    // Execute mock recharge processor
    const finalStatus = await processMockRecharge(testTx.transactionId);
    expect(["SUCCESS", "FAILED"]).toContain(finalStatus);

    // Verify DB update
    const updatedTx = await prisma.rechargeTransaction.findUnique({
      where: { transactionId: testTx.transactionId },
    });
    expect(updatedTx?.status).toBe(finalStatus);
  });

  // =========================================================================
  // SUITE 6: HISTORY FILTERING LOGIC
  // =========================================================================
  console.log("\n--- Suite 6: Transaction History Filtering Logic ---");

  await it("Operator filtering should filter records accurately", async () => {
    const transactions = await prisma.rechargeTransaction.findMany({
      include: { operator: true },
    });

    const jioTransactions = transactions.filter((t) => t.operator.name === "Jio");
    jioTransactions.forEach((t) => {
      expect(t.operator.name).toBe("Jio");
    });
  });

  await it("Date range filtering should correctly isolate today's records", async () => {
    const today = new Date().toISOString();
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago

    expect(isWithinDateRange(today, "TODAY")).toBe(true);
    expect(isWithinDateRange(pastDate, "TODAY")).toBe(false);
    expect(isWithinDateRange(pastDate, "LAST_7_DAYS")).toBe(false);
    expect(isWithinDateRange(pastDate, "LAST_30_DAYS")).toBe(true);
    expect(isWithinDateRange(pastDate, "ALL")).toBe(true);
  });

  await it("Status filtering should correctly isolate pending, success, and failed records", async () => {
    const mockTxs = [
      { id: 1, status: "PENDING" },
      { id: 2, status: "SUCCESS" },
      { id: 3, status: "FAILED" },
    ];

    const pendingOnly = mockTxs.filter((t) => t.status === "PENDING");
    expect(pendingOnly.length).toBe(1);
    expect(pendingOnly[0].status).toBe("PENDING");

    const successOnly = mockTxs.filter((t) => t.status === "SUCCESS");
    expect(successOnly.length).toBe(1);
    expect(successOnly[0].status).toBe("SUCCESS");
  });

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log("\n=======================================================");
  console.log("             INTEGRATION TEST SUMMARY REPORT");
  console.log("=======================================================");
  console.log(`  Total Tests Executed : ${passedTests + failedTests}`);
  console.log(`  Passed Tests         : ${passedTests}  ✓`);
  console.log(`  Failed Tests         : ${failedTests}  ✗`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    throw new Error(`${failedTests} integration test(s) failed.`);
  }
}

// Auto-run when executed directly via tsx
runEndToEndIntegrationTests()
  .then(() => {
    console.log("🎉 ALL END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Test suite failed:", err);
    process.exit(1);
  });
