import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isDev = process.env.NODE_ENV === "development";

export function middleware(_req: NextRequest) {
  // In sviluppo locale: nessun blocco o redirect auth a livello Edge.
  if (isDev) {
    return NextResponse.next();
  }

  // In produzione la protezione è nei layout server (getServerSession / requireUser).
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
