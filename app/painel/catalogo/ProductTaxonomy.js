export const PRODUCT_SEGMENTS = [
  { code: "real_estate", label: "Imóveis", icon: "building", types: [
    ["residential_lot", "Lote residencial"], ["commercial_lot", "Lote ou área comercial"], ["house", "Casa"],
    ["apartment", "Apartamento"], ["office", "Sala ou escritório"], ["warehouse", "Galpão"],
    ["rural_property", "Imóvel rural"], ["lot_plus_project", "Lote + projeto ou construção"], ["hospitality", "Hotelaria ou multipropriedade"]
  ]},
  { code: "vehicles", label: "Veículos", icon: "target", types: [
    ["car", "Automóvel"], ["motorcycle", "Motocicleta"], ["utility", "Utilitário"], ["truck", "Caminhão"],
    ["agricultural_machine", "Máquina agrícola"], ["construction_machine", "Máquina de construção"]
  ]},
  { code: "beauty", label: "Perfumaria e beleza", icon: "check", types: [
    ["perfume", "Perfume"], ["cosmetics", "Cosméticos"], ["skin_care", "Cuidados com a pele"], ["beauty_kit", "Kit de beleza"]
  ]},
  { code: "solar", label: "Energia solar", icon: "chart", types: [
    ["residential_system", "Sistema residencial"], ["commercial_system", "Sistema empresarial"], ["rural_system", "Sistema rural"], ["solar_subscription", "Assinatura de energia"]
  ]},
  { code: "agribusiness", label: "Agronegócio", icon: "target", types: [
    ["inputs", "Insumos"], ["equipment", "Equipamentos"], ["services", "Serviços técnicos"], ["commodities", "Produtos agropecuários"]
  ]},
  { code: "financial", label: "Soluções financeiras", icon: "money", types: [
    ["consortium", "Consórcio"], ["insurance", "Seguro"], ["credit", "Crédito"], ["investment", "Investimento"]
  ]},
  { code: "services", label: "Serviços", icon: "handshake", types: [
    ["professional_service", "Serviço profissional"], ["education", "Educação"], ["health", "Saúde"], ["tourism", "Turismo"]
  ]},
  { code: "other", label: "Outro segmento", icon: "menu", types: [["other", "Outro produto"]] }
];

export const DEVELOPMENT_TYPES = {
  real_estate: [["planned_neighborhood", "Bairro planejado"], ["gated_community", "Condomínio fechado"], ["subdivision", "Loteamento aberto"], ["vertical_development", "Empreendimento vertical"], ["commercial_center", "Centro comercial"], ["mixed_use", "Uso misto"], ["rural_development", "Empreendimento rural"]],
  vehicles: [["dealership", "Concessionária ou revenda"], ["marketplace", "Marketplace"], ["fleet", "Frota ou locadora"]],
  beauty: [["brand", "Marca"], ["store", "Loja"], ["distributor", "Distribuidor"]],
  solar: [["integrator", "Integradora"], ["energy_company", "Empresa de energia"]],
  agribusiness: [["agrocenter", "Agrocenter"], ["supplier", "Fornecedor"], ["cooperative", "Cooperativa"]],
  financial: [["financial_company", "Empresa financeira"], ["brokerage", "Corretora ou representante"]],
  services: [["service_company", "Empresa de serviços"], ["network", "Rede de prestadores"]],
  other: [["business_unit", "Unidade de negócio"]]
};

export function segmentByCode(code) { return PRODUCT_SEGMENTS.find(segment => segment.code === code) || PRODUCT_SEGMENTS[0]; }
export function typeLabel(segmentCode, typeCode) { return segmentByCode(segmentCode).types.find(([code]) => code === typeCode)?.[1] || typeCode || ""; }
