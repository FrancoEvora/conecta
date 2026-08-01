export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xnpotbtjkhgnscatpjns.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Fb8JntQPGzKDj3A2iaffuw_rlu_-0ph";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://conecta-pearl.vercel.app";
export const SITE_URL = configuredSiteUrl.replace(/\/+$/, "");
export const POLICY_VERSION = "conecta-privacy-2026-07-26";
export const ORGANIZATION_SLUG = "conecta-futura-casa";

export const fallbackProducts = [
  {
    product_slug: "solaris",
    product_name: "Solaris Residencial Resort",
    product_category: "Residencial Resort",
    product_description: "Lotes residenciais a partir de 360 m², com infraestrutura planejada, lazer e integração à natureza.",
    product_service_region: "Monte Carmelo e região",
    product_bonus_cents: 350000,
    product_minimum_ticket_cents: 42000000,
    invitation_code: "SOLARIS-FRANCO-2026",
    product_metadata: {
      area_from: "360 m²", payment: "Condições facilitadas", lifestyle: "Lazer e natureza",
      location: "Monte Carmelo · MG", image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=82",
      features: ["Lotes amplos", "Portaria e segurança", "Lazer completo", "Obras em andamento"]
    },
    campaign_slug: "solaris",
    campaign_title: "Solaris Residencial Resort",
    campaign_location: "Monte Carmelo · MG",
    campaign_summary: "Conheça o Solaris: natureza, lazer e condições facilitadas."
  },
  {
    product_slug: "parque-comercial",
    product_name: "Parque das Árvores · Áreas Comerciais",
    product_category: "Áreas comerciais",
    product_description: "Áreas estratégicas para varejo, serviços, saúde, hotelaria e operações regionais.",
    product_service_region: "MG-190 · Monte Carmelo",
    product_bonus_cents: 500000,
    invitation_code: "PARQUE-FRANCO-2026",
    product_metadata: {
      area_from: "1.500 m²", payment: "Condições empresariais", lifestyle: "Fluxo e centralidade",
      location: "MG-190 · Monte Carmelo", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=82",
      features: ["Eixo regional", "Uso comercial", "Áreas moduláveis", "Estudo de implantação"]
    },
    campaign_slug: "parque-comercial",
    campaign_title: "Parque das Árvores · Áreas Comerciais",
    campaign_location: "MG-190 · Monte Carmelo",
    campaign_summary: "Oportunidades comerciais em bairro planejado."
  },
  {
    product_slug: "futura-casa",
    product_name: "Futura Casa · Lote + Projeto",
    product_category: "Casa e lote",
    product_description: "Solução integrada para escolha do lote, diagnóstico da família e planejamento da casa.",
    product_service_region: "Monte Carmelo e região",
    product_bonus_cents: 250000,
    invitation_code: "FUTURA-FRANCO-2026",
    product_metadata: {
      area_from: "Projeto personalizado", payment: "Simulação integrada", lifestyle: "Casa pensada para a família",
      location: "Monte Carmelo · MG", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=82",
      features: ["Diagnóstico inicial", "Escolha do lote", "Programa da casa", "Simulação financeira"]
    },
    campaign_slug: "futura-casa",
    campaign_title: "Futura Casa · Lote + Projeto",
    campaign_location: "Monte Carmelo · MG",
    campaign_summary: "Do lote ao projeto da casa, em uma jornada orientada."
  }
];
