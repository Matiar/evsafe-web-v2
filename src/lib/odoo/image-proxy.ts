export function proxyOdooImageUrl(url: string): string {
  return `/api/odoo-image?url=${encodeURIComponent(url)}`;
}
