export const COMMERCIAL_SEGMENTS = [
  {
    code: "imoveis",
    catalogCode: "real_estate",
    label: "Imóveis",
    description: "Lotes, casas, apartamentos e investimentos",
    icon: "building"
  },
  {
    code: "veiculos",
    catalogCode: "vehicles",
    label: "Veículos",
    description: "Carros, motos, máquinas e mobilidade",
    icon: "target"
  },
  {
    code: "perfumaria",
    catalogCode: "beauty",
    label: "Perfumaria e beleza",
    description: "Cosméticos, fragrâncias e bem-estar",
    icon: "check"
  },
  {
    code: "energia-solar",
    catalogCode: "solar",
    label: "Energia solar",
    description: "Soluções residenciais e empresariais",
    icon: "chart"
  },
  {
    code: "agronegocio",
    catalogCode: "agribusiness",
    label: "Agronegócio",
    description: "Terras, insumos, máquinas e serviços",
    icon: "target"
  },
  {
    code: "turismo",
    catalogCode: "tourism",
    label: "Turismo",
    description: "Viagens, hospedagem e experiências",
    icon: "link"
  },
  {
    code: "seguros",
    catalogCode: "insurance",
    label: "Seguros",
    description: "Proteção pessoal e patrimonial",
    icon: "shield"
  },
  {
    code: "consorcios",
    catalogCode: "consortium",
    label: "Consórcios",
    description: "Imóveis, veículos e serviços",
    icon: "money"
  },
  {
    code: "saude",
    catalogCode: "health",
    label: "Saúde",
    description: "Clínicas, serviços e soluções de saúde",
    icon: "shield"
  },
  {
    code: "educacao",
    catalogCode: "education",
    label: "Educação",
    description: "Cursos, escolas e capacitação",
    icon: "user"
  },
  {
    code: "tecnologia",
    catalogCode: "technology",
    label: "Tecnologia",
    description: "Software, equipamentos e serviços",
    icon: "chart"
  },
  {
    code: "construcao",
    catalogCode: "construction",
    label: "Construção",
    description: "Materiais, projetos e fornecedores",
    icon: "building"
  },
  {
    code: "moda",
    catalogCode: "fashion",
    label: "Moda",
    description: "Vestuário, acessórios e marcas",
    icon: "user"
  },
  {
    code: "investimentos",
    catalogCode: "investments",
    label: "Investimentos",
    description: "Oportunidades e ativos selecionados",
    icon: "money"
  },
  {
    code: "outros",
    catalogCode: "other",
    label: "Outros mercados",
    description: "Outras áreas da sua rede",
    icon: "menu"
  }
];

export const CONNECTOR_SEGMENT_OPTIONS = COMMERCIAL_SEGMENTS.map(segment => [
  segment.code,
  segment.label,
  segment.description
]);

export function commercialSegmentByCode(value) {
  return COMMERCIAL_SEGMENTS.find(segment =>
    segment.code === value || segment.catalogCode === value
  ) || COMMERCIAL_SEGMENTS[0];
}
