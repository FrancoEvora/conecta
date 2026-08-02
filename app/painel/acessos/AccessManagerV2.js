"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, NetworkMark } from "@/components/UI";
import PasswordField from "@/components/PasswordField";
import styles from "./AccessManager.module.css";

async function appRpc(operation, params = {}) {
  const response = await fetch("/api/app/rpc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, params }) });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) { location.href = "/entrar?expirado=1"; throw new Error("Sessão expirada."); }
  if (!response.ok) throw new Error(payload.error || "Operação não concluída.");
  return payload.data;
}

async function accountAction(profileId, action, extra = {}) {
  const response = await fetch("/api/admin/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId, action, ...extra }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Não foi possível administrar a conta.");
  return payload;
}

const kindLabel = { staff: "Equipe interna", connector: "Conector", broker: "Especialista comercial", partner_user: "Usuário parceiro" };
const professionalTypes = [
  ["real_estate_broker", "Corretor de imóveis"], ["real_estate_consultant", "Consultor imobiliário"],
  ["vehicle_salesperson", "Vendedor de veículos"], ["solar_consultant", "Consultor de energia solar"],
  ["insurance_consultant", "Consultor de seguros"], ["consortium_consultant", "Consultor de consórcios"],
  ["financial_consultant", "Consultor financeiro"], ["commercial_specialist", "Especialista comercial"],
  ["internal_sales", "Vendedor interno"]
];

function Status({ value }) {
  return <span className={`${styles.status} ${value === "active" ? styles.good : ["suspended", "revoked"].includes(value) ? styles.bad : ""}`}>{String(value || "—").replaceAll("_", " ")}</span>;
}
function initials(name) { return String(name || "?").split(" ").filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase(); }

export default function AccessManagerV2({ initialAccounts, initialInvites, roles, partners, currentProfileId }) {
  const [accounts, setAccounts] = useState(initialAccounts || []);
  const [invites, setInvites] = useState(initialInvites || []);
  const [tab, setTab] = useState("accounts");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [passwordAccount, setPasswordAccount] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [notice, setNotice] = useState({ message: "", error: false });

  const visible = useMemo(() => accounts.filter(account => {
    const kind = filter === "all" || account.kind === filter;
    const text = `${account.display_name} ${account.email} ${account.partner_name || ""}`.toLowerCase();
    return kind && text.includes(search.toLowerCase());
  }), [accounts, filter, search]);

  async function reload() {
    const [newAccounts, newInvites] = await Promise.all([appRpc("access_accounts"), appRpc("account_invites", { p_status: null })]);
    setAccounts(newAccounts || []); setInvites(newInvites || []);
  }
  async function execute(callback) {
    setNotice({ message: "", error: false });
    try { await callback(); } catch (error) { setNotice({ message: error.message, error: true }); }
  }
  function changeStatus(account, action) {
    execute(async () => {
      const reason = prompt("Motivo da alteração:", action === "suspend" ? "Acesso suspenso pela gestão." : "Acesso reativado pela gestão.");
      if (reason === null) return;
      const result = await accountAction(account.profile_id, action, { reason });
      setNotice({ message: result.message, error: false }); await reload();
    });
  }
  function sendRecovery(account) {
    execute(async () => { const result = await accountAction(account.profile_id, "send_recovery"); setNotice({ message: result.message, error: false }); });
  }
  function savePassword(event) {
    event.preventDefault();
    execute(async () => {
      const form = new FormData(event.currentTarget);
      const password = String(form.get("password") || "");
      if (password !== String(form.get("confirmation") || "")) throw new Error("As senhas não coincidem.");
      const result = await accountAction(passwordAccount.profile_id, "set_password", { password });
      setPasswordAccount(null); setNotice({ message: result.message, error: false });
    });
  }
  function createInvite(event) {
    event.preventDefault();
    execute(async () => {
      const form = new FormData(event.currentTarget);
      const kind = String(form.get("targetKind"));
      const created = kind === "broker"
        ? await appRpc("create_specialist_invite", {
            p_email: form.get("email"), p_phone: form.get("phone"), p_display_name: form.get("displayName"), p_partner_id: form.get("partnerId"),
            p_professional_type: form.get("professionalType"), p_credential_type: form.get("credentialType") || null,
            p_credential_number: form.get("credentialNumber") || null, p_credential_state: form.get("credentialState") || null,
            p_service_regions: String(form.get("regions") || "").split(",").map(value => value.trim()).filter(Boolean),
            p_capacity_per_day: Number(form.get("capacity") || 0) || null, p_expires_in_days: Number(form.get("expiresIn") || 7)
          })
        : await appRpc("create_account_invite", {
            p_target_kind: kind, p_email: form.get("email"), p_phone: form.get("phone"), p_display_name: form.get("displayName"),
            p_partner_id: kind === "partner_user" ? form.get("partnerId") : null,
            p_access_role_code: kind === "staff" ? form.get("accessRole") : null,
            p_membership_role: kind === "staff" ? "manager" : "read_only",
            p_metadata: kind === "partner_user" ? { access_scope: "read_only" } : {}, p_expires_in_days: Number(form.get("expiresIn") || 7)
          });
      setInviteResult(created); setNotice({ message: "Convite seguro criado.", error: false }); await reload();
    });
  }

  return <div className={styles.shell}>
    <header className={styles.header}><NetworkMark/><div><Link href="/painel">Central de gestão</Link><button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.href = "/")}>Sair</button></div></header>
    <main className={styles.main}>
      <section className={styles.hero}><div><span className="eyebrow">Identidade e segurança</span><h1>Pessoas, especialistas e acessos</h1><p>Administre profissionais de imóveis, veículos, energia, seguros e outros mercados. CRECI é opcional e só deve ser informado quando aplicável.</p></div><button className="button button--orange" onClick={() => { setInviting(true); setInviteResult(null); }}>Convidar pessoa <Icon name="arrow" size={18}/></button></section>
      <nav className={styles.tabs}>{[["accounts", "Usuários"], ["invites", "Convites"], ["roles", "Papéis"]].map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? styles.tabActive : ""}>{label}</button>)}</nav>
      {notice.message && <div className={styles.notice} style={notice.error ? { borderColor: "#d9382b", color: "#a3261e" } : undefined}><Icon name={notice.error ? "shield" : "check"} size={18}/>{notice.message}<button onClick={() => setNotice({ message: "", error: false })}>×</button></div>}

      {tab === "accounts" && <section className={styles.card}>
        <div className={styles.cardHead}><div><h2>Diretório de usuários</h2><p>Suspensão e reativação também bloqueiam ou liberam o login no Supabase Auth.</p></div><div className={styles.tools}><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nome, e-mail ou empresa"/><div className={styles.filters}>{["all", "staff", "connector", "broker", "partner_user"].map(item => <button className={filter === item ? styles.selected : ""} onClick={() => setFilter(item)} key={item}>{item === "all" ? "Todos" : kindLabel[item]}</button>)}</div></div></div>
        <div className={styles.accountGrid}>{visible.map(account => <article className={styles.accountCard} key={account.profile_id}>
          <header><span className={styles.avatar}>{initials(account.display_name)}</span><div><b>{account.display_name}</b><small>{account.email}</small></div><Status value={account.status}/></header>
          <dl><dt>Perfil</dt><dd>{kindLabel[account.kind] || account.kind}</dd><dt>Vínculo</dt><dd>{account.partner_name || "Rede Conecta"}</dd><dt>Credencial</dt><dd>{account.credential_type && account.credential_number ? `${account.credential_type} ${account.credential_state || ""} ${account.credential_number}` : account.creci_number ? `CRECI ${account.creci_state || ""} ${account.creci_number}` : "Não exigida"}</dd></dl>
          <footer><button onClick={() => setPasswordAccount(account)}>Trocar senha</button><button onClick={() => sendRecovery(account)}>Enviar redefinição</button>{account.profile_id !== currentProfileId && (account.status === "active" ? <button className={styles.danger} onClick={() => changeStatus(account, "suspend")}>Suspender</button> : <button className={styles.activate} onClick={() => changeStatus(account, "reactivate")}>Reativar</button>)}</footer>
        </article>)}</div>
      </section>}

      {tab === "invites" && <section className={styles.card}><div className={styles.cardHead}><div><h2>Convites</h2><p>Um convite aceito continua válido para recuperar uma ativação incompleta e redefinir a senha.</p></div><button className="button button--orange" onClick={() => { setInviting(true); setInviteResult(null); }}>Novo convite</button></div><div className={styles.table}><table><thead><tr><th>Pessoa</th><th>Perfil</th><th>Vínculo</th><th>Status</th><th>Validade</th></tr></thead><tbody>{invites.map(invite => <tr key={invite.id}><td><b>{invite.display_name}</b><small>{invite.email}</small></td><td>{kindLabel[invite.target_kind] || invite.target_kind}</td><td>{invite.partner_name || "Rede Conecta"}</td><td><Status value={invite.status}/></td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(invite.expires_at))}</td></tr>)}</tbody></table></div></section>}
      {tab === "roles" && <section className={styles.card}><div className={styles.cardHead}><div><h2>Papéis e permissões</h2><p>A profissão do usuário não concede automaticamente poderes administrativos.</p></div></div><div className={styles.roleGrid}>{roles.map(role => <article key={role.code}><header><Icon name="shield"/><div><b>{role.name}</b><small>{role.code}</small></div></header><p>{role.description}</p></article>)}</div></section>}
    </main>

    {passwordAccount && <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && setPasswordAccount(null)}><form className={styles.modal} onSubmit={savePassword}><header><div><span className="eyebrow">Segurança</span><h2>Trocar senha de {passwordAccount.display_name}</h2></div><button type="button" onClick={() => setPasswordAccount(null)}>×</button></header><p>Use ao menos 10 caracteres, com maiúscula, minúscula, número e símbolo.</p><PasswordField label="Nova senha temporária" name="password" autoComplete="new-password" showStrength/><PasswordField label="Confirmar senha" name="confirmation" autoComplete="new-password"/><div className={styles.modalActions}><button type="button" className="button button--light" onClick={() => setPasswordAccount(null)}>Cancelar</button><button className="button button--orange">Atualizar senha</button></div></form></div>}
    {inviting && <div className={styles.backdrop} onMouseDown={event => event.target === event.currentTarget && setInviting(false)}><InviteWizard roles={roles} partners={partners} onSubmit={createInvite} onClose={() => setInviting(false)} result={inviteResult}/></div>}
  </div>;
}

function InviteWizard({ roles, partners, onSubmit, onClose, result }) {
  const [kind, setKind] = useState("broker");
  const [professionalType, setProfessionalType] = useState("vehicle_salesperson");
  if (result) return <div className={styles.modal}><header><div><span className="eyebrow">Convite criado</span><h2>Acesso pronto</h2></div><button type="button" onClick={onClose}>×</button></header><div className={styles.successBox}><Icon name="check" size={30}/><p>Envie o link exclusivamente à pessoa convidada.</p><code>{result.activation_url}</code><button className="button button--orange" onClick={() => navigator.clipboard.writeText(result.activation_url)}>Copiar link</button></div></div>;
  return <form className={`${styles.modal} ${styles.modalWide}`} onSubmit={onSubmit}>
    <header><div><span className="eyebrow">Novo acesso</span><h2>Convidar pessoa</h2></div><button type="button" onClick={onClose}>×</button></header>
    <div className={styles.profileChoices}>{[["broker", "Especialista comercial", "Imóveis, veículos e outros mercados"], ["staff", "Equipe interna", "Acesso conforme permissões"], ["partner_user", "Usuário parceiro", "Painel empresarial de leitura"]].map(([value, title, description]) => <label className={kind === value ? styles.choiceActive : ""} key={value}><input type="radio" name="targetKind" value={value} checked={kind === value} onChange={() => setKind(value)}/><Icon name={value === "staff" ? "shield" : value === "broker" ? "user" : "handshake"}/><span><b>{title}</b><small>{description}</small></span></label>)}</div>
    <div className={styles.formGrid}><label>Nome completo<input name="displayName" required/></label><label>E-mail<input name="email" type="email" required/></label><label>WhatsApp<input name="phone" inputMode="tel"/></label><label>Validade<select name="expiresIn" defaultValue="7"><option value="3">3 dias</option><option value="7">7 dias</option><option value="15">15 dias</option></select></label>
      {kind !== "staff" && <label>Empresa ou parceiro<select name="partnerId" required><option value="">Selecione</option>{partners.map(partner => <option value={partner.id} key={partner.id}>{partner.name}</option>)}</select></label>}
      {kind === "staff" && <label>Papel interno<select name="accessRole" required><option value="">Selecione</option>{roles.map(role => <option value={role.code} key={role.code}>{role.name}</option>)}</select></label>}
      {kind === "broker" && <><label>Categoria profissional<select name="professionalType" value={professionalType} onChange={event => setProfessionalType(event.target.value)}>{professionalTypes.map(([value, title]) => <option value={value} key={value}>{title}</option>)}</select></label><label>Tipo de credencial <small>opcional</small><input name="credentialType" placeholder={professionalType === "real_estate_broker" ? "CRECI" : "Ex.: registro interno"}/></label><label>Número da credencial <small>opcional</small><input name="credentialNumber"/></label><label>Estado <small>opcional</small><input name="credentialState" maxLength="2" placeholder="MG"/></label><label>Regiões<input name="regions" placeholder="Uberlândia, Monte Carmelo"/></label><label>Capacidade diária<input name="capacity" type="number" min="1" max="100"/></label></>}
    </div><div className={styles.modalActions}><button type="button" className="button button--light" onClick={onClose}>Cancelar</button><button className="button button--orange">Criar convite seguro</button></div>
  </form>;
}
