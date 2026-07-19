import { ODOO_CACHE_TTL_MS } from "@/lib/constants";
import { extractYoutubeVideoId, falseToNull } from "@/lib/utils";
import type { ProductCatalogItem, SocialPost, UserProduct } from "@/types";

const CACHE_PREFIX = "evsafe_odoo_";

function getCacheKey(model: string): string {
  return `${CACHE_PREFIX}${model}`;
}

function getCacheTimeKey(model: string): string {
  return `${CACHE_PREFIX}${model}_time`;
}

function readCache<T>(model: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getCacheKey(model));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCache<T>(model: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getCacheKey(model), JSON.stringify(data));
    localStorage.setItem(getCacheTimeKey(model), String(Date.now()));
  } catch {
    // storage full or unavailable
  }
}

function isCacheFresh(model: string): boolean {
  if (typeof window === "undefined") return false;
  const ts = localStorage.getItem(getCacheTimeKey(model));
  if (!ts) return false;
  return Date.now() - Number(ts) < ODOO_CACHE_TTL_MS;
}

async function odooProxy<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/odoo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { result?: T; error?: string; ok?: boolean };

  if (!res.ok) {
    throw new Error(json.error ?? `Odoo proxy error (${res.status})`);
  }

  if (json.error) {
    throw new Error(json.error);
  }

  return json.result as T;
}

export async function authenticateOdoo(): Promise<void> {
  await fetch("/api/odoo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "authenticate" }),
  });
}

async function executeKw<T>(
  model: string,
  method: string,
  input: unknown,
  fields: unknown = []
): Promise<T> {
  return odooProxy<T>({
    action: "execute_kw",
    model,
    method,
    input,
    fields,
  });
}

function processStreamPost(post: Record<string, unknown>): SocialPost {
  const processed = { ...post } as unknown as SocialPost;

  const imageUrlsRaw = post.stream_post_image_urls;
  if (typeof imageUrlsRaw === "string" && imageUrlsRaw) {
    try {
      const urls = JSON.parse(imageUrlsRaw) as string[];
      processed.image_urls = urls;
      processed.image = urls[0];
    } catch {
      processed.image_urls = [];
    }
  }

  const link = (post.post_link ?? post.link_url) as string | undefined;
  processed.youtube_video_id = extractYoutubeVideoId(link);

  processed.message = (post.message ?? post.display_message) as string | undefined;
  processed.display_name = (post.display_name ?? post.author_name) as string | undefined;

  return processed;
}

export async function getSocialStreamPosts(
  forceRefresh = false
): Promise<SocialPost[]> {
  const model = "social.stream.post";

  if (!forceRefresh && isCacheFresh(model)) {
    const cached = readCache<SocialPost[]>(model);
    if (cached) return cached;
  }

  try {
    const result = await executeKw<Record<string, unknown>[]>(
      model,
      "search_read",
      [[["published_on_app", "=", true]]],
      { fields: [] }
    );

    const posts = (result ?? []).map(processStreamPost);
    writeCache(model, posts);
    return posts;
  } catch (err) {
    const cached = readCache<SocialPost[]>(model);
    if (cached) return cached;
    throw err;
  }
}

export async function getAllProducts(forceRefresh = false): Promise<ProductCatalogItem[]> {
  const model = "product.product";

  if (!forceRefresh && isCacheFresh(model)) {
    const cached = readCache<ProductCatalogItem[]>(model);
    if (cached) return cached;
  }

  try {
    const result = await executeKw<ProductCatalogItem[]>(
      model,
      "search_read",
      [],
      {
        fields: [
          "id",
          "name",
          "display_name",
          "create_date",
          "create_uid",
          "default_code",
          "categ_id",
          "product_variant_id",
          "image_128",
        ],
      }
    );
    writeCache(model, result ?? []);
    return result ?? [];
  } catch (err) {
    const cached = readCache<ProductCatalogItem[]>(model);
    if (cached) return cached;
    throw err;
  }
}

export async function getProductDetails(serial: string): Promise<UserProduct> {
  const result = await executeKw<Record<string, unknown>>(
    "stock.lot",
    "get_product_expiry_info",
    [[serial]]
  );
  return result as unknown as UserProduct;
}

export async function validateProductManual(
  serial: string,
  buildDate: string,
  batch: string
): Promise<UserProduct> {
  const result = await executeKw<Record<string, unknown>>(
    "stock.lot",
    "get_product_expiry_info_v2",
    [[serial, batch, buildDate]]
  );
  return result as unknown as UserProduct;
}

/** Kept for API compatibility — credentials now live server-side. */
export function initOdooFromRemoteConfig(_values: {
  baseUrl: string;
  db: string;
  user_id: string;
  id: string;
  password: string;
}): void {
  // No-op: client no longer holds Odoo credentials (CORS / security).
}

export function isProductValid(product: UserProduct): boolean {
  const expiredDate = falseToNull(product.expired_date);
  return expiredDate != null;
}

export function isOdooClientReady(): boolean {
  return typeof window !== "undefined";
}
