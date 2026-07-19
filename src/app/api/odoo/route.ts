import { NextRequest, NextResponse } from "next/server";
import {
  buildExecuteKwPayload,
  getOdooSessionId,
  getServerOdooConfigOrNull,
  odooJsonRpc,
} from "@/lib/odoo/server";

type OdooProxyBody =
  | { action: "authenticate" }
  | {
      action: "execute_kw";
      model: string;
      method: string;
      input?: unknown;
      fields?: unknown;
    };

/** Same-origin Odoo proxy to avoid browser CORS. Credentials stay server-side. */
export async function POST(request: NextRequest) {
  if (!getServerOdooConfigOrNull()) {
    return NextResponse.json(
      { error: "Odoo is not configured. Set ODOO_* vars in .env.local." },
      { status: 503 }
    );
  }

  let body: OdooProxyBody;
  try {
    body = (await request.json()) as OdooProxyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action === "authenticate") {
    const sessionId = await getOdooSessionId(true);
    return NextResponse.json({
      ok: true,
      session: Boolean(sessionId),
    });
  }

  if (body.action === "execute_kw") {
    if (!body.model || !body.method) {
      return NextResponse.json(
        { error: "model and method are required" },
        { status: 400 }
      );
    }

    const payload = buildExecuteKwPayload(
      body.model,
      body.method,
      body.input ?? [],
      body.fields ?? []
    );

    const result = await odooJsonRpc(payload);
    const data = result.data as {
      error?: { data?: { code?: number; message?: string }; message?: string };
      result?: unknown;
    };

    if (data?.error?.data?.code === 100) {
      await getOdooSessionId(true);
      const retry = await odooJsonRpc(payload);
      const retryData = retry.data as typeof data;
      if (retryData?.error) {
        return NextResponse.json(
          {
            error:
              retryData.error.data?.message ??
              retryData.error.message ??
              "Odoo error",
          },
          { status: 502 }
        );
      }
      return NextResponse.json({ result: retryData.result });
    }

    if (data?.error) {
      return NextResponse.json(
        {
          error: data.error.data?.message ?? data.error.message ?? "Odoo error",
        },
        { status: 502 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: (data as { error?: string }).error ?? "Odoo request failed" },
        { status: result.status }
      );
    }

    return NextResponse.json({ result: data.result });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
