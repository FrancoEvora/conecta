import Link from "next/link";
import { rpc } from "@/lib/supabase";
import { getServerUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }) {
  let canManageNotifications = false;
  try {
    const session = await getServerUser();
    if (session.user) {
      const context = await rpc("get_my_app_context", {}, { accessToken: session.accessToken });
      const permissions = context.permissions || [];
      canManageNotifications = context.portal_kind === "staff" && (permissions.includes("platform.all") || permissions.includes("notifications.manage"));
    }
  } catch {}
  return <>{canManageNotifications && <Link href="/painel/comunicacoes" style={{ position:"fixed", zIndex:79, right:18, bottom:68, display:"inline-flex", alignItems:"center", padding:"10px 13px", borderRadius:11, background:"#071c3a", color:"#fff", fontSize:"12px", fontWeight:850, boxShadow:"0 14px 34px rgba(7,28,58,.22)" }}>Comunicações</Link>}{children}</>;
}
