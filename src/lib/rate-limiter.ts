// Simple in-memory sliding window rate limiter for public-facing API routes
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 60; // 60 requests per minute per IP

export function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let record = ipRequestMap.get(clientIp);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + WINDOW_MS };
    ipRequestMap.set(clientIp, record);
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  record.count++;
  if (record.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS - record.count };
}
