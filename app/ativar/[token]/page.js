import { notFound } from "next/navigation";
import { Header } from "@/components/UI";
import { rpc } from "@/lib/supabase";
import ActivationForm from "./ActivationForm";

export const metadata = { title: "Ativar acesso" };
export const dynamic = "force-dynamic";

export default async function ActivationPage({ params }) {
  const { token } = await params;
  let invitation = null;
  try { invitation = await rpc("resolve_account_invite_v2", { p_token: token }); } catch {}
  if (!invitation || ["expired", "revoked"].includes(invitation.status)) notFound();

  return <>
    <Header minimal/>
    <main className="login-page">
      <section className="login-promo"><div><span className="eyebrow">Rede Conecta</span><h1>Acesso com função, escopo e <em>responsabilidade definidos.</em></h1><p>Especialistas comerciais podem atuar em imóveis, veículos, energia, seguros, consórcios e outros mercados. Credenciais profissionais são exigidas apenas quando aplicáveis.</p></div></section>
      <section className="login-panel"><ActivationForm invitation={invitation} token={token}/></section>
    </main>
  </>;
}
