import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import SpecialistConsole from "./SpecialistConsole";

export const metadata = {
  title: "Minha operação comercial | Rede Conecta",
  description: "Atendimentos, pipeline, vendas e comissões do especialista comercial.",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

export default async function SpecialistPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/especialista");
    redirect("/entrar?next=/painel/especialista");
  }

  let context;
  try { context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken }); }
  catch { redirect("/api/auth/logout"); }

  if (context.portal_kind !== "broker" || context.profile_status !== "active") redirect("/painel");

  let snapshot;
  try { snapshot = await rpc("specialist_portal_snapshot", {}, { accessToken: session.accessToken }); }
  catch { redirect("/api/auth/logout"); }

  return <SpecialistConsole context={context} initialSnapshot={snapshot || {}}/>;
}
