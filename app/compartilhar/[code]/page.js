import { notFound, redirect } from "next/navigation";
import { Footer, Header } from "@/components/UI";
import ShareComposer from "@/components/ShareComposer";
import { SITE_URL } from "@/lib/config";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Estúdio de compartilhamento",
  description: "Crie uma publicação rastreável para WhatsApp e redes sociais.",
  robots: { index: false, follow: false }
};

export default async function ShareStudioPage({ params }) {
  const { code } = await params;
  const nextPath = `/compartilhar/${encodeURIComponent(code)}`;
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect(`/api/auth/refresh?next=${encodeURIComponent(nextPath)}`);
    redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
  }

  let invitation = null;
  try {
    invitation = await rpc("get_share_studio_invitation", {
      p_invite_code: String(code || "").trim().toUpperCase()
    }, { accessToken: session.accessToken });
  } catch {
    invitation = null;
  }
  if (!invitation?.product_name) notFound();

  const hostname = (() => {
    try { return new URL(SITE_URL).hostname; } catch { return "conecta-pearl.vercel.app"; }
  })();

  return <>
    <Header minimal/>
    <main>
      <section className="page-hero page-hero--compact">
        <div className="container">
          <span className="eyebrow">Compartilhamento rastreável</span>
          <h1>Uma mensagem pessoal. Um link oficial. <em>Resultados mensuráveis.</em></h1>
          <p>Escolha o canal, personalize o texto e gere um endereço exclusivo. A plataforma mede cliques, acessos, autorizações e negócios validados sem expor dados pessoais nas redes sociais.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ShareComposer invitation={invitation} code={code} baseUrl={SITE_URL} hostname={hostname}/>
        </div>
      </section>
    </main>
    <Footer/>
  </>;
}
