import { Header } from "@/components/UI";
import PasswordResetForm from "./PasswordResetForm";

export const metadata = { title: "Nova senha" };
export default function NewPasswordPage() {
  return <><Header minimal/><main className="login-page"><section className="login-promo"><div><span className="eyebrow">Segurança da conta</span><h1>Proteja seu acesso à <em>Rede Conecta.</em></h1><p>As ações sensíveis ficam associadas ao usuário, horário, função e trilha de auditoria.</p></div></section><section className="login-panel"><PasswordResetForm/></section></main></>;
}
