import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/appointments",
  "/clock",
  "/schedule",
  "/payroll",
  "/performance",
  "/customers",
  "/pos",
  "/services",
  "/inventory",
  "/staff",
  "/notifications",
  "/reports",
];

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF 防護：變更狀態的 API 請求必須來自同源
  // （搭配 SameSite=Lax cookie 形成雙重防線）
  if (pathname.startsWith("/api/") && MUTATING.has(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !request.cookies.get("bs_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
