import Link from "next/link";
import { Header, Icon } from "@/components/UI";
import LoginForm from "./LoginForm";
export const metadata={title:"Entrar"};
export default function LoginPage(){return <><Header minimal/><main className="login-page"><section className="login-promo"><div><span className="eyebrow">Área protegida</span><h1>Gestão de conexões, leads e recompensas em um só lugar.</h1><ul><li><Icon name="shield"/>Acesso por usuário e perfil</li><li><Icon name="chart"/>Indicadores por produto</li><li><Icon name="link"/>Origem de cada conexão preservada</li></ul></div></section><section className="login-panel"><LoginForm/><div className="demo-access"><span>Conhecer antes de entrar</span><Link href="/demo">Abrir ambiente demonstrativo</Link></div></section></main></>}
