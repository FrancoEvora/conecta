import { Footer, Header, Icon } from "@/components/UI";
import ApplicationForm from "./ApplicationForm";

export const metadata = { title: "Cadastro de conector" };
export default function ApplicationPage() {
  return <><Header/><main><section className="page-hero page-hero--compact"><div className="container"><span className="eyebrow">Faça parte da rede</span><h1>Transforme boas conexões em <em>oportunidades rastreáveis.</em></h1><p>O conector compartilha produtos oficiais. A equipe especializada assume o atendimento e a plataforma acompanha a origem e as recompensas.</p></div></section><section className="section"><div className="container application-layout"><div className="application-benefits"><article><Icon name="link"/><span><b>Links personalizados</b>Compartilhe campanhas e produtos específicos.</span></article><article><Icon name="headset"/><span><b>Atendimento interno</b>Você não precisa negociar nem intermediar.</span></article><article><Icon name="chart"/><span><b>Acompanhamento</b>Visualize cada etapa da conexão.</span></article><article><Icon name="money"/><span><b>Recompensas transparentes</b>Regras registradas por campanha.</span></article></div><ApplicationForm/></div></section></main><Footer/></>;
}
