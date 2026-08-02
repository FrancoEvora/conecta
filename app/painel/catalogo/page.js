import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import CatalogConsole from "./CatalogConsole";

export const metadata = {
  title: "Central de Produtos",
  description: "Cadastre produtos por categoria comercial, organize campanhas e publique o portfólio da Rede Conecta.",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

export default async function ProfessionalCatalogPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/catalogo");
    redirect("/entrar?next=/painel/catalogo");
  }

  let context;
  try {
    context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
  } catch {
    redirect("/api/auth/logout");
  }

  const permissions = context.permissions || [];
  const permitted = context.portal_kind === "staff" && [
    "platform.all",
    "catalog.manage",
    "catalog.read",
    "catalog.edit",
    "catalog.approve",
    "catalog.publish",
    "pricing.manage",
    "inventory.manage"
  ].some(permission => permissions.includes(permission));
  if (!permitted) redirect("/painel");

  const data = await rpc("admin_catalog_list_v2", {}, { accessToken: session.accessToken });
  return <CatalogConsole context={context} initialData={data}/>;
}
