import Link from "next/link";
import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import Portal from "./Portal";

export const metadata = { title: "Painel" };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel");
    redirect("/entrar?next=/painel");
  }
  let context;
  try { context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken }); }
  catch { redirect("/api/auth/logout"); }
  let snapshot = null;
  try {
    if (context.portal_kind === "staff") snapshot = await rpc("admin_dashboard_summary", {}, { accessToken: session.accessToken });
    if (context.portal_kind === "connector") snapshot = await rpc("connector_portal_snapshot", {}, { accessToken: session.accessToken });
    if (context.portal_kind === "partner") snapshot = await rpc("partner_portal_snapshot", {}, { accessToken: session.accessToken });
    if (context.portal_kind === "broker") snapshot = await rpc("broker_portal_snapshot", {}, { accessToken: session.accessToken });
  } catch {}
  const canManageAccess = context.portal_kind === "staff" && ((context.permissions || []).includes("platform.all") || (context.permissions || []).includes("staff.manage"));
  return <>{canManageAccess && <Link href="/painel/acessos" style={{ position:"fixed", zIndex:80, right:18, bottom:18, display:"inline-flex", alignItems:"center", gap:8, padding:"11px 14px", borderRadius:12, background:"#ff6500", color:"#fff", fontSize:"12px", fontWeight:850, boxShadow:"0 16px 38px rgba(7,28,58,.22)" }}>Acessos e permissões</Link>}<Portal initialContext={context} initialSnapshot={snapshot}/></>;
}
