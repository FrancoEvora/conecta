# Supabase · Rede Conecta

Projeto de produção: `xnpotbtjkhgnscatpjns` (região `sa-east-1`).

A primeira versão usa PostgreSQL, Auth, RLS, funções RPC e registros de auditoria. As migrações aplicadas no projeto remoto em 26/07/2026 foram:

1. `conecta_product_first_core`
2. `conecta_product_first_triggers`
3. `conecta_product_first_invitation_rpcs`
4. `conecta_connector_application_rpc`
5. `conecta_product_first_seed`
6. `conecta_product_interest_rpc`
7. `conecta_public_catalog_rpc`

## RPCs públicas

- `list_public_products()`
- `resolve_product_invitation(p_invite_code)`
- `register_public_link_event(...)`
- `submit_product_interest(...)`
- `submit_connector_application(...)`

## Modelo produto primeiro

Cada convite preserva o produto, campanha, conector, regra de recompensa e versão dos termos. `connections.source_product_id` não é substituído quando um produto alternativo é apresentado. A ampliação da investigação depende de `alternative_discovery_authorized`.
