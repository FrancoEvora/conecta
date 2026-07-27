import { NextResponse } from "next/server";

export function middleware(request) {
  const access = request.cookies.get("rc_access_token")?.value;
  const refresh = request.cookies.get("rc_refresh_token")?.value;
  if (!access && !refresh) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/painel/:path*"] };
