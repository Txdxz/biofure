import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("biofure_session");
  const { pathname } = request.nextUrl;

  // Allow login page and API routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/login") || pathname.startsWith("/api/logout")) {
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Allow static assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if session is expired
  try {
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (data.expires < Date.now()) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("biofure_session");
      return response;
    }
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("biofure_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
