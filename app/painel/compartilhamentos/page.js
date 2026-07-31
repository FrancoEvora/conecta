import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import SocialAnalytics from "./SocialAnalytics";

export const metadata = { title: "Compartilhamentos rastreáveis", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SocialAnalyticsPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/compartilhamentos");
    redirect("/entrar?next=/painel/compartilhamentos");
  }

  let context;
  try {
    context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
  } catch {
    redirect("/api/auth/logout");
  }

  const permissions = context.permissions || [];
  const isConnector = context.portal_kind === "connector";
  const isStaff = context.portal_kind === "staff" && (permissions.includes("social.analytics") || permissions.includes("platform.all"));
  if (!isConnector && !isStaff) redirect("/painel");

  const data = await rpc(
    isConnector ? "connector_social_share_analytics" : "admin_social_share_analytics",
    {},
    { accessToken: session.accessToken }
  );

  return <SocialAnalytics context={context} initialData={data} mode={isConnector ? "connector" : "staff"}/>;
}
