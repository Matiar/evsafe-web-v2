import { NextRequest, NextResponse } from "next/server";
import {
  getOdooSessionId,
  getServerOdooConfigOrNull,
  isAllowedOdooImageUrl,
} from "@/lib/odoo/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const config = getServerOdooConfigOrNull();
  if (!isAllowedOdooImageUrl(url, config)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const sessionId =
      (await getOdooSessionId()) ??
      request.cookies.get("odoo_session_id")?.value;

    const headers: Record<string, string> = {};
    if (sessionId) {
      headers.Cookie = `frontend_lang=en_AU; session_id=${sessionId}`;
    }

    const res = await fetch(url, { headers, next: { revalidate: 3600 } });

    if (!res.ok) {
      // Retry once with fresh session on auth failure
      if (res.status === 401 || res.status === 403) {
        const freshSession = await getOdooSessionId();
        if (freshSession) {
          const retry = await fetch(url, {
            headers: { Cookie: `frontend_lang=en_AU; session_id=${freshSession}` },
          });
          if (retry.ok) {
            const contentType = retry.headers.get("content-type") ?? "image/jpeg";
            const buffer = await retry.arrayBuffer();
            return new NextResponse(buffer, {
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
              },
            });
          }
        }
      }
      return NextResponse.json({ error: "Failed to fetch image" }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
