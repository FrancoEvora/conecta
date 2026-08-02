import { redirect } from "next/navigation";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";
import AccessManagerV2 from "./AccessManagerV2";

export const metadata = { title: "Pessoas, especialistas e acessos" };
export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const session = await getServerUser();
  if (!session.user) {
    if (session.needsRefresh) redirect("/api/auth/refresh?next=/painel/acessos");
    redirect("/entrar?next=/painel/acessos");
  }
  let context;
  try { context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken }); }
  catch { redirect("/api/auth/logout"); }
  const permissions = context.permissions || [];
  if (context.portal_kind !== "staff" || !(permissions.includes("platform.all") || permissions.includes("staff.manage") || permissions.includes("brokers.manage"))) redirect("/painel");
  const [accounts, invites, roles, partners] = await Promise.all([
    rpc("admin_list_access_accounts", {}, { accessToken: session.accessToken }),
    rpc("admin_list_account_invites", { p_status: null }, { accessToken: session.accessToken }),
    rpc("admin_list_access_roles", {}, { accessToken: session.accessToken }),
    rpc("admin_list_partners", {}, { accessToken: session.accessToken })
  ]);
  return <AccessManagerV2 initialAccounts={accounts} initialInvites={invites} roles={roles} partners={partners || []} currentProfileId={context.profile_id}/>;
}
