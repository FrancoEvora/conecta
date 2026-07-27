import { Header, Icon } from "@/components/UI";
import LoginForm from "./LoginForm";

export const metadata = { title: "Entrar", description: "Acesso protegido aos painéis da Rede Conecta." };
export default function LoginPage() {
  return <><Header minimal/><main className="login-page"><section className="login-promo"><div><span className="eyebrow">Plataforma operacional</span><h1>Gestão de conexões, negócios e <em>origem protegida.</em></h1><ul><li><Icon name="shield"/>Acesso por função e permissão</li><li><Icon name="chart"/>Operação centralizada pela Rede Conecta</li><li><Icon name="link"/>Origem e janela de proteção preservadas</li><li><Icon name="check"/>Parceiros e corretores em painéis de leitura</li></ul></div></section><section className="login-panel"><LoginForm/></section></main></>;
}
