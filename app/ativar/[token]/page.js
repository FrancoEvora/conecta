import { notFound } from "next/navigation";
import { Header } from "@/components/UI";
import { rpc } from "@/lib/supabase";
import ActivationForm from "./ActivationForm";

export const metadata = { title: "Ativar acesso" };

export default async function ActivationPage({ params }) {
  const { token } = await params;
  let invitation = null;
  try {
    const rows = await rpc("resolve_account_invite", { p_token: token });
    invitation = Array.isArray(rows) ? rows[0] : rows;
  } catch {}
  if (!invitation || invitation.status !== "pending") notFound();
  return <><Header minimal/><main className="login-page"><section className="login-promo"><div><span className="eyebrow">Rede Conecta</span><h1>Acesso com função, escopo e <em>responsabilidade definidos.</em></h1><p>Parceiros e corretores recebem painéis de leitura. A equipe interna conduz leads, contatos, propostas, negócios e recompensas.</p></div></section><section className="login-panel"><ActivationForm invitation={invitation} token={token}/></section></main></>;
}
