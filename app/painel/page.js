import Link from "next/link";
import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import Portal from "./Portal";

export const metadata = { title: "Painel" };
export const dynamic = "force-dynamic";

const launcherStyle = {
  position: "fixed",
  zIndex: 85,
  right: 18,
  bottom: 18,
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 8,
  maxWidth: "min(620px, calc(100vw - 36px))"
};

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 42,
  padding: "0 14px",
  borderRadius: 12,
  background: "#071c3a",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 850,
  boxShadow: "0 16px 38px rgba(7,28,58,.22)"
};

export default async function PortalPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel");
    redirect("/entrar?next=/painel");
  }

  let context;
  try {
    context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
  } catch {
    redirect("/api/auth/logout");
  }

  let snapshot = null;
  try {
    if (context.portal_kind === "staff") snapshot = await rpc("admin_dashboard_summary", {}, { accessToken: session.accessToken });
    if (context.portal_kind === "connector") snapshot = await rpc("connector_portal_snapshot", {}, { accessToken: session.accessToken });
    if (context.portal_kind === "partner") snapshot = await rpc("partner_portal_snapshot", {}, { accessToken: session.accessToken });
    if (context.portal_kind === "broker") snapshot = await rpc("broker_portal_snapshot", {}, { accessToken: session.accessToken });
  } catch {}

  const permissions = context.permissions || [];
  const has = permission => permissions.includes("platform.all") || permissions.includes(permission);
  const canManageAccess = context.portal_kind === "staff" && has("staff.manage");
  const canManageCatalog = context.portal_kind === "staff" && [
    "catalog.manage", "catalog.read", "catalog.edit", "catalog.approve", "catalog.publish",
    "pricing.manage", "inventory.manage"
  ].some(has);
  const canSeeSocial = context.portal_kind === "connector" || (context.portal_kind === "staff" && has("social.analytics"));

  return <>
    {(canManageAccess || canManageCatalog || canSeeSocial) && <div style={launcherStyle}>
      {canSeeSocial && <Link href="/painel/compartilhamentos" style={linkStyle}>Distribuição rastreável</Link>}
      {canManageCatalog && <Link href="/painel/catalogo" style={{ ...linkStyle, background: "#ff6500" }}>Catálogo profissional</Link>}
      {canManageAccess && <Link href="/painel/acessos" style={{ ...linkStyle, background: "#fff", color: "#071c3a", border: "1px solid #dfe4e9" }}>Acessos e permissões</Link>}
    </div>}
    <Portal initialContext={context} initialSnapshot={snapshot}/>
  </>;
}
