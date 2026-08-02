import { ImageResponse } from "next/og";
import { rpc } from "@/lib/supabase";

export const runtime = "edge";

async function resolveInvitation(code) {
  try {
    const data = await rpc("resolve_product_invitation", { p_invite_code: code });
    return Array.isArray(data) ? data[0] : null;
  } catch {
    return null;
  }
}

export async function GET(_request, { params }) {
  const { code } = await params;
  const invitation = await resolveInvitation(code);
  if (!invitation) return new Response("Convite não encontrado", { status: 404 });

  const connector = invitation.connector_display_name || "Rede Conecta";
  const product = invitation.product_name || "Oportunidade selecionada";
  const category = invitation.product_category || "Oportunidade";
  const location = invitation.campaign_location || invitation.product_service_region || "Atendimento pela Rede Conecta";
  const image = invitation.product_metadata?.image || "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=88";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#071c3a", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <img src={image} alt="" width="1080" height="1080" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}/>
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg,rgba(7,28,58,.08) 0%,rgba(7,28,58,.18) 38%,rgba(7,28,58,.94) 100%)" }}/>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 22px", borderRadius: "18px", background: "rgba(7,28,58,.82)", color: "white" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#ff6500", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "white", display: "flex" }}/></div>
            <div style={{ display: "flex", flexDirection: "column" }}><b style={{ fontSize: "27px" }}>REDE <span style={{ color: "#ff7420" }}>CONECTA</span></b><span style={{ fontSize: "13px", opacity: .78 }}>Conectando Pessoas e Negócios</span></div>
          </div>
          <div style={{ display: "flex", padding: "12px 18px", borderRadius: "999px", background: "#ff6500", color: "white", fontSize: "17px", fontWeight: 800 }}>{category}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", color: "white", maxWidth: "910px" }}>
          <div style={{ display: "flex", alignSelf: "flex-start", padding: "9px 14px", borderRadius: "999px", border: "1px solid rgba(255,255,255,.35)", background: "rgba(7,28,58,.48)", fontSize: "17px", fontWeight: 800, letterSpacing: "1px" }}>OPORTUNIDADE OFICIAL</div>
          <h1 style={{ margin: "22px 0 16px", fontSize: product.length > 38 ? "64px" : "76px", lineHeight: 1.02, letterSpacing: "-2.8px" }}>{product}</h1>
          <div style={{ display: "flex", fontSize: "24px", color: "rgba(255,255,255,.82)" }}>{location}</div>
          <div style={{ width: "130px", height: "8px", margin: "26px 0", borderRadius: "99px", background: "#ff6500", display: "flex" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "22px" }}><span style={{ color: "#ff8a3d", fontWeight: 900 }}>{connector}</span><span>conectou você a esta oportunidade.</span></div>
          <div style={{ display: "flex", marginTop: "18px", fontSize: "17px", color: "rgba(255,255,255,.68)" }}>Link oficial, origem identificada e atendimento somente após autorização.</div>
        </div>
      </div>
    </div>,
    { width: 1080, height: 1080, headers: { "Cache-Control": "public, max-age=300, s-maxage=300", "Content-Disposition": `inline; filename="rede-conecta-${String(code).toLowerCase()}.png"` } }
  );
}
