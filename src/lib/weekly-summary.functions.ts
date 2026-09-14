import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminClient } from "@/lib/admin.server";
import { money } from "@/lib/pricing";
import { sendWelcomeEmail } from "@/lib/welcome-email.server";
import { requireAdminAuth } from "@/lib/admin-auth";

export interface WeeklyQuoteSummaryItem {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicle: string;
  serviceLabel: string;
  estimatedPrice: number;
  createdAt: string;
  isTest: boolean;
}

export interface WeeklySummaryData {
  detailerId: string;
  businessName: string;
  email: string;
  slug: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  totalQuotes: number;
  realQuotesCount: number;
  testQuotesCount: number;
  totalPipelineValue: number;
  averageQuoteValue: number;
  topService: string;
  recentQuotes: WeeklyQuoteSummaryItem[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderWeeklySummaryEmail(data: WeeklySummaryData): { html: string; text: string } {
  const formattedPipeline = money(data.totalPipelineValue, data.currency);
  const formattedAvg = money(data.averageQuoteValue, data.currency);
  const appUrl = process.env["PUBLIC_APP_URL"] || "https://detailr.online";
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;
  const quoteFormUrl = `${appUrl.replace(/\/$/, "")}/${data.slug}`;

  const quoteRowsHtml =
    data.recentQuotes.length > 0
      ? data.recentQuotes
          .map((q, idx) => {
            const dateStr = new Date(q.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });
            const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
            const badge = q.isTest
              ? '<span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;background-color:#f1f5f9;color:#64748b;margin-left:6px;">TEST</span>'
              : "";

            return `
              <tr style="background-color:${rowBg};border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 14px;font-size:13px;color:#0f172a;font-weight:600;vertical-align:middle;">
                  ${escapeHtml(q.customerName)}${badge}
                  <div style="font-size:11px;color:#64748b;font-weight:400;margin-top:2px;">
                    <a href="tel:${escapeHtml(q.customerPhone)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(q.customerPhone)}</a>
                  </div>
                </td>
                <td style="padding:12px 14px;font-size:12px;color:#334155;vertical-align:middle;">
                  <div style="font-weight:500;">${escapeHtml(q.serviceLabel || "Custom Detailing")}</div>
                  <div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(q.vehicle || "Standard")}</div>
                </td>
                <td style="padding:12px 14px;font-size:13px;color:#0f172a;font-weight:700;text-align:right;vertical-align:middle;">
                  ${money(q.estimatedPrice, data.currency)}
                  <div style="font-size:10px;color:#94a3b8;font-weight:400;margin-top:2px;">${dateStr}</div>
                </td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td colspan="3" style="padding:28px;text-align:center;color:#64748b;font-size:13px;">
              No quotes recorded in the past 7 days. Share your link to start capturing new leads!
            </td>
          </tr>
        `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Quote Summary - Detailr</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b1329;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.25), 0 10px 10px -5px rgba(0,0,0,0.1);border:1px solid #1e293b;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #090e1a 0%, #1e293b 100%);padding:32px 28px;text-align:left;border-bottom:1px solid #334155;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">
                      <span style="color:#38bdf8;">Detailr</span>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:4px;font-weight:500;">
                      Weekly Performance Report · A Nerochaze Company
                    </div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;padding:5px 12px;background-color:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);border-radius:20px;font-size:11px;font-weight:700;color:#38bdf8;">
                      7-DAY DIGEST
                    </span>
                  </td>
                </tr>
              </table>

              <div style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.1);">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                  ${escapeHtml(data.businessName)}
                </h1>
                <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">
                  Reporting period: <strong style="color:#cbd5e1;">${data.periodStart} – ${data.periodEnd}</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Summary Metric Cards -->
          <tr>
            <td style="padding:28px 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <!-- Card 1: Total Leads -->
                  <td width="31%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 12px;text-align:center;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">
                      Total Quotes
                    </div>
                    <div style="font-size:26px;font-weight:800;color:#0f172a;margin-top:6px;">
                      ${data.totalQuotes}
                    </div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:2px;">
                      ${data.realQuotesCount} customer leads
                    </div>
                  </td>

                  <td width="3%"></td>

                  <!-- Card 2: Pipeline Value -->
                  <td width="32%" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 12px;text-align:center;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#166534;">
                      Pipeline Value
                    </div>
                    <div style="font-size:26px;font-weight:800;color:#15803d;margin-top:6px;">
                      ${formattedPipeline}
                    </div>
                    <div style="font-size:10px;color:#166534;margin-top:2px;">
                      Estimated potential
                    </div>
                  </td>

                  <td width="3%"></td>

                  <!-- Card 3: Avg Ticket -->
                  <td width="31%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 12px;text-align:center;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">
                      Avg. Ticket
                    </div>
                    <div style="font-size:26px;font-weight:800;color:#0f172a;margin-top:6px;">
                      ${formattedAvg}
                    </div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:2px;">
                      Per request
                    </div>
                  </td>
                </tr>
              </table>

              ${
                data.topService
                  ? `
                <div style="margin-top:16px;padding:10px 14px;background-color:#eff6ff;border:1px solid #dbeafe;border-radius:8px;font-size:12px;color:#1e40af;display:flex;align-items:center;">
                  <span>★ <strong>Most Requested Service:</strong> ${escapeHtml(data.topService)}</span>
                </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Quotes Breakdown Table -->
          <tr>
            <td style="padding:12px 24px 24px 24px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <h3 style="margin:0;font-size:14px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">
                  Quotes Recorded This Week
                </h3>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#f1f5f9;border-bottom:1px solid #cbd5e1;">
                    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#475569;text-align:left;text-transform:uppercase;">Customer</th>
                    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#475569;text-align:left;text-transform:uppercase;">Package</th>
                    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#475569;text-align:right;text-transform:uppercase;">Estimate</th>
                  </tr>
                </thead>
                <tbody>
                  ${quoteRowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Action Button Banner -->
          <tr>
            <td style="padding:0 24px 28px 24px;text-align:center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;background-color:#0284c7;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:8px;box-shadow:0 4px 6px -1px rgba(2,132,199,0.4);">
                      Open Detailr Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:12px;font-size:11px;color:#64748b;">
                Share your public quote form with new prospects:
                <a href="${quoteFormUrl}" style="color:#0284c7;text-decoration:none;font-weight:600;">${quoteFormUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer Info -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 28px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b;line-height:1.6;">
              <div style="font-weight:600;color:#334155;margin-bottom:4px;">
                Detailr · Instant Auto Detailing Quotes &amp; Real-Time Telegram Alerts
              </div>
              <div>
                A product of <strong>Nerochaze</strong> · All rights reserved.
              </div>
              <div style="margin-top:8px;color:#94a3b8;">
                You received this weekly digest because you operate an active shop on <a href="https://detailr.online" style="color:#64748b;text-decoration:underline;">detailr.online</a>.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Detailr - Weekly Quote Summary for ${data.businessName}
Period: ${data.periodStart} - ${data.periodEnd}
A product of Nerochaze (detailr.online)

--- SUMMARY ---
Total Quotes: ${data.totalQuotes} (${data.realQuotesCount} customer leads)
Total Pipeline Value: ${formattedPipeline}
Average Quote Value: ${formattedAvg}
Most Requested Service: ${data.topService || "Standard Packages"}

--- RECENT QUOTES ---
${data.recentQuotes.length > 0 ? data.recentQuotes.map((q) => `• ${q.customerName} (${q.customerPhone}) - ${q.serviceLabel} [${q.vehicle}]: ${money(q.estimatedPrice, data.currency)}`).join("\n") : "No quotes received this week."}

View and manage your leads on your Detailr Dashboard:
${dashboardUrl}

© ${new Date().getFullYear()} Nerochaze · Detailr (detailr.online)`;

  return { html, text };
}

async function sendResendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  const emailFrom = process.env["EMAIL_FROM"] || "noreply@detailr.online";
  const from = emailFrom.includes("<") ? emailFrom : `Detailr <${emailFrom}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
      reply_to: process.env["EMAIL_REPLY_TO"] ?? "support@detailr.online",
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
        "X-Mailer": "Detailr-Nerochaze-Summary/1.0",
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[weekly-summary] Resend API error [${res.status}]:`, errBody);
    throw new Error(`Failed to deliver email via Resend: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Gathers 7-day quote data for a specific detailer.
 */
export async function getWeeklySummaryData(detailerId: string): Promise<WeeklySummaryData | null> {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error("Server database connection unavailable.");
  }

  // 1. Fetch detailer profile
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, business_name, slug, currency")
    .eq("id", detailerId)
    .maybeSingle();

  if (profileErr || !profile) {
    return null;
  }

  // 2. Fetch detailer auth user email
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(detailerId);
  if (userErr || !userData?.user?.email) {
    return null;
  }

  // 3. Fetch quotes from past 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const { data: quotes, error: quotesErr } = await admin
    .from("quotes")
    .select(
      "id, customer_name, customer_phone, vehicle_type, vehicle_desc, service_label, estimated_price, created_at, is_test",
    )
    .eq("detailer_id", detailerId)
    .gte("created_at", sevenDaysAgoIso)
    .order("created_at", { ascending: false });

  if (quotesErr) {
    console.error("[weekly-summary] Error fetching quotes:", quotesErr.message);
  }

  const quoteList = quotes ?? [];
  const realQuotes = quoteList.filter((q) => !q.is_test);
  const testQuotes = quoteList.filter((q) => !!q.is_test);

  const totalPipeline = quoteList.reduce((acc, q) => acc + (Number(q.estimated_price) || 0), 0);
  const avgQuote = quoteList.length > 0 ? Math.round(totalPipeline / quoteList.length) : 0;

  // Find top requested service
  const serviceCounts: Record<string, number> = {};
  for (const q of quoteList) {
    const label = q.service_label || "Standard";
    serviceCounts[label] = (serviceCounts[label] || 0) + 1;
  }
  let topService = "";
  let topCount = 0;
  for (const [svc, count] of Object.entries(serviceCounts)) {
    if (count > topCount) {
      topService = svc;
      topCount = count;
    }
  }

  const periodStart = sevenDaysAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const periodEnd = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    detailerId,
    businessName: profile.business_name || "Detailing Shop",
    email: userData.user.email,
    slug: profile.slug || "",
    currency: profile.currency || "USD",
    periodStart,
    periodEnd,
    totalQuotes: quoteList.length,
    realQuotesCount: realQuotes.length,
    testQuotesCount: testQuotes.length,
    totalPipelineValue: totalPipeline,
    averageQuoteValue: avgQuote,
    topService,
    recentQuotes: quoteList.slice(0, 15).map((q) => ({
      id: q.id,
      customerName: q.customer_name || "Valued Client",
      customerPhone: q.customer_phone || "",
      vehicle: q.vehicle_desc || q.vehicle_type || "Vehicle",
      serviceLabel: q.service_label || "Detailing",
      estimatedPrice: Number(q.estimated_price) || 0,
      createdAt: q.created_at,
      isTest: !!q.isTest || !!q.is_test,
    })),
  };
}

/**
 * Server Function: Send weekly summary directly to the authenticated detailer's email.
 */
export const sendMyWeeklySummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const summaryData = await getWeeklySummaryData(context.userId);
    if (!summaryData) {
      throw new Error("Unable to locate detailer profile or registered email.");
    }

    const { html, text } = renderWeeklySummaryEmail(summaryData);
    const subject = `Your Detailr Weekly Digest: ${summaryData.totalQuotes} Quotes (${money(summaryData.totalPipelineValue, summaryData.currency)})`;

    const resendResult = await sendResendEmail({
      to: summaryData.email,
      subject,
      html,
      text,
    });

    return {
      success: true,
      email: summaryData.email,
      totalQuotes: summaryData.totalQuotes,
      totalPipelineValue: summaryData.totalPipelineValue,
      currency: summaryData.currency,
      resendId: (resendResult as { id?: string })?.id,
    };
  });

/**
 * Send weekly summary to a specific detailer by ID
 */
export async function sendWeeklySummaryToDetailer(
  detailerId: string,
  targetEmail?: string,
): Promise<{ success: boolean; quotesCount: number }> {
  const summaryData = await getWeeklySummaryData(detailerId);
  if (!summaryData) {
    throw new Error("Unable to locate detailer profile.");
  }

  const toEmail = targetEmail || summaryData.email;
  if (!toEmail) {
    throw new Error("No destination email address found for detailer.");
  }

  const { html, text } = renderWeeklySummaryEmail(summaryData);
  const subject = `Detailr Weekly Summary: ${summaryData.totalQuotes} Quotes for ${summaryData.businessName}`;

  await sendResendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });

  return {
    success: true,
    quotesCount: summaryData.totalQuotes,
  };
}

/**
 * Automated batch dispatcher: Runs for all active detailers who have quotes or an active profile.
 */
export async function dispatchAllWeeklySummaries(): Promise<{
  success: boolean;
  dispatchedCount: number;
  results: Array<{ email: string; businessName: string; quoteCount: number; success: boolean }>;
}> {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error("Admin client unavailable");
  }

  // Fetch all profiles
  const { data: profiles, error } = await admin.from("profiles").select("id, business_name, slug");

  if (error || !profiles) {
    throw new Error(`Failed to query profiles: ${error?.message}`);
  }

  const results: Array<{
    email: string;
    businessName: string;
    quoteCount: number;
    success: boolean;
  }> = [];
  let dispatchedCount = 0;

  for (const p of profiles) {
    try {
      const summary = await getWeeklySummaryData(p.id);
      if (!summary || !summary.email) continue;

      const { html, text } = renderWeeklySummaryEmail(summary);
      const subject = `Detailr Weekly Summary: ${summary.totalQuotes} Quotes for ${summary.businessName}`;

      await sendResendEmail({
        to: summary.email,
        subject,
        html,
        text,
      });

      dispatchedCount++;
      results.push({
        email: summary.email,
        businessName: summary.businessName,
        quoteCount: summary.totalQuotes,
        success: true,
      });
    } catch (err) {
      console.error(`[weekly-summary] Failed for profile ${p.id}:`, err);
    }
  }

  return {
    success: true,
    dispatchedCount,
    results,
  };
}

export const adminSendWelcomeEmailToAllActiveUsers = createServerFn({ method: "POST" })
  .handler(async () => {
    await requireAdminAuth();
    const admin = getAdminClient();
    if (!admin) {
      throw new Error("Admin client unavailable");
    }

    // Fetch all profiles
    const { data: profiles, error } = await admin.from("profiles").select("email, business_name");
    if (error || !profiles) {
      throw new Error(`Failed to fetch profiles: ${error?.message}`);
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const p of profiles) {
      if (!p.email) continue;
      try {
        await sendWelcomeEmail(p.email);
        sentCount++;
      } catch (err: unknown) {
        const e = err as Error;
        errors.push(`${p.email}: ${e.message}`);
      }
    }

    return {
      success: true,
      sentCount,
      totalUsers: profiles.length,
      errors,
      message: `Successfully dispatched onboarding welcome email to ${sentCount} active users.`,
    };
  });

