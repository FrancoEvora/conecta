import { notFound, redirect } from "next/navigation";
import { Footer, Header } from "@/components/UI";
import ShareStudioExperience from "@/components/ShareStudioExperience";
import { SITE_URL } from "@/lib/config";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Estúdio de compartilhamento",
  description: "Compartilhe links rastreáveis ou publique artes profissionais no Instagram Feed e Stories.",
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
          <span className="eyebrow">Compartilhamento profissional</span>
          <h1>Direct com rastreamento. Feed e Stories com a <em>imagem principal do produto.</em></h1>
          <p>Escolha todas as opções no mesmo estúdio. WhatsApp, Direct e mensageiros usam o convite oficial rastreável; Instagram Feed e Stories recebem a arte diretamente, sem gerar link intermediário.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ShareStudioExperience invitation={invitation} code={code} baseUrl={SITE_URL} hostname={hostname}/>
        </div>
      </section>
    </main>
    <Footer/>
  </>;
}
