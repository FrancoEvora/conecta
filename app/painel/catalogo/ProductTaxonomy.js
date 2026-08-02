import { COMMERCIAL_SEGMENTS, commercialSegmentByCode } from "@/lib/commercial-segments";

const PRODUCT_TYPES = {
  imoveis: [
    ["residential_lot", "Lote residencial"],
    ["commercial_lot", "Lote ou área comercial"],
    ["house", "Casa"],
    ["apartment", "Apartamento"],
    ["office", "Sala ou escritório"],
    ["warehouse", "Galpão"],
    ["rural_property", "Imóvel rural"],
    ["lot_plus_project", "Lote + projeto ou construção"],
    ["hospitality", "Hotelaria ou multipropriedade"]
  ],
  veiculos: [
    ["car", "Automóvel"],
    ["motorcycle", "Motocicleta"],
    ["utility", "Utilitário"],
    ["truck", "Caminhão"],
    ["agricultural_machine", "Máquina agrícola"],
    ["construction_machine", "Máquina de construção"]
  ],
  perfumaria: [
    ["perfume", "Perfume"],
    ["cosmetics", "Cosméticos"],
    ["skin_care", "Cuidados com a pele"],
    ["hair_care", "Cuidados capilares"],
    ["beauty_kit", "Kit de beleza"]
  ],
  "energia-solar": [
    ["residential_system", "Sistema residencial"],
    ["commercial_system", "Sistema empresarial"],
    ["rural_system", "Sistema rural"],
    ["solar_subscription", "Assinatura de energia"],
    ["maintenance", "Manutenção e monitoramento"]
  ],
  agronegocio: [
    ["rural_property", "Terra ou propriedade rural"],
    ["inputs", "Insumos"],
    ["equipment", "Máquinas e equipamentos"],
    ["technical_service", "Serviços técnicos"],
    ["commodities", "Produtos agropecuários"],
    ["logistics", "Logística e armazenagem"]
  ],
  turismo: [
    ["travel_package", "Pacote de viagem"],
    ["hotel", "Hospedagem"],
    ["resort", "Resort"],
    ["experience", "Experiência"],
    ["ticket", "Passagem ou ingresso"]
  ],
  seguros: [
    ["life_insurance", "Seguro de vida"],
    ["auto_insurance", "Seguro de veículo"],
    ["property_insurance", "Seguro patrimonial"],
    ["rural_insurance", "Seguro rural"],
    ["health_insurance", "Seguro saúde"],
    ["business_insurance", "Seguro empresarial"]
  ],
  consorcios: [
    ["property_consortium", "Consórcio de imóvel"],
    ["vehicle_consortium", "Consórcio de veículo"],
    ["heavy_vehicle_consortium", "Consórcio de máquinas e pesados"],
    ["service_consortium", "Consórcio de serviços"],
    ["solar_consortium", "Consórcio para energia solar"]
  ],
  saude: [
    ["consultation", "Consulta"],
    ["exam", "Exame"],
    ["dental", "Serviço odontológico"],
    ["therapy", "Terapia ou reabilitação"],
    ["health_plan", "Plano ou assinatura de saúde"],
    ["clinical_procedure", "Procedimento clínico"]
  ],
  educacao: [
    ["course", "Curso"],
    ["school", "Escola"],
    ["graduation", "Graduação"],
    ["postgraduate", "Pós-graduação"],
    ["professional_training", "Capacitação profissional"],
    ["mentoring", "Mentoria"]
  ],
  tecnologia: [
    ["software", "Software"],
    ["hardware", "Equipamento"],
    ["saas", "Plataforma por assinatura"],
    ["automation", "Automação"],
    ["connectivity", "Conectividade"],
    ["technical_service", "Serviço técnico"]
  ],
  construcao: [
    ["building_material", "Material de construção"],
    ["architectural_project", "Projeto"],
    ["construction_service", "Serviço de construção"],
    ["prefabricated", "Sistema pré-fabricado"],
    ["equipment_rental", "Locação de equipamentos"]
  ],
  moda: [
    ["apparel", "Vestuário"],
    ["footwear", "Calçados"],
    ["accessory", "Acessórios"],
    ["jewelry", "Joias e semijoias"],
    ["collection", "Coleção ou kit"]
  ],
  investimentos: [
    ["real_estate_asset", "Ativo imobiliário"],
    ["fixed_income", "Renda fixa"],
    ["investment_fund", "Fundo de investimento"],
    ["equity", "Participação societária"],
    ["agribusiness_asset", "Ativo do agronegócio"],
    ["business_opportunity", "Oportunidade empresarial"]
  ],
  outros: [["other", "Outro produto ou serviço"]]
};

const STORAGE_TYPES = {
  imoveis: "real_estate",
  veiculos: "vehicle",
  perfumaria: "beauty",
  "energia-solar": "solar",
  agronegocio: "service",
  turismo: "tourism",
  seguros: "insurance",
  consorcios: "consortium",
  saude: "service",
  educacao: "education",
  tecnologia: "service",
  construcao: "service",
  moda: "retail",
  investimentos: "service",
  outros: "other"
};

export const PRODUCT_SEGMENTS = COMMERCIAL_SEGMENTS.map(segment => ({
  code: segment.catalogCode,
  connectorCode: segment.code,
  storageType: STORAGE_TYPES[segment.code] || "other",
  label: segment.label,
  description: segment.description,
  icon: segment.icon,
  types: PRODUCT_TYPES[segment.code] || PRODUCT_TYPES.outros
}));

export const DEVELOPMENT_TYPES = {
  real_estate: [
    ["planned_neighborhood", "Bairro planejado"],
    ["gated_community", "Condomínio fechado"],
    ["subdivision", "Loteamento aberto"],
    ["vertical_development", "Empreendimento vertical"],
    ["commercial_center", "Centro comercial"],
    ["mixed_use", "Uso misto"],
    ["rural_development", "Empreendimento rural"]
  ],
  vehicles: [["dealership", "Concessionária ou revenda"], ["marketplace", "Marketplace"], ["fleet", "Frota ou locadora"]],
  beauty: [["brand", "Marca"], ["store", "Loja"], ["distributor", "Distribuidor"]],
  solar: [["integrator", "Integradora"], ["energy_company", "Empresa de energia"]],
  agribusiness: [["agrocenter", "Agrocenter"], ["supplier", "Fornecedor"], ["cooperative", "Cooperativa"]],
  tourism: [["travel_company", "Empresa de turismo"], ["hotel_group", "Grupo de hospedagem"]],
  insurance: [["insurance_company", "Seguradora ou corretora"]],
  consortium: [["consortium_company", "Administradora ou representante"]],
  health: [["health_company", "Clínica, hospital ou rede"]],
  education: [["education_company", "Instituição de ensino"]],
  technology: [["technology_company", "Empresa de tecnologia"]],
  construction: [["construction_company", "Construtora ou fornecedor"]],
  fashion: [["fashion_brand", "Marca ou loja"]],
  investments: [["investment_company", "Gestora ou empresa de investimentos"]],
  other: [["business_unit", "Unidade de negócio"]]
};

export function segmentByCode(code) {
  const canonical = commercialSegmentByCode(code);
  return PRODUCT_SEGMENTS.find(segment =>
    segment.code === code ||
    segment.connectorCode === code ||
    segment.connectorCode === canonical.code
  ) || PRODUCT_SEGMENTS[0];
}

export function typeLabel(segmentCode, typeCode) {
  return segmentByCode(segmentCode).types.find(([code]) => code === typeCode)?.[1] || typeCode || "";
}
