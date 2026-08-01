import "./globals.css";
import "./commercial.css";
import "./mobile-home.css";
import { SITE_URL } from "@/lib/config";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Rede Conecta", template: "%s · Rede Conecta" },
  description: "A rede de inteligência comercial que transforma confiança em oportunidades rastreáveis e receita.",
  applicationName: "Rede Conecta",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Rede Conecta",
    title: "Rede Conecta · Transforme confiança em oportunidades",
    description: "Conectores abrem portas. A Rede Conecta recomenda, opera e acompanha. Empresas vendem com origem preservada."
  }
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#071c3a" };

export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
