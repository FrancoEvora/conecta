import { Header } from "@/components/UI";
import RecoveryForm from "./RecoveryForm";

export const metadata = { title: "Recuperar senha" };
export default function RecoveryPage() {
  return <><Header minimal/><main className="login-page"><section className="login-promo"><div><span className="eyebrow">Acesso seguro</span><h1>Recupere sua conta sem perder o <em>histórico da operação.</em></h1><p>Links, indicações, autorizações, tarefas e registros permanecem associados ao perfil original.</p></div></section><section className="login-panel"><RecoveryForm/></section></main></>;
}
