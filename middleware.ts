import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Proteggi dashboard e admin solo se non autenticato
  if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
    const secret =
      process.env.NEXTAUTH_SECRET ||
      process.env.AUTH_SECRET ||
      "itermed-dev-secret-set-NEXTAUTH_SECRET-for-production";

    const token = await getToken({ req, secret });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
