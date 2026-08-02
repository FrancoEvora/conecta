import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import ProfessionalFinanceCenter from "./ProfessionalFinanceCenter";

export const metadata = {
  title: "Controladoria | Rede Conecta",
  description: "Negócios, receitas, comissões, pagamentos, margem e previsões da Rede Conecta.",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

export default async function FinancialPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/financeiro");
    redirect("/entrar?next=/painel/financeiro");
  }

  let context;
  try { context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken }); }
  catch { redirect("/api/auth/logout"); }
  if (context.portal_kind !== "staff") redirect("/painel");

  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);
  const [dashboard, products, specialistCatalog] = await Promise.all([
    rpc("admin_financial_dashboard", { p_from: from, p_to: to }, { accessToken: session.accessToken }),
    rpc("admin_list_product_financial_rules", {}, { accessToken: session.accessToken }),
    rpc("admin_specialist_financial_catalog", {}, { accessToken: session.accessToken })
  ]);

  return <ProfessionalFinanceCenter
    context={context}
    initialDashboard={dashboard || {}}
    initialProducts={products || []}
    initialSpecialistCatalog={specialistCatalog || { summary: {}, specialists: [], products: [], rules: [] }}
  />;
}
