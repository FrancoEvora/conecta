import "./globals.css";
import { SITE_URL } from "@/lib/config";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Rede Conecta", template: "%s · Rede Conecta" },
  description: "Conectando pessoas a oportunidades imobiliárias específicas, com atendimento, acompanhamento e recompensas transparentes.",
  applicationName: "Rede Conecta",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Rede Conecta",
    title: "Rede Conecta · Conectando Pessoas e Negócios",
    description: "Convites oficiais para produtos específicos, com origem identificada e atendimento somente após autorização."
  }
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#071c3a" };

export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
