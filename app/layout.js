import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://conecta-futura-casa.vercel.app"),
  title: { default: "Rede Conecta", template: "%s · Rede Conecta" },
  description: "Conectando pessoas a oportunidades imobiliárias específicas, com atendimento, acompanhamento e recompensas transparentes.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg" }
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#071c3a" };

export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
