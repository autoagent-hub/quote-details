import { getAdminClient } from "./admin.server";

export async function logAdminAction(params: {
  adminId?: string;
  adminEmail?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    const admin = getAdminClient();
    if (!admin) return;

    await admin.from("audit_logs" as never).insert({
      admin_id: params.adminId ?? "system",
      admin_email: params.adminEmail ?? "admin@detailr.online",
      action: params.action,
      details: params.details ?? {},
      ip_address: params.ipAddress ?? "unknown",
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[audit-logger] Failed to record audit log:", err);
  }
}
