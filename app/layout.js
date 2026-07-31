import "./globals.css";
import "./commercial.css";
import { SITE_URL } from "@/lib/config";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Rede Conecta", template: "%s · Rede Conecta" },
  description: "A infraestrutura comercial que transforma relacionamentos em oportunidades imobiliárias rastreáveis.",
  applicationName: "Rede Conecta",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Rede Conecta",
    title: "Rede Conecta · Relacionamento com infraestrutura comercial",
    description: "Conectores originam oportunidades. A Rede Conecta opera. Empreendedores e corretores acompanham resultados com origem preservada."
  }
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#071c3a" };

export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
