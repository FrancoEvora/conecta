import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import IntelligenceDashboard from "./IntelligenceDashboard";

export const metadata = { title: "Inteligência Conecta" };
export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const session = await getServerUser();
  if (!session.user) redirect("/entrar?next=/painel/inteligencia");

  let context;
  try { context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken }); }
  catch { redirect("/api/auth/logout"); }

  if (context.portal_kind !== "connector" && context.portal_kind !== "staff") redirect("/painel");

  let products = [];
  let snapshot = null;
  try { products = await rpc("list_public_products", {}, { accessToken: session.accessToken }); } catch {}
  try {
    snapshot = context.portal_kind === "connector"
      ? await rpc("connector_portal_snapshot", {}, { accessToken: session.accessToken })
      : await rpc("admin_dashboard_summary", {}, { accessToken: session.accessToken });
  } catch {}

  return <IntelligenceDashboard context={context} products={Array.isArray(products) ? products : []} snapshot={snapshot || {}}/>;
}
