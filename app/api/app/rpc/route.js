import { NextResponse } from "next/server";
import { rpc } from "@/lib/supabase";
import { applySessionCookies, clearSessionCookies, getValidRouteSession } from "@/lib/session";

const operations = {
  context: "get_my_app_context",
  dashboard: "admin_dashboard_summary",
  staff: "admin_list_staff",
  access_roles: "admin_list_access_roles",
  access_accounts: "admin_list_access_accounts",
  account_invites: "admin_list_account_invites",
  revoke_account_invite: "admin_revoke_account_invite",
  set_staff_roles: "admin_set_staff_roles",
  set_access_status: "admin_set_access_status",
  connector_applications: "admin_list_connector_applications",
  review_connector: "admin_review_connector_application",
  create_account_invite: "admin_create_account_invite",
  partners: "admin_list_partners",
  upsert_partner: "admin_upsert_partner",
  catalog: "admin_list_catalog",
  upsert_development: "admin_upsert_development",
  upsert_product_campaign: "admin_upsert_product_campaign",
  brokers: "admin_list_brokers",
  set_broker_products: "admin_set_broker_products",
  connections: "admin_list_connections",
  connection_detail: "admin_get_connection_detail",
  transition_connection: "admin_transition_connection",
  assign_operator: "admin_assign_connection_operator",
  add_activity: "admin_add_connection_activity",
  upsert_task: "admin_upsert_task",
  upsert_appointment: "admin_upsert_appointment",
  deals: "admin_list_deals",
  upsert_deal: "admin_upsert_deal",
  transition_deal: "admin_transition_deal",
  finance: "admin_list_finance",
  transition_reward: "transition_reward",
  create_payout: "create_payout_batch",
  transition_payout: "transition_payout",
  reconciliation: "admin_list_reconciliation",
  create_sales_batch: "admin_create_sales_batch",
  add_sales_row: "admin_add_sales_row",
  finish_sales_batch: "admin_finish_sales_batch",
  resolve_alert: "admin_resolve_circumvention_alert",
  notifications: "admin_list_notifications",
  audit: "admin_list_audit",
  settings: "admin_list_settings",
  set_setting: "admin_set_setting",
  connector_snapshot: "connector_portal_snapshot",
  partner_snapshot: "partner_portal_snapshot",
  broker_snapshot: "broker_portal_snapshot",
  accept_partner_terms: "partner_accept_non_circumvention_terms",
  create_invitation: "create_my_invitation"
};

export async function POST(request) {
  const session = await getValidRouteSession();
  if (!session) return clearSessionCookies(NextResponse.json({ error: "Sessão expirada." }, { status: 401 }));
  try {
    const body = await request.json();
    const operation = String(body.operation || "");
    const rpcName = operations[operation];
    if (!rpcName) return NextResponse.json({ error: "Operação não permitida." }, { status: 400 });
    const params = body.params && typeof body.params === "object" && !Array.isArray(body.params) ? body.params : {};
    const data = await rpc(rpcName, params, { accessToken: session.accessToken });
    const response = NextResponse.json({ ok: true, data });
    if (session.refreshedSession) applySessionCookies(response, session.refreshedSession);
    return response;
  } catch (error) {
    const message = String(error?.message || "Falha ao processar a operação.");
    const status = /permission|active_.*required|denied/i.test(message) ? 403 : /not_found|invalid|required|mismatch/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message.replaceAll("_", " ") }, { status });
  }
}
