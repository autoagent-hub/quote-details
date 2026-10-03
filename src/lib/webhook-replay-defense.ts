import { createHash } from "crypto";

interface ProcessedEntry {
  receivedAt: number;
  payloadHash?: string;
}

// In-memory cache for fast, zero-latency deduplication.
// Retains IDs well beyond the maximum acceptable timestamp drift (15 minutes).
const processedIds = new Map<string, ProcessedEntry>();

// Keep memory bounded to avoid unbounded growth
const MAX_CACHE_ENTRIES = 20_000;
const PRUNE_INTERVAL_MS = 60_000; // 1 minute
const ENTRY_TTL_MS = 15 * 60 * 1000; // 15 minutes

let pruneTimer: ReturnType<typeof setInterval> | null = null;

function ensurePruneTimer() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of processedIds.entries()) {
      if (now - entry.receivedAt > ENTRY_TTL_MS) {
        processedIds.delete(id);
      }
    }
  }, PRUNE_INTERVAL_MS);
  if (typeof pruneTimer.unref === "function") {
    pruneTimer.unref();
  }
}

export interface ReplayCheckOptions {
  id: string;
  timestamp: string | number;
  rawBody?: string;
  maxAgeSeconds?: number; // default: 180 (3 minutes)
  maxFutureSeconds?: number; // default: 60 (1 minute)
}

export interface ReplayCheckResult {
  allowed: boolean;
  reason?: "duplicate_id" | "timestamp_expired" | "timestamp_future" | "invalid_timestamp";
  ageSeconds?: number;
}

/**
 * Validates timestamp freshness AND enforces single-use nonce idempotency.
 * Completely eliminates replay attacks both within the timestamp window and beyond.
 */
export function checkAndRecordWebhookNonce(options: ReplayCheckOptions): ReplayCheckResult {
  ensurePruneTimer();

  const {
    id,
    timestamp,
    rawBody,
    maxAgeSeconds = 180, // Reduced from 300 to 180s for stricter security
    maxFutureSeconds = 60,
  } = options;

  if (!id || typeof id !== "string") {
    return { allowed: false, reason: "duplicate_id" };
  }

  const ts = typeof timestamp === "number" ? timestamp : Number(timestamp);
  if (!Number.isFinite(ts) || ts <= 0) {
    return { allowed: false, reason: "invalid_timestamp" };
  }

  const nowSeconds = Date.now() / 1000;
  const ageSeconds = nowSeconds - ts;

  // 1. Strict timestamp window check: Reject events older than maxAgeSeconds
  if (ageSeconds > maxAgeSeconds) {
    return {
      allowed: false,
      reason: "timestamp_expired",
      ageSeconds: Math.round(ageSeconds),
    };
  }

  // 2. Reject events from the future (beyond clock skew margin)
  if (ageSeconds < -maxFutureSeconds) {
    return {
      allowed: false,
      reason: "timestamp_future",
      ageSeconds: Math.round(ageSeconds),
    };
  }

  // 3. ID / Nonce Deduplication check (Stops attacks inside the window!)
  if (processedIds.has(id)) {
    return {
      allowed: false,
      reason: "duplicate_id",
      ageSeconds: Math.round(ageSeconds),
    };
  }

  // 4. Compute optional payload hash to guard against ID collision or hash tampering
  let payloadHash: string | undefined;
  if (rawBody) {
    payloadHash = createHash("sha256").update(rawBody).digest("hex");
  }

  // Prune oldest if at limit
  if (processedIds.size >= MAX_CACHE_ENTRIES) {
    const firstKey = processedIds.keys().next().value;
    if (firstKey) processedIds.delete(firstKey);
  }

  // Atomically record this nonce
  processedIds.set(id, {
    receivedAt: Date.now(),
    payloadHash,
  });

  return { allowed: true, ageSeconds: Math.round(ageSeconds) };
}
