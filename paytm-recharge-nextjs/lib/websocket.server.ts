import type { Server as HTTPServer } from "http";
import type { EventEmitter } from "events";
import {
  subscribeToTransactionUpdates,
  TransactionStatusUpdatePayload,
} from "./events.server";

export interface WebSocketClientMessage {
  type: "subscribe" | "unsubscribe" | "ping";
  transactionIds?: string[];
}

export interface WebSocketServerMessage {
  type: "connected" | "status_update" | "pong" | "error";
  payload?: TransactionStatusUpdatePayload;
  timestamp: string;
}

interface GenericSocket extends EventEmitter {
  readyState: number;
  send: (data: string) => void;
  on: (event: string, listener: (...args: unknown[]) => void) => this;
}

interface GenericWSServer extends EventEmitter {
  on: (event: string, listener: (...args: unknown[]) => void) => this;
}

/**
 * WebSocket handler that attaches to a Node.js HTTP server.
 * Dispatches real-time transaction updates from the EventEmitter to connected WebSocket clients.
 */
export function setupWebSocketServer(httpServer: HTTPServer) {
  try {
    // Dynamic import to support environments where ws is optional
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebSocketServer } = require("ws");
    const wss = new WebSocketServer({ server: httpServer, path: "/api/ws" }) as GenericWSServer;

    wss.on("connection", (socketUnknown: unknown) => {
      const socket = socketUnknown as GenericSocket;
      const subscribedIds = new Set<string>();

      // Send initial connected message
      socket.send(
        JSON.stringify({
          type: "connected",
          timestamp: new Date().toISOString(),
        }),
      );

      // Listen for incoming messages from client
      socket.on("message", (raw: unknown) => {
        try {
          const rawStr = typeof raw === "string" ? raw : String(raw);
          const msg = JSON.parse(rawStr) as WebSocketClientMessage;
          if (msg.type === "subscribe" && msg.transactionIds) {
            msg.transactionIds.forEach((id) => subscribedIds.add(id));
          } else if (msg.type === "unsubscribe" && msg.transactionIds) {
            msg.transactionIds.forEach((id) => subscribedIds.delete(id));
          } else if (msg.type === "ping") {
            socket.send(
              JSON.stringify({
                type: "pong",
                timestamp: new Date().toISOString(),
              }),
            );
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      });

      // Subscribe to central event bus
      const unsubscribe = subscribeToTransactionUpdates(
        (payload: TransactionStatusUpdatePayload) => {
          if (
            subscribedIds.size === 0 ||
            subscribedIds.has(payload.transactionId)
          ) {
            if (socket.readyState === 1 /* OPEN */) {
              socket.send(
                JSON.stringify({
                  type: "status_update",
                  payload,
                  timestamp: new Date().toISOString(),
                }),
              );
            }
          }
        },
      );

      socket.on("close", () => {
        unsubscribe();
      });

      socket.on("error", () => {
        unsubscribe();
      });
    });

    return wss;
  } catch (error) {
    console.warn("WebSocket initialization skipped or ws package not installed:", error);
    return null;
  }
}
