import type { UserRole } from "@/lib/constants";

export type { UserRole };

export interface FirestoreUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  phoneNumber?: string | null;
  photoURL?: string | null;
  role?: UserRole;
  disabled?: boolean;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData?: Array<{
    providerId: string;
    displayName?: string | null;
    photoURL?: string | null;
    uid?: string;
  }>;
}

export interface UserProduct {
  serial: string;
  product_id?: number | string;
  batch_number?: string;
  manufacturing_month?: string;
  year?: string;
  expired_date?: string | null;
  display_name?: string;
  image_128?: string;
  success?: boolean | number | string;
  message?: string;
  error?: string;
  product?: ProductCatalogItem;
}

export interface ProductCatalogItem {
  id: number;
  name?: string;
  display_name?: string;
  create_date?: string;
  create_uid?: [number, string];
  default_code?: string;
  categ_id?: [number, string];
  product_variant_id?: number | false;
  image_128?: string | false;
}

export interface SocialPost {
  id: number | string;
  author_name?: string;
  create_date?: string;
  message?: string;
  display_message?: string;
  image_urls?: string[];
  image?: string;
  youtube_video_id?: string | null;
  is_portrait?: boolean;
  logo?: string;
  display_name?: string;
  favourite?: boolean;
  like?: number;
  has_like?: boolean;
  post_link?: string;
  link_url?: string;
  stream_post_image_urls?: string;
}

export interface PostLikes {
  likes: string[];
}

export interface OdooConfig {
  baseUrl: string;
  db: string;
  user_id: string;
  id: number;
  password: string;
}

export interface ValidatedProduct extends UserProduct {
  serial: string;
}

export type AuthMode = "signin" | "signup" | "reset";

export interface ToastMessage {
  id: string;
  type: "success" | "warn" | "error" | "neutral";
  title: string;
  content: string;
  autoDismiss?: boolean;
  duration?: number;
}
