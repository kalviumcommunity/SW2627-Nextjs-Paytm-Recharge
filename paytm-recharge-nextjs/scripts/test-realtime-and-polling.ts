import {
  publishTransactionUpdate,
  subscribeToTransactionUpdates,
  subscribeToSingleTransactionUpdate,
} from "../lib/events.server";

import { getBatchRechargeStatus } from "../services/status.server";
import { prisma } from "../lib/prisma";

async function runTests() {
  console.log("=== Running Real-Time SSE / WebSocket & Polling Verification ===");

  // 1. Test Event Bus subscription
  console.log("\n[Test 1] Testing central event hub broadcast subscription...");
  let receivedBroadcast = false;
  const unsubscribeAll = subscribeToTransactionUpdates((payload) => {
    console.log("  -> Received broadcast event:", payload);
    if (payload.transactionId === "test-txn-123" && payload.status === "SUCCESS") {
      receivedBroadcast = true;
    }
  });

  publishTransactionUpdate({
    transactionId: "test-txn-123",
    status: "SUCCESS",
    updatedAt: new Date().toISOString(),
    mobileNumber: "9876543210",
    amount: 299,
    operatorName: "Jio",
  });

  unsubscribeAll();

  if (!receivedBroadcast) {
    throw new Error("Test 1 Failed: Broadcast event was not received by subscriber");
  }
  console.log("✓ Test 1 Passed: Event hub broadcast works properly.");

  // 2. Test targeted single-transaction subscription
  console.log("\n[Test 2] Testing targeted single transaction event subscription...");
  let receivedSingle = false;
  const unsubscribeSingle = subscribeToSingleTransactionUpdate("target-txn-456", (payload) => {
    console.log("  -> Received targeted single event:", payload);
    if (payload.transactionId === "target-txn-456" && payload.status === "FAILED") {
      receivedSingle = true;
    }
  });

  publishTransactionUpdate({
    transactionId: "target-txn-456",
    status: "FAILED",
    updatedAt: new Date().toISOString(),
  });

  unsubscribeSingle();

  if (!receivedSingle) {
    throw new Error("Test 2 Failed: Targeted event was not received by subscriber");
  }
  console.log("✓ Test 2 Passed: Targeted transaction subscription works properly.");

  // 3. Test Batch Status Querying from Database
  console.log("\n[Test 3] Testing batch status database lookup...");
  const recentTransactions = await prisma.rechargeTransaction.findMany({
    take: 3,
    select: { transactionId: true },
  });

  if (recentTransactions.length > 0) {
    const ids = recentTransactions.map((t) => t.transactionId);
    const batchResult = await getBatchRechargeStatus(ids);
    console.log(`  -> Batch queried ${ids.length} transactions, got ${batchResult.length} records.`);
    if (batchResult.length !== ids.length) {
      throw new Error(`Test 3 Failed: Expected ${ids.length} results, got ${batchResult.length}`);
    }
    console.log("✓ Test 3 Passed: Batch database lookup functions correctly.");
  } else {
    console.log("  -> No transactions in database to batch query, testing empty array lookup.");
    const emptyResult = await getBatchRechargeStatus([]);
    if (emptyResult.length !== 0) {
      throw new Error("Test 3 Failed: Empty query should return empty array");
    }
    console.log("✓ Test 3 Passed: Batch status handled empty list cleanly.");
  }

  console.log("\n=======================================================");
  console.log("ALL REAL-TIME SSE & OPTIMIZED POLLING TESTS PASSED! 🎉");
  console.log("=======================================================\n");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
