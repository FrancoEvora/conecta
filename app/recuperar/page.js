import { Header } from "@/components/UI";
import RecoveryForm from "./RecoveryForm";

export const metadata = { title: "Recuperar acesso", description: "Solicite com segurança um link para criar uma nova senha na Rede Conecta." };
export default function RecoveryPage() {
  return <><Header minimal/><main className="login-page"><section className="login-promo"><div><span className="eyebrow">Segurança da sua conta</span><h1>Seu acesso pode ser recuperado sem perder <em>nenhuma conexão.</em></h1><p>Seu histórico, oportunidades, autorizações e resultados continuam vinculados ao perfil original.</p></div></section><section className="login-panel"><RecoveryForm/></section></main></>;
}
