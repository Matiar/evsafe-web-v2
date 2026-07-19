import { ODOO_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import type { OdooConfig } from "@/types";

let cachedSessionId: string | null = null;
let sessionExpiresAt = 0;

const SESSION_TTL_MS = 30 * 60 * 1000;

/** Resolve Odoo credentials from server env (supports ODOO_UID alias). */
export function getServerOdooConfig(): OdooConfig | null {
  const baseUrl = process.env.ODOO_BASE_URL ?? process.env.NEXT_PUBLIC_ODOO_BASE_URL;
  const db = process.env.ODOO_DB;
  const password = process.env.ODOO_PASSWORD;
  const idRaw = process.env.ODOO_ID ?? process.env.ODOO_UID;
  // Login for session auth — falls back to common Odoo admin login if unset
  const user_id =
    process.env.ODOO_USER_ID ?? process.env.ODOO_LOGIN ?? "admin";

  if (!baseUrl || !db || !idRaw || !password) {
    return null;
  }

  const id = parseInt(idRaw, 10);
  if (Number.isNaN(id)) return null;

  return {
    baseUrl: baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
    db,
    user_id,
    id,
    password,
  };
}

export function getServerOdooConfigOrNull(): OdooConfig | null {
  return getServerOdooConfig();
}

export async function getOdooSessionId(force = false): Promise<string | null> {
  if (!force && cachedSessionId && Date.now() < sessionExpiresAt) {
    return cachedSessionId;
  }

  const config = getServerOdooConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ODOO_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.baseUrl}web/session/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: config.db,
          login: config.user_id,
          password: config.password,
          context: {},
        },
      }),
      signal: controller.signal,
    });

    const setCookie = res.headers.get("set-cookie") ?? "";
    const match = setCookie.match(/session_id=([^;]+)/);
    if (match?.[1]) {
      cachedSessionId = match[1];
      sessionExpiresAt = Date.now() + SESSION_TTL_MS;
      return cachedSessionId;
    }

    // Clear stale cache on failed auth
    cachedSessionId = null;
    sessionExpiresAt = 0;
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function odooJsonRpc(body: unknown): Promise<{
  ok: boolean;
  status: number;
  data: unknown;
}> {
  const config = getServerOdooConfig();
  if (!config) {
    return { ok: false, status: 503, data: { error: "Odoo not configured on server" } };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ODOO_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.baseUrl}jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Odoo request failed";
    return { ok: false, status: 502, data: { error: message } };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildExecuteKwPayload(
  model: string,
  method: string,
  input: unknown,
  fields: unknown = []
): unknown {
  const config = getServerOdooConfig();
  if (!config) throw new Error("Odoo not configured");

  return {
    id: crypto.randomUUID(),
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute_kw",
      args: [
        config.db,
        config.id,
        config.password,
        model,
        method,
        input,
        fields,
      ],
    },
  };
}

export function isAllowedOdooImageUrl(url: string, config: OdooConfig | null): boolean {
  if (!config) return url.startsWith("https://") || url.startsWith("http://");
  try {
    const parsed = new URL(url);
    const base = new URL(config.baseUrl);
    return parsed.origin === base.origin;
  } catch {
    return false;
  }
}
