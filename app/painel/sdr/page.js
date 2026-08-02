import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import UnifiedOpportunityConsole from "./UnifiedOpportunityConsole";

export const metadata = {
  title: "Central de Oportunidades · Rede Conecta",
  description: "SDR, qualificação e distribuição administrativa em uma única jornada operacional.",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

export default async function SdrPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/sdr");
    redirect("/entrar?next=/painel/sdr");
  }

  let context;
  try {
    context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
  } catch {
    redirect("/api/auth/logout");
  }

  const permissions = context.permissions || [];
  const permitted = context.portal_kind === "staff" && ["platform.all", "leads.read", "leads.assign", "leads.manage"].some(permission => permissions.includes(permission));
  if (!permitted) redirect("/painel");

  const data = await rpc("admin_sdr_console", { p_limit: 500 }, { accessToken: session.accessToken });
  return <UnifiedOpportunityConsole context={context} initialData={data}/>;
}
