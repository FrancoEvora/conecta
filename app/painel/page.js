import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import ConectaOS from "./ConectaOS";

export const metadata = {
  title: "Conecta OS",
  description: "O sistema operacional da Rede Conecta para transformar confiança em oportunidades e receita."
};
export const dynamic = "force-dynamic";

async function safeRpc(name, params, accessToken, fallback) {
  try { return await rpc(name, params, { accessToken }); }
  catch { return fallback; }
}

export default async function ConectaOSPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel");
    redirect("/entrar?next=/painel");
  }

  let context;
  try { context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken }); }
  catch { redirect("/api/auth/logout"); }

  if (context.portal_kind === "connector" && context.profile_status === "active") redirect("/painel/conector");
  if (context.portal_kind === "broker" && context.profile_status === "active") redirect("/painel/especialista");

  let snapshot = {};
  if (context.portal_kind === "staff") snapshot = await safeRpc("admin_dashboard_summary", {}, session.accessToken, {});
  if (context.portal_kind === "partner") snapshot = await safeRpc("partner_portal_snapshot", {}, session.accessToken, {});

  const products = await safeRpc("list_public_products", {}, session.accessToken, []);

  return <ConectaOS
    context={context}
    snapshot={snapshot || {}}
    products={Array.isArray(products) ? products : []}
  />;
}
