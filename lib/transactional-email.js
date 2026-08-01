import { SITE_URL } from "@/lib/config";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Rede Conecta <onboarding@resend.dev>";
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

export function connectorApplicationReceivedEmail({ fullName }) {
  const name = escapeHtml(fullName || "");
  const dashboardUrl = `${SITE_URL}/painel`;
  const subject = "Cadastro recebido — Bem-vindo à Rede Conecta";
  const text = `Olá${name ? `, ${name}` : ""}. Sua conta na Rede Conecta foi criada com sucesso. Seu cadastro seguirá para validação interna. Você já pode acessar a plataforma em ${dashboardUrl}. A Rede Conecta transforma confiança e credibilidade em oportunidades reais de negócio.`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${subject}</title></head><body style="margin:0;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#17233a"><div style="display:none;max-height:0;overflow:hidden;opacity:0">Sua conta foi criada e seu cadastro já está em análise.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f5f8;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 16px 44px rgba(7,28,58,.10)"><tr><td style="background:#071c3a;padding:28px 34px;color:#ffffff"><div style="font-size:23px;font-weight:800;letter-spacing:-.5px">REDE <span style="color:#ff6500">CONECTA</span></div><div style="margin-top:6px;color:#cbd4df;font-size:13px">Transformamos confiança em oportunidades.</div></td></tr><tr><td style="padding:38px 34px 18px"><div style="font-size:12px;font-weight:800;letter-spacing:1.1px;color:#ff6500">CADASTRO RECEBIDO</div><h1 style="margin:12px 0 16px;font-size:30px;line-height:1.14;color:#071c3a">Sua conta foi criada com sucesso.</h1><p style="margin:0 0 16px;line-height:1.65;color:#55637a">Olá${name ? `, <strong>${name}</strong>` : ""}.</p><p style="margin:0 0 18px;line-height:1.65;color:#55637a">Recebemos seu cadastro para participar da Rede Conecta. Nossa equipe fará a validação interna do seu perfil, mas você já pode acessar a plataforma, completar suas informações e conhecer o funcionamento da rede.</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:12px;background:#ff6500"><a href="${dashboardUrl}" style="display:inline-block;padding:15px 25px;color:#ffffff;text-decoration:none;font-weight:800">Acessar a Rede Conecta</a></td></tr></table><div style="margin-top:26px;padding:18px;border-radius:14px;background:#f7f8fa;color:#536178;font-size:14px;line-height:1.65"><strong style="color:#071c3a">O que acontece agora?</strong><br>1. Sua conta já está disponível para acesso.<br>2. A equipe valida seu cadastro e suas áreas de atuação.<br>3. Após a aprovação, oportunidades compatíveis poderão ser liberadas para o seu perfil.</div><p style="margin:24px 0 8px;line-height:1.65;color:#55637a"><strong style="color:#071c3a">Use a sua confiança e credibilidade para ganhar dinheiro.</strong><br>Você apresenta pessoas a oportunidades reais. A Rede Conecta protege a origem, conduz o atendimento e acompanha o negócio.</p></td></tr><tr><td style="padding:16px 34px 34px"><div style="padding:16px;border-radius:12px;background:#fff5ed;color:#654c3d;font-size:13px;line-height:1.55">Segurança: nunca solicitaremos sua senha por e-mail, telefone ou WhatsApp. A aprovação do cadastro não exige pagamento.</div></td></tr><tr><td style="padding:21px 34px;background:#f8f6f2;color:#7a8595;font-size:11px;line-height:1.6">Rede Conecta · Origem protegida, operação rastreável e oportunidades reais.<br>Esta mensagem foi enviada porque uma conta foi criada com este endereço.</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}

export async function sendTransactionalEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) return { sent: false, reason: "provider_not_configured" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html, text, ...(EMAIL_REPLY_TO ? { reply_to: EMAIL_REPLY_TO } : {}) }),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || `Falha no envio transacional (${response.status}).`);
  return { sent: true, provider: "resend", providerMessageId: payload?.id || null };
}
