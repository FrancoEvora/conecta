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
  return <Portal initialContext={context} initialSnapshot={snapshot}/>;
}
