import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/api/auth");
  const isPublicApi = path.startsWith("/api/market") || path.startsWith("/api/macro");
  const isStatic = path.startsWith("/_next") || path === "/favicon.ico";

  if (isAuthRoute || isPublicApi || isStatic) return NextResponse.next();

  const session = request.cookies.get("pb_session")?.value;
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/api/:path*"],
};
