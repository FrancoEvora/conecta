import { Header, Footer } from "@/components/UI";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Fale com a Rede Conecta",
  description: "Solicite uma apresentação comercial da infraestrutura de vendas da Rede Conecta."
};

export default async function ContactPage({ searchParams }) {
  const params = await searchParams;
  const profile = ["empreendedor","corretor","parceiro"].includes(params?.perfil) ? params.perfil : "empreendedor";
  return <><Header/><main className="contact-shell"><section className="contact-card"><div className="contact-card__intro"><span className="eyebrow">Apresentação comercial</span><h1>Leve a Rede Conecta para sua operação.</h1><p>Conte brevemente seu perfil e sua necessidade. A solicitação será preparada para contato com a equipe responsável.</p><div className="orange-line"/><strong>Mais demanda. Mais governança. Mais clareza comercial.</strong></div><ContactForm initialProfile={profile}/></section></main><Footer/></>;
}
