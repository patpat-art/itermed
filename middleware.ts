// Middleware disabilitato: la sessione in Edge non legge correttamente i cookie su Vercel.
// La protezione è gestita nei layout (dashboard, admin) con getServerSession.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
