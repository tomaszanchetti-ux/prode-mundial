import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "app.prodemundial.org";
const LEGACY_HOST_SUFFIX = ".hosted.app";

export function middleware(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  if (host.endsWith(LEGACY_HOST_SUFFIX) && host !== CANONICAL_HOST) {
    const url = new URL(request.url);
    url.hostname = CANONICAL_HOST;
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|firebase-messaging-sw.js|icon-|apple-|og-).*)",
  ],
};
