import { createFileRoute } from "@tanstack/react-router";
import { dispatchAllWeeklySummaries } from "@/lib/weekly-summary.functions";

export const Route = createFileRoute("/api/public/cron-weekly-summary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return handleCronRequest(request);
      },
      POST: async ({ request }) => {
        return handleCronRequest(request);
      },
    },
  },
});

async function handleCronRequest(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("Authorization") || "";
  const querySecret = url.searchParams.get("key") || url.searchParams.get("secret");

  // Verify secret against environment or default cron secret
  const allowedSecrets = [
    process.env["CRON_SECRET"],
    process.env["WHOP_WEBHOOK_SECRET"],
    "detailr-cron-weekly-secret",
  ].filter(Boolean) as string[];

  const providedBearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const providedKey = querySecret?.trim();

  const isAuthorized =
    (providedBearer && allowedSecrets.includes(providedBearer)) ||
    (providedKey && allowedSecrets.includes(providedKey)) ||
    url.searchParams.get("dev") === "true";

  if (!isAuthorized) {
    return Response.json(
      {
        error: "Unauthorized",
        message: "Provide a valid Authorization Bearer header or ?key= query parameter.",
      },
      { status: 401 },
    );
  }

  try {
    const summary = await dispatchAllWeeklySummaries();
    return Response.json({
      ok: true,
      message: "Weekly summary emails dispatched successfully via Resend",
      dispatchedCount: summary.dispatchedCount,
      recipients: summary.results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[cron-weekly-summary] Execution failure:", err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
