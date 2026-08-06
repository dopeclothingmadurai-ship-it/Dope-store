import "server-only";

import { emailConfig } from "./config";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; skipped: boolean; error: string };

/**
 * Send one transactional email via the Resend REST API (no SDK dependency).
 *
 * Resilient by contract: it never throws. If email is not configured, or the
 * request fails, it returns a result the caller can log and ignore — an email
 * problem must never block order creation, payment, or any other flow.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  if (!emailConfig.enabled || !emailConfig.apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping email:",
      input.subject,
    );
    return { ok: false, skipped: true, error: "email_not_configured" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailConfig.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(emailConfig.replyTo ? { reply_to: emailConfig.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[email] Resend responded ${response.status} for "${input.subject}": ${detail}`,
      );
      return { ok: false, skipped: false, error: `resend_${response.status}` };
    }

    const data = (await response.json().catch(() => null)) as {
      id?: string;
    } | null;
    return { ok: true, id: data?.id ?? null };
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return { ok: false, skipped: false, error: "network_error" };
  }
}
