import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "app.prodemundial.org";
const LEGACY_HOST_SUFFIX = ".hosted.app";

export function middleware(request: NextRequest) {
  const rawHost = request.headers.get("host") ?? "";
  const forwardedHost = request.headers.get("x-forwarded-host") ?? "";
  const host = forwardedHost || rawHost;

  if (host.endsWith(LEGACY_HOST_SUFFIX) && host !== CANONICAL_HOST) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    const response = NextResponse.redirect(url, 301);
    response.headers.set("x-debug-host", rawHost);
    response.headers.set("x-debug-fwd-host", forwardedHost);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-debug-host", rawHost);
  response.headers.set("x-debug-fwd-host", forwardedHost);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|firebase-messaging-sw.js|icon-|apple-|og-).*)",
  ],
};
