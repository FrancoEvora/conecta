import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import CommunicationManager from "./CommunicationManager";

export const metadata = { title: "Central de comunicações" };
export const dynamic = "force-dynamic";

export default async function CommunicationPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/comunicacoes");
    redirect("/entrar?next=/painel/comunicacoes");
  }
  let context;
  try { context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken }); }
  catch { redirect("/api/auth/logout"); }
  const permissions = context.permissions || [];
  if (context.portal_kind !== "staff" || !(permissions.includes("platform.all") || permissions.includes("notifications.manage"))) redirect("/painel");
  const items = await rpc("admin_list_notifications", { p_status: null, p_limit: 1000 }, { accessToken: session.accessToken });
  return <CommunicationManager initialItems={items}/>;
}
