export async function sendWelcomeEmail(to: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.warn("[welcome-email] RESEND_API_KEY not configured, skipping welcome email.");
    return;
  }

  const emailFrom = process.env["EMAIL_FROM"] || "noreply@detailr.online";
  const from = emailFrom.includes("<") ? emailFrom : `Detailr <${emailFrom}>`;
  const rawUrl =
    process.env["PUBLIC_APP_URL"] || process.env["RENDER_EXTERNAL_URL"] || "https://detailr.online";
  const appUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  const logoUrl = `${appUrl.replace(/\/$/, "")}/favicon.png`;
  const banner1Url = `${appUrl.replace(/\/$/, "")}/detailr-branding-card.png`;
  const banner2Url = `${appUrl.replace(/\/$/, "")}/og-image.jpg`;
  const banner3Url = `${appUrl.replace(/\/$/, "")}/detailr-official.jpg`;
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;

  const subject = "Welcome to Detailr — Your Getting Started Guide & Next Steps";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Detailr</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Welcome to Detailr — your instant vehicle quote calculator and Telegram lead system is ready!</div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.15);overflow:hidden;">
          
          <!-- Top Header Brand Bar -->
          <tr>
            <td style="padding:32px 36px 24px 36px;border-bottom:1px solid #f1f5f9;background-color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <img src="${logoUrl}" width="42" height="42" alt="Detailr" style="display:block;border-radius:12px;width:42px;height:42px;object-fit:cover;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Detailr<span style="color:#0284c7;">.</span></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:8px 16px;background-color:#f0f9ff;color:#0369a1;font-size:12px;font-weight:700;border-radius:8px;text-decoration:none;">Open Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Welcome Section -->
          <tr>
            <td style="padding:40px 36px 30px 36px;background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);color:#ffffff;text-align:center;">
              <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:34px;">You're All Set, Detailer!</h1>
              <p style="margin:0;font-size:15px;line-height:24px;color:#e0f2fe;max-width:480px;margin-left:auto;margin-right:auto;">
                Welcome to Detailr. You now have a high-converting instant quote calculator and real-time Telegram lead alerts built exclusively for professional mobile auto detailers.
              </p>
            </td>
          </tr>

          <!-- Step 1 -->
          <tr>
            <td style="padding:36px 36px 20px 36px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:4px 10px;background-color:#e0f2fe;color:#0369a1;font-size:11px;font-weight:800;border-radius:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Step 1 of 3</span>
                    <h2 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#0f172a;">Configure Your Pricing & Services</h2>
                    <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#475569;">
                      Set your business name, adjust your service tiers (e.g., Ceramic Coating, Full Interior Detail, Maintenance Wash), and set vehicle size multipliers in your dashboard.
                    </p>
                    <div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background-color:#f8fafc;">
                      <img src="${banner1Url}" alt="Step 1 Pricing Matrix" width="528" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Step 2 -->
          <tr>
            <td style="padding:36px 36px 20px 36px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:4px 10px;background-color:#dcfce7;color:#15803d;font-size:11px;font-weight:800;border-radius:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Step 2 of 3</span>
                    <h2 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#0f172a;">Connect Telegram for Instant Lead Alerts</h2>
                    <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#475569;">
                      Never miss a client quote! Link your Telegram bot with one click so every customer request, vehicle photo, and price breakdown drops directly into your phone instantly.
                    </p>
                    <div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background-color:#f8fafc;">
                      <img src="${banner2Url}" alt="Step 2 Telegram Alerts" width="528" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Step 3 -->
          <tr>
            <td style="padding:36px 36px 30px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:4px 10px;background-color:#f3e8ff;color:#7e22ce;font-size:11px;font-weight:800;border-radius:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Step 3 of 3</span>
                    <h2 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#0f172a;">Share Your Quote Link Everywhere</h2>
                    <p style="margin:0 0 18px 0;font-size:14px;line-height:22px;color:#475569;">
                      Add your personalized booking link (e.g. <strong style="color:#0f172a;">detailr.online/your-business</strong>) to your Instagram bio, Google Business profile, and text messages.
                    </p>
                    <div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background-color:#f8fafc;">
                      <img src="${banner3Url}" alt="Step 3 Share Your Link" width="528" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Call To Action Button -->
          <tr>
            <td align="center" style="padding:10px 36px 40px 36px;">
              <a href="${dashboardUrl}" style="display:inline-block;background-color:#0284c7;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 12px rgba(2,132,199,0.3);">
                Go to Your Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#64748b;">Detailr · Instant Vehicle Quotes & Real-Time Telegram Leads</p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                Built for professional mobile auto detailers · <a href="https://detailr.online" style="color:#0284c7;text-decoration:none;">detailr.online</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Welcome to Detailr!

You're all set! You now have a high-converting instant quote calculator and real-time Telegram lead alerts built for professional mobile auto detailers.

Step 1: Configure Your Pricing & Services
Set your business name, pricing matrix, add-ons, and vehicle size multipliers in your dashboard.

Step 2: Connect Telegram for Instant Lead Alerts
Link your Telegram bot so every customer quote request and photo drops directly into your phone instantly.

Step 3: Share Your Quote Link Everywhere
Add your personalized booking link (detailr.online/your-business) to your Instagram bio, website, and business cards.

Open your dashboard to get started: ${dashboardUrl}

Detailr · detailr.online`;

  try {
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
        headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[welcome-email] send failed [${res.status}]: ${errText}`);
    }
  } catch (err) {
    console.error("[welcome-email] failed to dispatch email:", err);
  }
}
