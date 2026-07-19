export const APP_VERSION = "1.0.0";
export const APP_BUILD = "1";

export const SHOP_URL = "https://evehiclesafe.com/shop";
export const TERMS_URL = "https://evehiclesafe.com/terms-conditions";
export const CONTACT_EMAIL = "sales@evehiclesafe.com";
export const CONTACT_PHONE = "+61 407 551 601";
export const COMPANY_ADDRESS =
  "Unit 14, 140-148 Chesterville Road, Moorabbin, VIC, Australia";
export const COMPANY_NAME = "PJCC Electric Vehicle Pty Ltd";

export const ODOO_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const ODOO_REQUEST_TIMEOUT_MS = 5000;

export const PRIVACY_POLICY_TEXT =
  "The information you provide is voluntary however if you do not provide the requested information we may not be able to verify your details and properly attend to your enquiry. Your information will be used by PJCC ELECTRIC VEHICLE PTY LTD to process your request, be retained for reference for future enquiries and managed in accordance with our Privacy Policy. You may request access to your personal information by contacting us sales@evehiclesafe.com";

export type UserRole = "common" | "reseller" | "administrator";

export const USER_ROLES: UserRole[] = ["common", "reseller", "administrator"];

export type AppTab = "home" | "product" | "favorite" | "account";

export const APP_TABS: { id: AppTab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "product", label: "Product" },
  { id: "favorite", label: "Favorite" },
  { id: "account", label: "Account" },
];
