import { SITE_URL } from "@/lib/config";

export default function sitemap() {
  return [
    ["", "weekly", 1], ["/oportunidades", "weekly", .85], ["/cadastro", "monthly", .8], ["/entrar", "monthly", .5],
    ["/privacidade", "monthly", .5], ["/termos", "monthly", .5], ["/termos-conector", "monthly", .5],
    ["/termos-parceiros", "monthly", .5], ["/politica-recompensas", "monthly", .5]
  ].map(([path, changeFrequency, priority]) => ({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency, priority }));
}
