import { EventEmitter } from "events";

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface TransactionStatusUpdatePayload {
  transactionId: string;
  status: TransactionStatus;
  updatedAt: string;
  mobileNumber?: string;
  amount?: number;
  operatorName?: string;
}

export interface TransactionCreatedPayload {
  transactionId: string;
  userId: number;
  operatorId: number;
  mobileNumber: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
}

const globalForEvents = globalThis as unknown as {
  transactionEventEmitter: EventEmitter | undefined;
};

export function getTransactionEventEmitter(): EventEmitter {
  if (!globalForEvents.transactionEventEmitter) {
    const emitter = new EventEmitter();
    // Allow large numbers of concurrent SSE / WS listeners without max listener warning
    emitter.setMaxListeners(100);
    globalForEvents.transactionEventEmitter = emitter;
  }
  return globalForEvents.transactionEventEmitter;
}

export const TRANSACTION_EVENTS = {
  STATUS_UPDATED: "transaction:status_updated",
  CREATED: "transaction:created",
  statusUpdatedForId: (transactionId: string) =>
    `transaction:${transactionId}:status_updated`,
} as const;

/**
 * Publish a transaction status update to all connected real-time streams (SSE & WebSockets).
 */
export function publishTransactionUpdate(payload: TransactionStatusUpdatePayload): void {
  const emitter = getTransactionEventEmitter();
  // Emit broadcast event
  emitter.emit(TRANSACTION_EVENTS.STATUS_UPDATED, payload);
  // Emit targeted event for specific transaction listener
  emitter.emit(
    TRANSACTION_EVENTS.statusUpdatedForId(payload.transactionId),
    payload,
  );
}

/**
 * Subscribe to status updates for all transactions.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToTransactionUpdates(
  listener: (payload: TransactionStatusUpdatePayload) => void,
): () => void {
  const emitter = getTransactionEventEmitter();
  emitter.on(TRANSACTION_EVENTS.STATUS_UPDATED, listener);
  return () => {
    emitter.off(TRANSACTION_EVENTS.STATUS_UPDATED, listener);
  };
}

/**
 * Subscribe to status updates for a specific transaction ID.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToSingleTransactionUpdate(
  transactionId: string,
  listener: (payload: TransactionStatusUpdatePayload) => void,
): () => void {
  const emitter = getTransactionEventEmitter();
  const eventName = TRANSACTION_EVENTS.statusUpdatedForId(transactionId);
  emitter.on(eventName, listener);
  return () => {
    emitter.off(eventName, listener);
  };
}
