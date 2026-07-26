import { Footer, Header, ProductCard } from "@/components/UI";
import { fallbackProducts } from "@/lib/config";
import { rpc } from "@/lib/supabase";

export const metadata = { title: "Oportunidades" };

export default async function OpportunitiesPage() {
  let products = fallbackProducts;
  try { const data = await rpc("list_public_products"); if (Array.isArray(data) && data.length) products = data; } catch {}
  return <><Header/><main><section className="page-hero"><div className="container"><span className="eyebrow">Catálogo Rede Conecta</span><h1>Oportunidades específicas para <em>conectar e acompanhar.</em></h1><p>Cada link nasce vinculado a um produto, a uma campanha, à empresa responsável e às regras vigentes de recompensa.</p></div></section><section className="section"><div className="container product-grid product-grid--catalog">{products.map(product => <ProductCard key={product.product_slug} product={product}/>)}</div></section></main><Footer/></>;
}
