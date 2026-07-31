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

const kindLabel = { staff: "Equipe interna", connector: "Conector", broker: "Corretor", partner_user: "Usuário parceiro" };
const membershipOptions = [
  ["owner", "Proprietário", "Responsável máximo pelo vínculo"],
  ["manager", "Gestor", "Gestão operacional do escopo permitido"],
  ["finance", "Financeiro", "Leitura e rotinas financeiras autorizadas"],
  ["training", "Treinamento", "Conteúdo e habilitação de profissionais"],
  ["read_only", "Somente leitura", "Sem poderes de alteração"]
];

function Status({ value }) {
  return <span className={`${styles.status} ${value === "active" ? styles.good : ["suspended","revoked"].includes(value) ? styles.bad : ""}`}>{String(value || "—").replaceAll("_", " ")}</span>;
}
function initials(name) { return String(name || "?").split(" ").filter(Boolean).map(part => part[0]).slice(0,2).join("").toUpperCase(); }

export default function AccessManager({ initialAccounts, initialInvites, roles, partners, currentProfileId }) {
  const [accounts, setAccounts] = useState(initialAccounts || []);
  const [invites, setInvites] = useState(initialInvites || []);
  const [tab, setTab] = useState("accounts");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteResult, setInviteResult] = useState(null);

  const visible = useMemo(() => accounts.filter(account => {
    const matchesKind = filter === "all" || account.kind === filter;
    const haystack = `${account.display_name} ${account.email} ${account.phone || ""} ${account.partner_name || ""}`.toLowerCase();
    return matchesKind && haystack.includes(search.toLowerCase());
  }), [accounts, filter, search]);
  const metrics = useMemo(() => ({
    active: accounts.filter(item => item.status === "active").length,
    staff: accounts.filter(item => item.kind === "staff" && item.status === "active").length,
    external: accounts.filter(item => ["broker","partner_user"].includes(item.kind) && item.status === "active").length,
    pending: invites.filter(item => item.status === "pending").length
  }), [accounts, invites]);

  async function reload() {
    const [newAccounts, newInvites] = await Promise.all([rpc("access_accounts"), rpc("account_invites", { p_status: null })]);
    setAccounts(newAccounts || []); setInvites(newInvites || []);
  }
  async function changeStatus(account, status) {
    const reason = prompt("Registre o motivo da alteração:", status === "active" ? "Acesso regularizado." : "Acesso suspenso pela gestão.");
    if (reason === null) return;
    await rpc("set_access_status", { p_profile_id: account.profile_id, p_status: status, p_reason: reason });
    setMessage("Status atualizado e registrado na auditoria."); await reload();
  }
  async function saveRoles(event) {
    event.preventDefault();
    const roleCodes = Array.from(new FormData(event.currentTarget).getAll("roles"));
    await rpc("set_staff_roles", { p_profile_id: editing.profile_id, p_role_codes: roleCodes });
    setEditing(null); setMessage("Papéis e permissões atualizados."); await reload();
  }
  async function createInvite(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const targetKind = String(form.get("targetKind"));
    const metadata = targetKind === "broker" ? {
      creci_number: form.get("creciNumber"), creci_state: form.get("creciState"),
      service_regions: String(form.get("regions") || "").split(",").map(value => value.trim()).filter(Boolean),
      capacity_per_day: Number(form.get("capacity") || 0) || null
    } : { access_scope: form.get("accessScope") || "read_only" };
    const created = await rpc("create_account_invite", {
      p_target_kind: targetKind,
      p_email: form.get("email"), p_phone: form.get("phone"), p_display_name: form.get("displayName"),
      p_partner_id: form.get("partnerId") || null,
      p_access_role_code: targetKind === "staff" ? form.get("accessRole") : null,
      p_membership_role: form.get("membershipRole") || "read_only",
      p_metadata: metadata, p_expires_in_days: Number(form.get("expiresIn") || 7)
    });
    setInviteResult(created); setMessage("Convite seguro criado."); await reload();
  }
  async function revoke(invite) {
    const reason = prompt("Motivo da revogação:", "Convite substituído ou não mais necessário.");
    if (reason === null) return;
    await rpc("revoke_account_invite", { p_invite_id: invite.id, p_reason: reason });
    setMessage("Convite revogado."); await reload();
  }

  return <div className={styles.shell}>
    <header className={styles.header}><NetworkMark/><div><Link href="/painel">Central de gestão</Link><button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/")}>Sair</button></div></header>
    <main className={styles.main}>
      <section className={styles.hero}><div><span className="eyebrow">Governança de identidade</span><h1>Equipe, usuários e permissões</h1><p>Crie acessos individuais, defina escopos claros e preserve a segregação entre operação, aprovação, publicação, financeiro e leitura.</p></div><button className="button button--orange" onClick={() => { setInviting(true); setInviteResult(null); }}>Convidar usuário <Icon name="arrow" size={18}/></button></section>
      <div className={styles.metrics}><article><Icon name="check"/><span>Contas ativas<b>{metrics.active}</b></span></article><article><Icon name="shield"/><span>Equipe interna<b>{metrics.staff}</b></span></article><article><Icon name="user"/><span>Acessos externos<b>{metrics.external}</b></span></article><article><Icon name="clock"/><span>Convites pendentes<b>{metrics.pending}</b></span></article></div>
      <nav className={styles.tabs}>{[["accounts","Usuários"],["roles","Papéis e matriz"],["invites","Convites"]].map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? styles.tabActive : ""}>{label}</button>)}</nav>
      {message && <div className={styles.notice}><Icon name="check" size={18}/>{message}<button onClick={() => setMessage("")}>×</button></div>}

      {tab === "accounts" && <section className={styles.card}>
        <div className={styles.cardHead}><div><h2>Diretório de usuários</h2><p>Um registro por pessoa, com vínculo, status e papéis auditáveis.</p></div><div className={styles.tools}><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nome, e-mail ou parceiro"/><div className={styles.filters}>{["all","staff","connector","broker","partner_user"].map(item => <button className={filter === item ? styles.selected : ""} onClick={() => setFilter(item)} key={item}>{item === "all" ? "Todos" : kindLabel[item]}</button>)}</div></div></div>
        <div className={styles.accountGrid}>{visible.map(account => <article className={styles.accountCard} key={account.profile_id}><header><span className={styles.avatar}>{initials(account.display_name)}</span><div><b>{account.display_name}</b><small>{account.email}</small></div><Status value={account.status}/></header><dl><dt>Perfil</dt><dd>{kindLabel[account.kind] || account.kind}</dd><dt>Vínculo</dt><dd>{account.partner_name || (account.creci_number ? `CRECI ${account.creci_state} ${account.creci_number}` : "Rede Conecta")}</dd><dt>Papéis</dt><dd><div className={styles.tags}>{(account.access_roles || []).length ? account.access_roles.map(role => <i key={role}>{role.replaceAll("_", " ")}</i>) : <span>Sem papel interno</span>}</div></dd></dl><footer>{account.kind === "staff" && <button onClick={() => setEditing(account)}>Configurar permissões</button>}{account.profile_id !== currentProfileId && (account.status === "active" ? <button className={styles.danger} onClick={() => changeStatus(account, "suspended")}>Suspender</button> : <button className={styles.activate} onClick={() => changeStatus(account, "active")}>Reativar</button>)}</footer></article>)}</div>{!visible.length && <p className={styles.empty}>Nenhuma conta encontrada.</p>}
      </section>}

      {tab === "roles" && <section className={styles.card}><div className={styles.cardHead}><div><h2>Papéis e matriz de responsabilidade</h2><p>Permissões são concedidas por função; o acesso efetivo é a união dos papéis ativos.</p></div></div><div className={styles.roleGrid}>{roles.map(role => <article key={role.code}><header><Icon name={role.code.includes("catalog") ? "building" : role.code.includes("finance") ? "money" : "shield"}/><div><b>{role.name}</b><small>{role.code}</small></div></header><p>{role.description}</p><div className={styles.permissionList}>{(role.permissions || []).slice(0,8).map(permission => <span key={permission}>{permission}</span>)}{(role.permissions || []).length > 8 && <em>+{role.permissions.length - 8} permissões</em>}</div></article>)}</div></section>}

      {tab === "invites" && <section className={styles.card}><div className={styles.cardHead}><div><h2>Convites de acesso</h2><p>Convites são pessoais, expiram e podem ser revogados antes da ativação.</p></div><button className="button button--orange" onClick={() => { setInviting(true); setInviteResult(null); }}>Novo convite</button></div><div className={styles.table}><table><thead><tr><th>Convidado</th><th>Perfil</th><th>Vínculo</th><th>Papel</th><th>Status</th><th>Validade</th><th></th></tr></thead><tbody>{invites.map(invite => <tr key={invite.id}><td><b>{invite.display_name}</b><small>{invite.email}</small></td><td>{kindLabel[invite.target_kind] || invite.target_kind}</td><td>{invite.partner_name || "Rede Conecta"}</td><td>{invite.access_role_code || invite.membership_role}</td><td><Status value={invite.status}/></td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(invite.expires_at))}</td><td>{invite.status === "pending" && <button className={styles.danger} onClick={() => revoke(invite)}>Revogar</button>}</td></tr>)}</tbody></table></div></section>}
    </main>

    {editing && <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && setEditing(null)}><form className={styles.modal} onSubmit={saveRoles}><header><div><span className="eyebrow">Permissões do usuário</span><h2>{editing.display_name}</h2></div><button type="button" onClick={() => setEditing(null)}>×</button></header><p>Marque apenas os papéis necessários. Para operações críticas, mantenha edição, aprovação e publicação em pessoas diferentes.</p><div className={styles.roleList}>{roles.map(role => <label key={role.code}><input type="checkbox" name="roles" value={role.code} defaultChecked={(editing.access_roles || []).includes(role.code)}/><span><b>{role.name}</b><small>{role.description}</small><em>{(role.permissions || []).length} permissões</em></span></label>)}</div><div className={styles.modalActions}><button type="button" className="button button--light" onClick={() => setEditing(null)}>Cancelar</button><button className="button button--orange">Salvar permissões</button></div></form></div>}

    {inviting && <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && setInviting(false)}><InviteWizard roles={roles} partners={partners} onSubmit={createInvite} onClose={() => setInviting(false)} result={inviteResult}/></div>}
  </div>;
}

function InviteWizard({ roles, partners, onSubmit, onClose, result }) {
  const [kind, setKind] = useState("staff");
  if (result) return <div className={styles.modal}><header><div><span className="eyebrow">Convite criado</span><h2>Acesso pronto para ativação</h2></div><button type="button" onClick={onClose}>×</button></header><div className={styles.successBox}><Icon name="check" size={30}/><p>Envie o link exclusivamente à pessoa convidada.</p><code>{result.activation_url}</code><button className="button button--orange" onClick={() => navigator.clipboard.writeText(result.activation_url)}>Copiar link seguro</button></div></div>;
  return <form className={`${styles.modal} ${styles.modalWide}`} onSubmit={onSubmit}><header><div><span className="eyebrow">Novo acesso</span><h2>Convidar usuário</h2></div><button type="button" onClick={onClose}>×</button></header><div className={styles.profileChoices}>{[["staff","Equipe interna","Opera e administra conforme permissões"],["partner_user","Usuário parceiro","Painel de leitura do empreendedor"],["broker","Corretor","Acesso vinculado a produtos e CRECI"]].map(([value,title,description]) => <label className={kind === value ? styles.choiceActive : ""} key={value}><input type="radio" name="targetKind" value={value} checked={kind === value} onChange={() => setKind(value)}/><Icon name={value === "staff" ? "shield" : value === "broker" ? "user" : "handshake"}/><span><b>{title}</b><small>{description}</small></span></label>)}</div><div className={styles.formGrid}><label>Nome completo<input name="displayName" required/></label><label>E-mail corporativo<input name="email" type="email" required/></label><label>WhatsApp<input name="phone" inputMode="tel"/></label><label>Validade do convite<select name="expiresIn" defaultValue="7"><option value="3">3 dias</option><option value="7">7 dias</option><option value="15">15 dias</option></select></label>{kind !== "staff" && <label>Parceiro vinculado<select name="partnerId" required><option value="">Selecione</option>{partners.map(partner => <option value={partner.id} key={partner.id}>{partner.name}</option>)}</select></label>}{kind === "staff" && <label>Papel interno<select name="accessRole" required><option value="">Selecione</option>{roles.map(role => <option value={role.code} key={role.code}>{role.name}</option>)}</select></label>}<label>Papel no vínculo<select name="membershipRole" defaultValue={kind === "staff" ? "manager" : "read_only"}>{membershipOptions.map(([value,title]) => <option value={value} key={value}>{title}</option>)}</select></label>{kind === "partner_user" && <label>Escopo de leitura<select name="accessScope"><option value="executive">Executivo</option><option value="commercial">Comercial</option><option value="finance">Financeiro</option><option value="legal">Jurídico</option><option value="read_only">Leitura geral</option></select></label>}{kind === "broker" && <><label>Número do CRECI<input name="creciNumber" required/></label><label>UF do CRECI<input name="creciState" maxLength="2" required/></label><label>Regiões de atuação<input name="regions" placeholder="Uberlândia, Monte Carmelo"/></label><label>Capacidade diária<input name="capacity" type="number" min="1"/></label></>}</div><div className={styles.securityNote}><Icon name="shield"/><span><b>Princípio do menor privilégio</b>O usuário receberá somente o papel e o vínculo selecionados. Alterações posteriores ficam registradas em auditoria.</span></div><div className={styles.modalActions}><button type="button" className="button button--light" onClick={onClose}>Cancelar</button><button className="button button--orange">Criar convite seguro</button></div></form>;
}
