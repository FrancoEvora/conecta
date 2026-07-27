import { ImageResponse } from "next/og";
import { rpc } from "@/lib/supabase";

export const runtime = "edge";
export const alt = "Convite oficial da Rede Conecta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function resolveInvitation(code) {
  try {
    const data = await rpc("resolve_product_invitation", { p_invite_code: code });
    return Array.isArray(data) ? data[0] : null;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage({ params }) {
  const { code } = await params;
  const invitation = await resolveInvitation(code);
  const connector = invitation?.connector_display_name || "Rede Conecta";
  const product = invitation?.product_name || "Oportunidade selecionada";
  const location = invitation?.campaign_location || invitation?.product_service_region || "Mercado imobiliário";
  const category = invitation?.product_category || "Oportunidade imobiliária";
  const area = invitation?.product_metadata?.area_from || "Produto oficial";
  const payment = invitation?.product_metadata?.payment || "Condições sob consulta";

  return new ImageResponse(
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg,#06172f 0%,#0d315c 62%,#10294b 100%)",
      color: "white",
      fontFamily: "Arial, Helvetica, sans-serif"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        opacity: .14,
        backgroundImage: "radial-gradient(circle at 20px 20px,#ff7b25 0 3px,transparent 4px)",
        backgroundSize: "62px 62px"
      }}/>

      <div style={{
        width: "68%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "58px 48px 48px 64px",
        position: "relative"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{
            width: "68px",
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "22px",
            background: "linear-gradient(135deg,#ff8a35,#f24f00)",
            boxShadow: "0 14px 34px rgba(0,0,0,.25)"
          }}>
            <div style={{ width: "24px", height: "24px", display: "flex", borderRadius: "50%", background: "white" }}/>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "31px", fontWeight: 900, letterSpacing: "-1.4px" }}>
              REDE <span style={{ color: "#ff7420" }}>CONECTA</span>
            </div>
            <div style={{ fontSize: "16px", opacity: .76 }}>Conectando Pessoas e Negócios</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "17px", maxWidth: "720px" }}>
          <div style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "8px 14px",
            border: "1px solid rgba(255,255,255,.25)",
            borderRadius: "999px",
            background: "rgba(255,255,255,.08)",
            color: "#ff9a5c",
            fontSize: "17px",
            fontWeight: 800,
            letterSpacing: "1.3px",
            textTransform: "uppercase"
          }}>Convite oficial · origem identificada</div>
          <div style={{ fontSize: "31px", fontWeight: 700, color: "rgba(255,255,255,.78)" }}>
            {connector} conectou você a:
          </div>
          <div style={{ fontSize: product.length > 38 ? "55px" : "66px", lineHeight: 1.02, fontWeight: 950, letterSpacing: "-2.7px" }}>
            {product}
          </div>
          <div style={{ fontSize: "22px", color: "rgba(255,255,255,.72)" }}>{location}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "18px", color: "rgba(255,255,255,.82)" }}>
          <div style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#16865c", fontWeight: 900 }}>✓</div>
          Produto de origem preservado · contato somente após autorização
        </div>
      </div>

      <div style={{
        width: "32%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "18px",
        padding: "52px 48px 52px 22px",
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          width: "520px",
          height: "520px",
          right: "-210px",
          top: "55px",
          display: "flex",
          borderRadius: "50%",
          background: "radial-gradient(circle,#ff6a00 0%,#ff6a00 20%,rgba(255,106,0,.26) 21%,rgba(255,106,0,.08) 55%,transparent 56%)"
        }}/>
        {[category, area, payment].map((item, index) => <div key={item} style={{
          minHeight: "104px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "18px 20px",
          border: "1px solid rgba(255,255,255,.22)",
          borderRadius: "20px",
          background: "rgba(255,255,255,.11)",
          boxShadow: "0 18px 42px rgba(0,0,0,.17)",
          position: "relative"
        }}>
          <div style={{ color: "#ff9a5c", fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>
            {index === 0 ? "Produto" : index === 1 ? "Destaque" : "Condição"}
          </div>
          <div style={{ marginTop: "5px", fontSize: item.length > 28 ? "21px" : "25px", fontWeight: 800, lineHeight: 1.18 }}>{item}</div>
        </div>)}
        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "9px", fontSize: "15px", color: "rgba(255,255,255,.78)", position: "relative" }}>
          <div style={{ width: "10px", height: "10px", display: "flex", borderRadius: "50%", background: "#54d397" }}/>
          conecta-pearl.vercel.app
        </div>
      </div>
    </div>,
    size
  );
}
