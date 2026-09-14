// Real-time error tracking and reporting service
type ErrorReport = {
  message: string;
  stack?: string;
  context?: string;
  timestamp: string;
  userEmail?: string;
};

const capturedErrors: ErrorReport[] = [];
const MAX_ERRORS = 100;

export function trackError(error: unknown, context?: string, userEmail?: string) {
  const errObj = error instanceof Error ? error : new Error(String(error));
  const report: ErrorReport = {
    message: errObj.message,
    stack: errObj.stack,
    context: context ?? "unknown",
    timestamp: new Date().toISOString(),
    userEmail,
  };

  capturedErrors.unshift(report);
  if (capturedErrors.length > MAX_ERRORS) {
    capturedErrors.pop();
  }

  console.error(`[ErrorTracker] [${context}]`, errObj);
}

export function getCapturedErrors(): ErrorReport[] {
  return [...capturedErrors];
}
