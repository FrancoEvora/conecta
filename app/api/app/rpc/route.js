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
  create_specialist_invite: "admin_create_specialist_invite",
  partners: "admin_list_partners",
  upsert_partner: "admin_upsert_partner",

  catalog: "admin_list_catalog",
  upsert_development: "admin_upsert_development",
  upsert_product_campaign: "admin_upsert_product_campaign",
  catalog_v2: "admin_catalog_list_v2",
  catalog_preflight: "admin_catalog_preflight",
  catalog_transition: "admin_transition_catalog_entity",
  catalog_restore_published: "admin_restore_published_catalog_entity",
  upsert_development_v2: "admin_upsert_development_v2",
  upsert_product_v2: "admin_upsert_product_v2",
  upsert_campaign_v2: "admin_upsert_campaign_v2",
  set_reward_rule_v2: "admin_set_reward_rule_v2",
  transition_reward_rule_v2: "admin_transition_reward_rule_v2",
  upsert_product_media: "admin_upsert_product_media",
  transition_product_media: "admin_transition_product_media",
  upsert_price_table: "admin_upsert_price_table",
  transition_price_table: "admin_transition_price_table",
  upsert_inventory_unit: "admin_upsert_inventory_unit",
  import_inventory_units: "admin_import_inventory_units",
  publish_due_catalog: "publish_due_catalog_entities",
  product_financial_rules: "admin_list_product_financial_rules",
  set_product_financial_rule: "admin_set_product_financial_rule",
  specialist_financial_rules: "admin_list_specialist_financial_rules",
  specialist_financial_catalog: "admin_specialist_financial_catalog",
  set_specialist_financial_rule: "admin_set_specialist_financial_rule",

  share_studio_invitation: "get_share_studio_invitation",
  create_social_share: "create_my_social_share_link",
  register_social_asset_share: "register_my_social_asset_share",
  connector_social_analytics: "connector_social_share_analytics",
  admin_social_analytics: "admin_social_share_analytics",

  brokers: "admin_list_brokers",
  set_broker_products: "admin_set_broker_products",
  connections: "admin_list_connections",
  connection_detail: "admin_get_connection_detail",
  transition_connection: "admin_transition_connection",
  assign_operator: "admin_assign_connection_operator",
  sdr_console: "admin_sdr_console",
  run_sdr_simulation: "admin_run_sdr_simulation",
  handoff_after_sdr: "admin_handoff_after_sdr",
  add_activity: "admin_add_connection_activity",
  upsert_task: "admin_upsert_task",
  upsert_appointment: "admin_upsert_appointment",
  deals: "admin_list_deals",
  upsert_deal: "admin_upsert_deal",
  transition_deal: "admin_transition_deal",

  finance: "admin_list_finance",
  financial_dashboard: "admin_financial_dashboard",
  record_financial_entry: "admin_record_financial_entry",
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
  connector_mark_notification_read: "connector_mark_notification_read",
  partner_snapshot: "partner_portal_snapshot",
  broker_snapshot: "broker_portal_snapshot",
  specialist_snapshot: "specialist_portal_snapshot",
  specialist_accept_connection: "specialist_accept_connection",
  specialist_update_stage: "specialist_update_connection_stage",
  specialist_report_sale: "specialist_report_sale",
  specialist_mark_notification_read: "specialist_mark_notification_read",
  accept_partner_terms: "partner_accept_non_circumvention_terms",
  create_invitation: "create_my_invitation"
};

export async function POST(request) {
  const session = await getValidRouteSession();
  if (!session) {
    return clearSessionCookies(NextResponse.json({ error: "Sessão expirada." }, { status: 401 }));
  }

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
    const normalized = message.replaceAll("_", " ");
    const status = /permission|active .* required|denied|not assigned/i.test(normalized)
      ? 403
      : /stale|conflict/i.test(normalized)
        ? 409
        : /not found|invalid|required|mismatch|preflight failed|workflow state|closed/i.test(normalized)
          ? 400
          : 500;
    return NextResponse.json({ error: normalized }, { status });
  }
}
