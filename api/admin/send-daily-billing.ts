import { json, parseBody, requireAdmin } from "./_shared.ts";

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed." });
    return;
  }

  const adminContext = await requireAdmin(request, response);
  if (!adminContext) return;

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.BILLING_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    json(response, 500, { error: "Missing email delivery environment variables." });
    return;
  }

  const body = await parseBody(request);
  const recipient = typeof body.recipient === "string" ? body.recipient.trim() : "";
  const pdfBase64 = typeof body.pdfBase64 === "string" ? body.pdfBase64.trim() : "";
  const filename = typeof body.filename === "string" ? body.filename.trim() : "daily-billing.pdf";
  const store = typeof body.store === "string" ? body.store.trim() : "Store";

  if (!recipient || !pdfBase64) {
    json(response, 400, { error: "Recipient and PDF payload are required." });
    return;
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        subject: `Daily billing statement · ${store}`,
        text: `Attached is the daily billing statement for ${store}.`,
        attachments: [
          {
            filename,
            content: pdfBase64,
          },
        ],
      }),
    });

    const rawPayload = await resendResponse.text();
    let payload: Record<string, any> = {};

    if (rawPayload) {
      try {
        payload = JSON.parse(rawPayload) as Record<string, any>;
      } catch {
        payload = {};
      }
    }

    if (!resendResponse.ok) {
      json(response, 500, {
        error: payload.message || payload.error || "Email delivery failed.",
      });
      return;
    }

    json(response, 200, { ok: true, id: payload.id ?? null });
  } catch (error) {
    json(response, 500, {
      error: error instanceof Error ? error.message : "Email delivery failed.",
    });
  }
}
