import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import Portal from "../Portal";
import ProfessionalAdminRedirector from "../ProfessionalAdminRedirector";

export const metadata = { title: "Operations Center" };
export const dynamic = "force-dynamic";

export default async function OperationsCenterPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/operacao");
    redirect("/entrar?next=/painel/operacao");
  }

  let context;
  try {
    context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
  } catch {
    redirect("/api/auth/logout");
  }

  if (context.portal_kind === "connector" && context.profile_status === "active") redirect("/painel/conector");
  if (context.portal_kind === "broker" && context.profile_status === "active") redirect("/painel/especialista");

  let snapshot = null;
  try {
    if (context.portal_kind === "staff") snapshot = await rpc("admin_dashboard_summary", {}, { accessToken: session.accessToken });
    if (context.portal_kind === "partner") snapshot = await rpc("partner_portal_snapshot", {}, { accessToken: session.accessToken });
  } catch {}

  return <>
    <ProfessionalAdminRedirector/>
    <Portal initialContext={context} initialSnapshot={snapshot}/>
  </>;
}
