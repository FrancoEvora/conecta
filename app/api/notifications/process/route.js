import { NextResponse } from "next/server";
import { rpc } from "@/lib/supabase";
import { applySessionCookies, getValidRouteSession } from "@/lib/session";

function brazilPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

function manualUrl(notification) {
  if (notification.channel === "email") {
    return `mailto:${encodeURIComponent(notification.recipient)}?subject=${encodeURIComponent(notification.subject || "Rede Conecta")}&body=${encodeURIComponent(notification.body)}`;
  }
  if (notification.channel === "whatsapp") {
    return `https://wa.me/${brazilPhone(notification.recipient)}?text=${encodeURIComponent(notification.body)}`;
  }
  return "";
}

async function sendEmail(notification) {
  if (process.env.NOTIFICATION_AUTOMATION_WEBHOOK_URL) {
    const response = await fetch(process.env.NOTIFICATION_AUTOMATION_WEBHOOK_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "email", notification })
    });
    if (!response.ok) throw new Error(`Webhook de e-mail retornou ${response.status}.`);
    const data = await response.json().catch(() => ({}));
    return { provider: "automation_webhook", providerMessageId: data.id || data.messageId || "" };
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return null;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [notification.recipient],
      subject: notification.subject || "Rede Conecta",
      text: notification.body
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Resend retornou ${response.status}.`);
  return { provider: "resend", providerMessageId: data.id || "" };
}

async function sendWhatsApp(notification) {
  if (process.env.WHATSAPP_AUTOMATION_WEBHOOK_URL) {
    const response = await fetch(process.env.WHATSAPP_AUTOMATION_WEBHOOK_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "whatsapp", recipient: brazilPhone(notification.recipient), body: notification.body, templateCode: notification.template_code, notificationId: notification.id })
    });
    if (!response.ok) throw new Error(`Webhook do WhatsApp retornou ${response.status}.`);
    const data = await response.json().catch(() => ({}));
    return { provider: "automation_webhook", providerMessageId: data.id || data.messageId || "" };
  }
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_GENERIC_TEMPLATE_NAME;
  if (!token || !phoneNumberId || !templateName) return null;
  const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: brazilPhone(notification.recipient),
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "pt_BR" },
        components: [{ type: "body", parameters: [{ type: "text", text: notification.body.slice(0, 1000) }] }]
      }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `WhatsApp retornou ${response.status}.`);
  return { provider: "meta_whatsapp", providerMessageId: data?.messages?.[0]?.id || "" };
}

export async function POST(request) {
  const session = await getValidRouteSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const notifications = await rpc("admin_claim_notifications", { p_limit: Math.min(Number(body.limit || 20), 50) }, { accessToken: session.accessToken });
    const results = [];
    for (const notification of Array.isArray(notifications) ? notifications : []) {
      try {
        const sent = notification.channel === "email" ? await sendEmail(notification) : notification.channel === "whatsapp" ? await sendWhatsApp(notification) : null;
        if (!sent) {
          const url = manualUrl(notification);
          await rpc("admin_complete_notification", { p_notification_id: notification.id, p_status: "manual_required", p_provider: "manual", p_provider_message_id: null, p_error: "Provedor automático não configurado." }, { accessToken: session.accessToken });
          results.push({ id: notification.id, status: "manual_required", channel: notification.channel, recipient: notification.recipient, subject: notification.subject, body: notification.body, manualUrl: url });
        } else {
          await rpc("admin_complete_notification", { p_notification_id: notification.id, p_status: "sent", p_provider: sent.provider, p_provider_message_id: sent.providerMessageId, p_error: "" }, { accessToken: session.accessToken });
          results.push({ id: notification.id, status: "sent", provider: sent.provider });
        }
      } catch (error) {
        await rpc("admin_complete_notification", { p_notification_id: notification.id, p_status: "failed", p_provider: null, p_provider_message_id: null, p_error: String(error.message || error) }, { accessToken: session.accessToken });
        results.push({ id: notification.id, status: "failed", error: String(error.message || error), manualUrl: manualUrl(notification) });
      }
    }
    const response = NextResponse.json({ ok: true, processed: results.length, results });
    if (session.refreshedSession) applySessionCookies(response, session.refreshedSession);
    return response;
  } catch (error) {
    return NextResponse.json({ error: String(error?.message || "Não foi possível processar a fila de comunicação.") }, { status: 500 });
  }
}
