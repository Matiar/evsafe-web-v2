export function avoidFalse(value: unknown): string {
  if (value === false || value === "false" || value === "null" || value == null || value === "") {
    return "--";
  }
  return String(value);
}

export function falseToNull<T>(value: T | "false" | "null" | false): T | null {
  if (value === false || value === "false" || value === "null" || value == null) {
    return null;
  }
  return value as T;
}

export function humanizeFirebaseError(code: string): string {
  return code
    .replace(/^auth\//, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function filterError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("network") ||
    lower.includes("socket") ||
    lower.includes("failed to fetch") ||
    lower.includes("internet")
  ) {
    return "Failed to connect to internet, please try again";
  }
  return message;
}

export function extractYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/
  );
  return match?.[1] ?? null;
}

export function formatExpiryDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Invalid Product";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Product";
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Invalid Product";
  }
}

export function truncateSerial(serial: string, max = 15): string {
  const trimmed = serial.trim();
  if (trimmed.length >= max) {
    return `${trimmed.slice(0, max)}...`;
  }
  return trimmed;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function base64ToDataUrl(base64: string, mime = "image/png"): string {
  if (base64.startsWith("data:")) return base64;
  return `data:${mime};base64,${base64}`;
}

export function isOdooImageFalse(value: unknown): boolean {
  return value === false || value === "false" || value === "null" || !value;
}
