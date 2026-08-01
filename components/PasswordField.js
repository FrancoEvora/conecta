"use client";

import { useMemo, useState } from "react";

function Eye({ open }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {open ? <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M3 3l18 18"/><path d="M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3 3.7M6.3 6.3C3.5 8.2 2 12 2 12s3.5 6 10 6a10.7 10.7 0 0 0 4.1-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>}
  </svg>;
}

export function passwordRules(value = "") {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value)
  };
}

export function passwordStrength(value = "") {
  const rules = passwordRules(value);
  const count = Object.values(rules).filter(Boolean).length;
  if (!value) return { score: 0, label: "" };
  if (count <= 2) return { score: 1, label: "Fraca" };
  if (count === 3) return { score: 2, label: "Razoável" };
  if (count === 4) return { score: 3, label: "Boa" };
  return { score: 4, label: "Excelente" };
}

export default function PasswordField({ label, name, value, onChange, autoComplete = "current-password", showStrength = false, confirmValue, required = true, minLength = 8 }) {
  const [visible, setVisible] = useState(false);
  const strength = useMemo(() => passwordStrength(value), [value]);
  const rules = useMemo(() => passwordRules(value), [value]);
  const matches = confirmValue === undefined || !confirmValue ? null : value === confirmValue;

  return <label style={{ display: "grid", gap: 7 }}>
    <span>{label}</span>
    <span style={{ position: "relative", display: "block" }}>
      <input
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        style={{ width: "100%", paddingRight: 48 }}
      />
      <button
        type="button"
        onClick={() => setVisible(current => !current)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        title={visible ? "Ocultar senha" : "Mostrar senha"}
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, border: 0, borderRadius: 9, background: "transparent", color: "#53627a", display: "grid", placeItems: "center" }}
      ><Eye open={visible}/></button>
    </span>
    {showStrength && value && <span style={{ display: "grid", gap: 8, marginTop: 2 }}>
      <span style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
        {[1,2,3,4].map(item => <i key={item} style={{ height: 4, borderRadius: 99, background: item <= strength.score ? "#ff6500" : "#e3e7ec" }}/>) }
      </span>
      <small style={{ color: "#53627a" }}>Força da senha: <b style={{ color: "#071c3a" }}>{strength.label}</b></small>
      <span style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "5px 12px", fontSize: 12, color: "#657187" }}>
        {[["length","8 caracteres"],["upper","letra maiúscula"],["lower","letra minúscula"],["number","número"],["symbol","símbolo"]].map(([key,text]) => <span key={key} style={{ color: rules[key] ? "#16865c" : "#657187" }}>{rules[key] ? "✓" : "○"} {text}</span>)}
      </span>
    </span>}
    {matches !== null && <small style={{ color: matches ? "#16865c" : "#b73737" }}>{matches ? "✓ As senhas coincidem." : "As senhas ainda não coincidem."}</small>}
  </label>;
}
