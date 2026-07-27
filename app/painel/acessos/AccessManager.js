"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import styles from "./AccessManager.module.css";

async function rpc(operation, params = {}) {
  const response = await fetch("/api/app/rpc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, params }) });
  const payload = await response.json();
  if (response.status === 401) { location.href = "/entrar?expirado=1"; throw new Error("Sessão expirada."); }
  if (!response.ok) throw new Error(payload.error || "Operação não concluída.");
  return payload.data;
}

function Status({ value }) {
  return <span className={`${styles.status} ${value === "active" ? styles.good : ["suspended","revoked"].includes(value) ? styles.bad : ""}`}>{String(value || "—").replaceAll("_", " ")}</span>;
}

export default function AccessManager({ initialAccounts, initialInvites, roles, currentProfileId }) {
  const [accounts, setAccounts] = useState(initialAccounts || []);
  const [invites, setInvites] = useState(initialInvites || []);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const visible = useMemo(() => accounts.filter(account => filter === "all" || account.kind === filter), [accounts, filter]);

  async function reload() {
    const [newAccounts, newInvites] = await Promise.all([rpc("access_accounts"), rpc("account_invites", { p_status: null })]);
    setAccounts(newAccounts || []); setInvites(newInvites || []);
  }
  async function changeStatus(account, status) {
    const reason = prompt("Registre o motivo da alteração:", status === "active" ? "Acesso regularizado." : "Acesso suspenso pela gestão.");
    if (reason === null) return;
    await rpc("set_access_status", { p_profile_id: account.profile_id, p_status: status, p_reason: reason });
    setMessage("Status atualizado e auditado."); await reload();
  }
  async function saveRoles(event) {
    event.preventDefault();
    const roleCodes = Array.from(new FormData(event.currentTarget).getAll("roles"));
    await rpc("set_staff_roles", { p_profile_id: editing.profile_id, p_role_codes: roleCodes });
    setEditing(null); setMessage("Papéis atualizados."); await reload();
  }
  async function revoke(invite) {
    const reason = prompt("Motivo da revogação:", "Convite substituído ou não mais necessário.");
    if (reason === null) return;
    await rpc("revoke_account_invite", { p_invite_id: invite.id, p_reason: reason });
    setMessage("Convite revogado."); await reload();
  }

  return <div className={styles.shell}>
    <header className={styles.header}><NetworkMark/><div><Link href="/painel">Voltar ao painel</Link><button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/")}>Sair</button></div></header>
    <main className={styles.main}>
      <div className={styles.title}><div><span className="eyebrow">Acesso e permissões</span><h1>Contas, papéis e convites</h1><p>Todos os acessos são individuais, revogáveis e registrados em auditoria.</p></div><div className={styles.filters}>{["all","staff","connector","broker","partner_user"].map(item => <button className={filter === item ? styles.selected : ""} onClick={() => setFilter(item)} key={item}>{item === "all" ? "Todos" : item.replaceAll("_", " ")}</button>)}</div></div>
      {message && <div className={styles.notice}><Icon name="check" size={18}/>{message}<button onClick={() => setMessage("")}>×</button></div>}
      <section className={styles.card}><h2>Contas provisionadas</h2><div className={styles.table}><table><thead><tr><th>Usuário</th><th>Tipo</th><th>Vínculo</th><th>Papéis</th><th>Status</th><th>Ações</th></tr></thead><tbody>{visible.map(account => <tr key={account.profile_id}><td><b>{account.display_name}</b><small>{account.email}<br/>{account.phone}</small></td><td>{account.kind.replaceAll("_", " ")}</td><td>{account.partner_name || (account.creci_number ? `CRECI ${account.creci_state} ${account.creci_number}` : "Rede Conecta")}</td><td><div className={styles.tags}>{(account.access_roles || []).map(role => <i key={role}>{role.replaceAll("_", " ")}</i>)}</div></td><td><Status value={account.status}/></td><td><div className={styles.actions}>{account.kind === "staff" && <button onClick={() => setEditing(account)}>Papéis</button>}{account.profile_id !== currentProfileId && (account.status === "active" ? <button className={styles.danger} onClick={() => changeStatus(account, "suspended")}>Suspender</button> : <button className={styles.activate} onClick={() => changeStatus(account, "active")}>Reativar</button>)}</div></td></tr>)}</tbody></table></div>{!visible.length && <p className={styles.empty}>Nenhuma conta neste filtro.</p>}</section>
      <section className={styles.card}><h2>Convites de acesso</h2><div className={styles.table}><table><thead><tr><th>Convidado</th><th>Tipo</th><th>Vínculo</th><th>Papel</th><th>Status</th><th>Validade</th><th></th></tr></thead><tbody>{invites.map(invite => <tr key={invite.id}><td><b>{invite.display_name}</b><small>{invite.email}</small></td><td>{invite.target_kind}</td><td>{invite.partner_name || "Rede Conecta"}</td><td>{invite.access_role_code || invite.membership_role}</td><td><Status value={invite.status}/></td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(invite.expires_at))}</td><td>{invite.status === "pending" && <button className={styles.danger} onClick={() => revoke(invite)}>Revogar</button>}</td></tr>)}</tbody></table></div></section>
    </main>
    {editing && <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && setEditing(null)}><form className={styles.modal} onSubmit={saveRoles}><header><h2>Papéis de {editing.display_name}</h2><button type="button" onClick={() => setEditing(null)}>×</button></header><p>O acesso efetivo é a união das permissões dos papéis ativos.</p><div className={styles.roleList}>{roles.map(role => <label key={role.code}><input type="checkbox" name="roles" value={role.code} defaultChecked={(editing.access_roles || []).includes(role.code)}/><span><b>{role.name}</b><small>{role.description}</small><em>{(role.permissions || []).length} permissões</em></span></label>)}</div><button className="button button--orange">Salvar papéis</button></form></div>}
  </div>;
}
