import { notFound } from "next/navigation";
import { Header, NetworkMark } from "@/components/UI";
import { rpc } from "@/lib/supabase";
import InviteClient from "./InviteClient";

export const metadata = { title: "Convite para uma oportunidade" };

export default async function InvitePage({ params }) {
  const { code } = await params;
  let invitation = null;
  try { const data = await rpc("resolve_product_invitation", { p_invite_code: code }); invitation = Array.isArray(data) ? data[0] : null; } catch {}
  if (!invitation) notFound();
  return <><Header minimal/><main className="invite-page"><section className="invite-hero"><div className="container invite-hero__grid"><div><span className="eyebrow">Convite individualizado</span><h1><em>{invitation.connector_display_name}</em> conectou você a esta oportunidade.</h1><div className="orange-line"/><h2>{invitation.product_name}</h2><p>{invitation.campaign_summary || invitation.product_description}</p><div className="invite-origin"><NetworkMark compact/><span><b>Produto de origem preservado</b>Este atendimento começa exclusivamente por {invitation.product_name}.</span></div></div><div className="invite-hero__image" style={{backgroundImage:`linear-gradient(180deg,transparent 38%,rgba(7,28,58,.78)),url('${invitation.product_metadata?.image || "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=84"}')`}}><div><span>{invitation.product_category}</span><strong>{invitation.campaign_location}</strong></div></div></div></section><InviteClient invitation={invitation} code={code}/></main></>;
}
