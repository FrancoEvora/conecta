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

export async function GET(request, { params }) {
  const { code } = await params;
  const invitation = await resolveInvitation(code);
  if (!invitation) return new Response("Convite não encontrado", { status: 404 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "story" ? "story" : "feed";
  const reference = /^RC-[A-Z0-9]{8}$/.test(url.searchParams.get("ref") || "")
    ? url.searchParams.get("ref")
    : "";
  const isStory = format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1350;

  const connector = invitation.connector_display_name || "Rede Conecta";
  const product = invitation.product_name || "Oportunidade selecionada";
  const category = invitation.product_category || "Oportunidade";
  const location = invitation.campaign_location || invitation.product_service_region || "Atendimento pela Rede Conecta";
  const image = invitation.product_metadata?.image || "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=88";
  const productFontSize = isStory
    ? product.length > 42 ? 72 : 90
    : product.length > 42 ? 61 : 76;

  return new ImageResponse(
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      position: "relative",
      overflow: "hidden",
      background: "#071c3a",
      fontFamily: "Arial, Helvetica, sans-serif"
    }}>
      <img src={image} alt="" width={width} height={height} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}/>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        background: isStory
          ? "linear-gradient(180deg,rgba(7,28,58,.16) 0%,rgba(7,28,58,.08) 35%,rgba(7,28,58,.96) 82%,#071c3a 100%)"
          : "linear-gradient(180deg,rgba(7,28,58,.10) 0%,rgba(7,28,58,.12) 42%,rgba(7,28,58,.96) 100%)"
      }}/>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: isStory ? "76px 62px 92px" : "58px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px 20px", borderRadius: "18px", background: "rgba(7,28,58,.84)", color: "white" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#ff6500", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "15px", height: "15px", borderRadius: "50%", background: "white", display: "flex" }}/>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <b style={{ fontSize: "26px" }}>REDE <span style={{ color: "#ff7420" }}>CONECTA</span></b>
              <span style={{ fontSize: "13px", opacity: .78 }}>Conectando Pessoas e Negócios</span>
            </div>
          </div>
          <div style={{ display: "flex", padding: "12px 18px", borderRadius: "999px", background: "#ff6500", color: "white", fontSize: "17px", fontWeight: 800 }}>{category}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", color: "white", maxWidth: "940px" }}>
          <div style={{ display: "flex", alignSelf: "flex-start", padding: "10px 15px", borderRadius: "999px", border: "1px solid rgba(255,255,255,.34)", background: "rgba(7,28,58,.48)", fontSize: "17px", fontWeight: 800, letterSpacing: "1px" }}>
            {isStory ? "STORY OFICIAL" : "PUBLICAÇÃO OFICIAL"}
          </div>
          <h1 style={{ margin: "23px 0 16px", fontSize: `${productFontSize}px`, lineHeight: 1.01, letterSpacing: "-2.8px" }}>{product}</h1>
          <div style={{ display: "flex", fontSize: isStory ? "27px" : "24px", color: "rgba(255,255,255,.84)" }}>{location}</div>
          <div style={{ width: "132px", height: "8px", margin: "28px 0", borderRadius: "99px", background: "#ff6500", display: "flex" }}/>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: isStory ? "25px" : "22px" }}>
              <span style={{ color: "#ff8a3d", fontWeight: 900 }}>{connector}</span>
              <span>recomenda esta oportunidade.</span>
            </div>
            <div style={{ display: "flex", fontSize: isStory ? "22px" : "19px", color: "rgba(255,255,255,.78)" }}>Envie uma mensagem para conhecer os detalhes.</div>
            {reference && <div style={{ display: "flex", alignSelf: "flex-start", marginTop: "4px", padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,.13)", color: "rgba(255,255,255,.76)", fontSize: "15px", letterSpacing: "1px" }}>Referência {reference}</div>}
          </div>
        </div>
      </div>
    </div>,
    {
      width,
      height,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `inline; filename="rede-conecta-${format}-${String(code).toLowerCase()}.png"`
      }
    }
  );
}
