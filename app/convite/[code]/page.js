import { notFound } from "next/navigation";
import { Header, NetworkMark } from "@/components/UI";
import { SITE_URL } from "@/lib/config";
import { rpc } from "@/lib/supabase";
import InviteClient from "./InviteClient";

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
  const canonical = `${SITE_URL}/convite/${encodeURIComponent(code)}`;
  const connector = invitation?.connector_display_name || "Rede Conecta";
  const product = invitation?.product_name || "uma oportunidade selecionada";
  const title = `${connector} conectou você ao ${product}`;
  const description = `Convite oficial da Rede Conecta, enviado por ${connector}. Conheça ${product} e autorize o atendimento somente se houver interesse.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Rede Conecta",
      url: canonical,
      title: `${title} | Rede Conecta`,
      description,
      images: [{
        url: `${canonical}/opengraph-image?v=3`,
        width: 1200,
        height: 630,
        alt: `Convite oficial para conhecer ${product}`
      }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Rede Conecta`,
      description,
      images: [`${canonical}/opengraph-image?v=3`]
    }
  };
}

export default async function InvitePage({ params }) {
  const { code } = await params;
  const invitation = await resolveInvitation(code);
  if (!invitation) notFound();

  const hostname = (() => {
    try { return new URL(SITE_URL).hostname; } catch { return "conecta-pearl.vercel.app"; }
  })();

  return <>
    <Header minimal/>
    <main className="invite-page">
      <section className="invite-hero">
        <div className="container invite-hero__grid">
          <div>
            <span className="eyebrow">Convite individualizado</span>
            <h1><em>{invitation.connector_display_name}</em> conectou você a esta oportunidade.</h1>
            <div className="orange-line"/>
            <h2>{invitation.product_name}</h2>
            <p>{invitation.campaign_summary || invitation.product_description}</p>
            <div className="invite-origin">
              <NetworkMark compact/>
              <span>
                <b>Link oficial · origem identificada</b>
                Enviado por {invitation.connector_display_name}. O produto de origem é {invitation.product_name}. Confira o domínio {hostname}; o atendimento só começa após sua autorização.
              </span>
            </div>
          </div>
          <div className="invite-hero__image" style={{
            backgroundImage: `linear-gradient(180deg,transparent 38%,rgba(7,28,58,.78)),url('${invitation.product_metadata?.image || "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=84"}')`
          }}>
            <div><span>{invitation.product_category}</span><strong>{invitation.campaign_location}</strong></div>
          </div>
        </div>
      </section>
      <InviteClient invitation={invitation} code={code}/>
    </main>
  </>;
}
