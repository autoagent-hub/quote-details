export async function sendWelcomeEmail(to: string, businessName?: string, slug?: string) {
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

  const logoUrl = `${appUrl.replace(/\/$/, "")}/logo.png`;
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;
  const shopName = businessName?.trim() || "Detailer";
  const userSlug = slug?.trim() || "your-shop";
  const liveQuoteUrl = `${appUrl.replace(/\/$/, "")}/${userSlug}`;

  const subject = "Welcome to Detailr — Complete Your 4 Setup Steps";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Detailr</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Welcome to Detailr! Follow these 4 simple steps to launch your automated quote calculator and Telegram lead alerts.</div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#ffffff;border-radius:24px;box-shadow:0 12px 30px rgba(0,0,0,0.18);overflow:hidden;">
          
          <!-- Top Header Brand Bar -->
          <tr>
            <td style="padding:28px 36px 20px 36px;border-bottom:1px solid #f1f5f9;background-color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <img src="${logoUrl}" width="40" height="40" alt="Detailr" style="display:block;border-radius:12px;width:40px;height:40px;object-fit:cover;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Detailr<span style="color:#0284c7;">.</span></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:8px 16px;background-color:#f0f9ff;color:#0369a1;font-size:12px;font-weight:700;border-radius:10px;text-decoration:none;">Open Dashboard →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Welcome Section -->
          <tr>
            <td style="padding:36px 36px 28px 36px;background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);color:#ffffff;text-align:center;">
              <h1 style="margin:0 0 10px 0;font-size:25px;font-weight:800;letter-spacing:-0.5px;line-height:32px;">Welcome back, ${shopName}! 👋</h1>
              <p style="margin:0;font-size:14px;line-height:22px;color:#e0f2fe;max-width:480px;margin-left:auto;margin-right:auto;">
                Complete these 4 simple steps to launch your automated quote calculator and capture high-intent customer leads 24/7.
              </p>
            </td>
          </tr>

          <!-- STEP 1 WIDGET CARD -->
          <tr>
            <td style="padding:28px 36px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Header -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                      <tr>
                        <td style="padding-right:8px;">
                          <span style="display:inline-block;padding:3px 10px;background-color:#f3e8ff;color:#7e22ce;font-size:11px;font-weight:800;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">Step 1 of 4</span>
                        </td>
                        <td>
                          <span style="display:inline-block;padding:3px 8px;background-color:#fef3c7;color:#b45309;font-size:10px;font-weight:700;border-radius:6px;">Recommended</span>
                        </td>
                      </tr>
                    </table>

                    <h2 style="margin:0 0 6px 0;font-size:18px;font-weight:800;color:#0f172a;">1. Profile Setup</h2>
                    <p style="margin:0 0 14px 0;font-size:13px;line-height:20px;color:#475569;">
                      Personalize your shop identity, phone number, and quote URL slug so customers know who they are booking with.
                    </p>

                    <!-- Widget Card Box Component -->
                    <div style="border:1px solid #e2e8f0;border-radius:16px;background-color:#f8fafc;padding:16px;margin-bottom:14px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="42" style="vertical-align:middle;padding-right:12px;">
                            <div style="width:40px;height:40px;border-radius:12px;background-color:#e0f2fe;color:#0284c7;font-weight:800;font-size:15px;line-height:40px;text-align:center;">
                              ${shopName.charAt(0).toUpperCase()}
                            </div>
                          </td>
                          <td style="vertical-align:middle;">
                            <div style="font-size:13px;font-weight:800;color:#0f172a;">${shopName}</div>
                            <div style="font-size:11px;color:#64748b;margin-top:2px;">Contact Phone • detailr.online/${userSlug}</div>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="font-size:11px;font-weight:700;color:#0284c7;background-color:#e0f2fe;padding:4px 8px;border-radius:6px;">Profile Info</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Call To Action Button -->
                    <a href="${dashboardUrl}" style="display:inline-block;padding:10px 20px;background-color:#0284c7;color:#ffffff;font-size:13px;font-weight:700;border-radius:10px;text-decoration:none;box-shadow:0 3px 8px rgba(2,132,199,0.25);">
                      Complete Shop Profile →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- STEP 2 WIDGET CARD -->
          <tr>
            <td style="padding:28px 36px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Header -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                      <tr>
                        <td style="padding-right:8px;">
                          <span style="display:inline-block;padding:3px 10px;background-color:#fef3c7;color:#b45309;font-size:11px;font-weight:800;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">Step 2 of 4</span>
                        </td>
                        <td>
                          <span style="display:inline-block;padding:3px 8px;background-color:#dcfce7;color:#15803d;font-size:10px;font-weight:700;border-radius:6px;">✓ Pre-Loaded Rates</span>
                        </td>
                      </tr>
                    </table>

                    <h2 style="margin:0 0 6px 0;font-size:18px;font-weight:800;color:#0f172a;">2. Review Prices & Packages</h2>
                    <p style="margin:0 0 14px 0;font-size:13px;line-height:20px;color:#475569;">
                      Standard detailing rates are loaded for Sedans, SUVs, and Trucks with add-ons. Customize your prices anytime.
                    </p>

                    <!-- Widget Card Box Component -->
                    <div style="border:1px solid #e2e8f0;border-radius:16px;background-color:#f8fafc;padding:16px;margin-bottom:14px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <div style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:4px;">
                              Sedan $150 &nbsp;•&nbsp; SUV $190 &nbsp;•&nbsp; Truck $210
                            </div>
                            <div style="font-size:11px;color:#64748b;">
                              Formula: [Base Package] + [Vehicle Size Fee] + [Selected Add-ons]
                            </div>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="font-size:11px;font-weight:700;color:#15803d;background-color:#dcfce7;padding:4px 8px;border-radius:6px;">Live Formula</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Call To Action Button -->
                    <a href="${dashboardUrl}" style="display:inline-block;padding:10px 20px;background-color:#0284c7;color:#ffffff;font-size:13px;font-weight:700;border-radius:10px;text-decoration:none;box-shadow:0 3px 8px rgba(2,132,199,0.25);">
                      Review & Customize Rates →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- STEP 3 WIDGET CARD -->
          <tr>
            <td style="padding:28px 36px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Header -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                      <tr>
                        <td style="padding-right:8px;">
                          <span style="display:inline-block;padding:3px 10px;background-color:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:800;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">Step 3 of 4</span>
                        </td>
                        <td>
                          <span style="display:inline-block;padding:3px 8px;background-color:#e0f2fe;color:#0369a1;font-size:10px;font-weight:700;border-radius:6px;">Takes 30 seconds</span>
                        </td>
                      </tr>
                    </table>

                    <h2 style="margin:0 0 6px 0;font-size:18px;font-weight:800;color:#0f172a;">3. Connect Phone Alerts (Telegram)</h2>
                    <p style="margin:0 0 14px 0;font-size:13px;line-height:20px;color:#475569;">
                      Receive instant push notifications on your phone for every customer inquiry. No SMS carrier delays or fees.
                    </p>

                    <!-- Widget Card Box Component -->
                    <div style="border:1px solid #e2e8f0;border-radius:16px;background-color:#f8fafc;padding:16px;margin-bottom:14px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="36" style="vertical-align:middle;padding-right:10px;">
                            <div style="width:34px;height:34px;border-radius:10px;background-color:#e0f2fe;color:#0284c7;font-size:16px;line-height:34px;text-align:center;">
                              🔔
                            </div>
                          </td>
                          <td style="vertical-align:middle;">
                            <div style="font-size:12px;font-weight:800;color:#0f172a;">Free Telegram Push Alerts</div>
                            <div style="font-size:11px;color:#64748b;margin-top:2px;">Client name, phone number, vehicle type & requested service</div>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="font-size:11px;font-weight:700;color:#1d4ed8;background-color:#dbeafe;padding:4px 8px;border-radius:6px;">100% Free</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Call To Action Button -->
                    <a href="${dashboardUrl}" style="display:inline-block;padding:10px 20px;background-color:#0284c7;color:#ffffff;font-size:13px;font-weight:700;border-radius:10px;text-decoration:none;box-shadow:0 3px 8px rgba(2,132,199,0.25);">
                      Connect Free Telegram Bot →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- STEP 4 WIDGET CARD -->
          <tr>
            <td style="padding:28px 36px 36px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Header -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                      <tr>
                        <td style="padding-right:8px;">
                          <span style="display:inline-block;padding:3px 10px;background-color:#dcfce7;color:#15803d;font-size:11px;font-weight:800;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">Step 4 of 4</span>
                        </td>
                        <td>
                          <span style="display:inline-block;padding:3px 8px;background-color:#dcfce7;color:#15803d;font-size:10px;font-weight:700;border-radius:6px;">Ready for Leads</span>
                        </td>
                      </tr>
                    </table>

                    <h2 style="margin:0 0 6px 0;font-size:18px;font-weight:800;color:#0f172a;">4. Your Quote Link is Live</h2>
                    <p style="margin:0 0 14px 0;font-size:13px;line-height:20px;color:#475569;">
                      Your automated price calculator is live and ready for customers. Put this link in your Instagram bio or text it to prospects.
                    </p>

                    <!-- Widget Card Box Component -->
                    <div style="border:1px solid #e2e8f0;border-radius:16px;background-color:#f8fafc;padding:16px;margin-bottom:14px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">
                              Your Public Calculator Link:
                            </div>
                            <div style="font-family:monospace;font-size:13px;font-weight:800;color:#0284c7;">
                              ${liveQuoteUrl.replace(/^https?:\/\//, "")}
                            </div>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="font-size:11px;font-weight:700;color:#15803d;background-color:#dcfce7;padding:4px 8px;border-radius:6px;">● Live</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Call To Action Button -->
                    <a href="${liveQuoteUrl}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#0284c7;color:#ffffff;font-size:13px;font-weight:700;border-radius:10px;text-decoration:none;box-shadow:0 3px 8px rgba(2,132,199,0.25);">
                      Open Live Quote Link →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Master Call To Action -->
          <tr>
            <td align="center" style="padding:10px 36px 36px 36px;border-top:1px solid #f1f5f9;">
              <a href="${dashboardUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 4px 12px rgba(15,23,42,0.25);">
                Launch Your Detailr Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#64748b;">Detailr · Instant Vehicle Quotes & Real-Time Telegram Leads</p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                Built for professional mobile auto detailers · <a href="${appUrl}" style="color:#0284c7;text-decoration:none;">detailr.online</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Welcome to Detailr, ${shopName}!

Complete these 4 simple steps to launch your automated quote calculator and capture high-intent leads:

Step 1: Profile Setup
Set your shop name, contact phone number, and quote URL slug.
Complete profile: ${dashboardUrl}

Step 2: Review Prices & Packages
Standard detailing rates (Sedan $150, SUV $190, Truck $210) and vehicle uplift fees are ready. Adjust anytime.
Review prices: ${dashboardUrl}

Step 3: Connect Phone Alerts (Telegram)
Receive instant push notifications with customer name, phone number, vehicle type, and requested services.
Connect bot: ${dashboardUrl}

Step 4: Your Quote Link is Live
Your automated price calculator is live at ${liveQuoteUrl}. Share it in your Instagram bio, Google Profile, or text it to prospects.

Open your dashboard to get started: ${dashboardUrl}

Detailr · detailr.online`;

  try {
    let res = await fetch("https://api.resend.com/emails", {
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
      console.warn(
        `[welcome-email] primary send failed [${res.status}]: ${errText}. Retrying with onboarding@resend.dev...`,
      );

      // Fallback to Resend sandbox/testing sender if custom domain is unverified
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Detailr <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
          text,
          reply_to: process.env["EMAIL_REPLY_TO"] ?? "support@detailr.online",
          headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
        }),
      });

      if (!res.ok) {
        const fallbackErr = await res.text();
        console.error(`[welcome-email] fallback send failed [${res.status}]: ${fallbackErr}`);
        throw new Error(`Resend API error: ${fallbackErr}`);
      }
    }
  } catch (err) {
    console.error("[welcome-email] failed to dispatch email:", err);
    throw err;
  }
}
