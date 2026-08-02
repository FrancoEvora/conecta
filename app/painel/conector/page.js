import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import ConnectorDashboard from "./ConnectorDashboard";

export const metadata = {
  title: "Meu painel | Rede Conecta",
  description: "Acompanhe suas conexões, negócios, canais e recompensas.",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

export default async function ConnectorPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/conector");
    redirect("/entrar?next=/painel/conector");
  }

  let context;
  try {
    context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
  } catch {
    redirect("/api/auth/logout");
  }
  if (context.portal_kind !== "connector" || context.profile_status !== "active") redirect("/painel/operacao");

  const snapshot = await rpc("connector_portal_snapshot", {}, { accessToken: session.accessToken });
  return <ConnectorDashboard context={context} initialSnapshot={snapshot}/>;
}
