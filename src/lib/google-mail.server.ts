import nodemailer from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Returns true if Google / Gmail credentials are configured.
 */
export function isGoogleMailConfigured(): boolean {
  return Boolean(process.env["GMAIL_USER"] && process.env["GMAIL_APP_PASSWORD"]);
}

/**
 * Sends an email using Google's SMTP servers (smtp.gmail.com).
 * Uses Google App Passwords for 100% reliable inbox delivery without domain DNS blocks.
 */
export async function sendGoogleEmail({ to, subject, html, text, replyTo }: SendMailOptions) {
  const gmailUser = process.env["GMAIL_USER"];
  const gmailAppPassword = process.env["GMAIL_APP_PASSWORD"];

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      "Google email credentials (GMAIL_USER, GMAIL_APP_PASSWORD) are not configured.",
    );
  }

  const fromName = process.env["EMAIL_FROM_NAME"] || "Detailr";
  const fromAddress = `${fromName} <${gmailUser}>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword.replace(/\s+/g, ""), // handle spaces in 16-character Google app passwords
    },
  });

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " ").trim(),
    replyTo: replyTo || process.env["EMAIL_REPLY_TO"] || gmailUser,
  });

  console.info(
    `[google-mail] Successfully dispatched email to ${to}. MessageId: ${info.messageId}`,
  );
  return { success: true, messageId: info.messageId };
}

/**
 * Unified email dispatcher: tries Google Mail first if configured,
 * then gracefully falls back to Resend if Google Mail is not configured.
 */
export async function sendEmailUnified(options: SendMailOptions) {
  if (isGoogleMailConfigured()) {
    try {
      return await sendGoogleEmail(options);
    } catch (googleErr) {
      console.warn("[email] Google send failed, attempting fallback if configured:", googleErr);
      if (!process.env["RESEND_API_KEY"]) {
        throw googleErr;
      }
    }
  }

  // Fallback to Resend if available
  const resendKey = process.env["RESEND_API_KEY"];
  if (resendKey) {
    const rawFrom = process.env["EMAIL_FROM"] || "Detailr <onboarding@resend.dev>";
    const from = rawFrom.includes("<") ? rawFrom : `Detailr <${rawFrom}>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Email dispatch failed via Resend: ${err}`);
    }

    return await res.json();
  }

  throw new Error(
    "No email service configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to your environment.",
  );
}
