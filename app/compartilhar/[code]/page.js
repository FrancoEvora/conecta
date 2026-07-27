import { notFound } from "next/navigation";
import { Footer, Header } from "@/components/UI";
import ShareComposer from "@/components/ShareComposer";
import { SITE_URL } from "@/lib/config";
import { rpc } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function resolveInvitation(code) {
  try {
    const data = await rpc("resolve_product_invitation", { p_invite_code: code });
    return Array.isArray(data) ? data[0] : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  const invitation = await resolveInvitation(code);
  return {
    title: invitation ? `Compartilhar ${invitation.product_name}` : "Compartilhar oportunidade",
    description: "Personalize sua mensagem, confira a prévia oficial do link e compartilhe uma oportunidade da Rede Conecta.",
    robots: { index: false, follow: false }
  };
}

export default async function ShareStudioPage({ params }) {
  const { code } = await params;
  const invitation = await resolveInvitation(code);
  if (!invitation) notFound();

  return <>
    <Header minimal/>
    <main>
      <section className="page-hero page-hero--compact">
        <div className="container">
          <span className="eyebrow">Compartilhamento seguro</span>
          <h1>Prepare uma mensagem pessoal e envie um <em>link oficial.</em></h1>
          <p>A prévia mostra o produto, identifica a origem do convite e informa que o contato só acontecerá após autorização do interessado.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ShareComposer invitation={invitation} code={code} baseUrl={SITE_URL}/>
        </div>
      </section>
    </main>
    <Footer/>
  </>;
}
