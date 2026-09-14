import { createServerFn } from "@tanstack/react-start";

type Purpose = "signup" | "recovery";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + ((bytes[0] ?? 0) % 900000));
}

async function hashCode(email: string, purpose: string, code: string) {
  const data = new TextEncoder().encode(`${email}:${purpose}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function emailHtml(code: string, purpose: Purpose) {
  const heading = purpose === "signup" ? "Confirm your email" : "Reset your password";
  const intro =
    purpose === "signup"
      ? "Use the code below to finish creating your QuoteFlow account."
      : "Use the code below to set a new password for your QuoteFlow account.";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${heading} — your QuoteFlow code is ${code}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;border:1px solid #e5e7eb;border-radius:12px;">
        <tr><td style="padding:28px 28px 8px 28px;">
          <p style="margin:0;font-size:18px;font-weight:bold;">QuoteFlow</p>
        </td></tr>
        <tr><td style="padding:0 28px;">
          <h1 style="margin:12px 0 8px 0;font-size:20px;">${heading}</h1>
          <p style="margin:0 0 20px 0;font-size:14px;line-height:22px;color:#4b5563;">${intro}</p>
          <p style="margin:0 0 20px 0;font-size:32px;font-weight:bold;letter-spacing:8px;">${code}</p>
          <p style="margin:0 0 8px 0;font-size:13px;line-height:20px;color:#6b7280;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:20px 28px 28px 28px;">
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 12px 0;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Sent by QuoteFlow · detailr.online</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendCodeEmail(to: string, code: string, purpose: Purpose) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) throw new Error("Email sending is not configured yet.");
  const emailFrom = process.env["EMAIL_FROM"] || "noreply@detailr.online";
  const from = emailFrom.includes("<") ? emailFrom : `QuoteFlow <${emailFrom}>`;
  const subject =
    purpose === "signup"
      ? `${code} is your QuoteFlow confirmation code`
      : `${code} is your QuoteFlow password reset code`;

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
      html: emailHtml(code, purpose),
      text: `${purpose === "signup" ? "Confirm your email" : "Reset your password"}\n\nYour QuoteFlow code is ${code}. It expires in 10 minutes.\n\nIf you didn't request this, ignore this email.\n\nQuoteFlow · detailr.online`,
      reply_to: process.env["EMAIL_REPLY_TO"] ?? "support@detailr.online",
      headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[resend] send failed [${res.status}]: ${body}`);
    throw new Error("We couldn't send the email right now. Please try again.");
  }
}

export const requestAuthCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; purpose: Purpose }) => input)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    const purpose: Purpose = data.purpose === "recovery" ? "recovery" : "signup";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");

    const { getAdminClient } = await import("@/lib/admin.server");
    const admin = getAdminClient();
    if (!admin) throw new Error("Server is not configured.");

    const { data: recent } = await admin
      .from("auth_codes" as never)
      .select("created_at")
      .eq("email", email)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1);
    const last = (recent as { created_at: string }[] | null)?.[0];
    if (last && Date.now() - new Date(last.created_at).getTime() < RESEND_COOLDOWN_MS) {
      throw new Error("Please wait a moment before requesting another code.");
    }

    const code = generateCode();
    const code_hash = await hashCode(email, purpose, code);

    const { error } = await admin.from("auth_codes" as never).insert({
      email,
      purpose,
      code_hash,
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    } as never);
    if (error) {
      console.error("[auth-codes] insert failed", error);
      throw new Error("Could not start verification. Please try again.");
    }

    await sendCodeEmail(email, code, purpose);
    return { sent: true };
  });

async function consumeCode(email: string, purpose: Purpose, code: string) {
  const { getAdminClient } = await import("@/lib/admin.server");
  const admin = getAdminClient();
  if (!admin) throw new Error("Server is not configured.");

  const { data } = await admin
    .from("auth_codes" as never)
    .select("id, code_hash, expires_at, consumed_at, attempts")
    .eq("email", email)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1);

  const row = (
    data as
      | {
          id: string;
          code_hash: string;
          expires_at: string;
          consumed_at: string | null;
          attempts: number;
        }[]
      | null
  )?.[0];

  if (!row || row.consumed_at) throw new Error("Request a new code to continue.");
  if (new Date(row.expires_at).getTime() < Date.now())
    throw new Error("That code expired. Request a new one.");
  if (row.attempts >= MAX_ATTEMPTS) throw new Error("Too many attempts. Request a new code.");

  const hash = await hashCode(email, purpose, code.trim());
  if (hash !== row.code_hash) {
    await admin
      .from("auth_codes" as never)
      .update({ attempts: row.attempts + 1 } as never)
      .eq("id", row.id);
    throw new Error("That code isn't right. Check it and try again.");
  }

  await admin
    .from("auth_codes" as never)
    .update({ consumed_at: new Date().toISOString() } as never)
    .eq("id", row.id);

  return admin;
}

export const verifySignupCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string; password: string }) => input)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    if (!data.password || data.password.length < 6)
      throw new Error("Password must be at least 6 characters.");
    const admin = await consumeCode(email, "signup", data.code);

    const { error } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (error) {
      if (/already/i.test(error.message))
        throw new Error("An account with this email already exists. Sign in instead.");
      console.error("[auth-codes] createUser failed", error);
      throw new Error("Could not create your account. Please try again.");
    }
    return { ok: true };
  });

export const verifyRecoveryCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string; password: string }) => input)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    if (!data.password || data.password.length < 6)
      throw new Error("Password must be at least 6 characters.");
    const admin = await consumeCode(email, "recovery", data.code);

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    const userId = link?.user?.id;
    if (linkError || !userId) throw new Error("No account found for that email.");

    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: data.password,
      email_confirm: true,
    });
    if (error) {
      console.error("[auth-codes] password update failed", error);
      throw new Error("Could not reset your password. Please try again.");
    }
    return { ok: true };
  });
