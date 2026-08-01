import { Header } from "@/components/UI";
import ConfirmationForm from "./ConfirmationForm";

export const metadata = { title: "Confirmar e-mail" };

export default function ConfirmEmailPage() {
  return <><Header minimal/><main className="login-page"><section className="login-promo"><div><span className="eyebrow">Ativação da conta</span><h1>Confirme seu e-mail para liberar sua <em>jornada na Rede Conecta.</em></h1><p>O link confirma que o endereço pertence a você e protege seu histórico, seus compartilhamentos e suas futuras recompensas.</p></div></section><section className="login-panel"><ConfirmationForm/></section></main></>;
}
