"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getAllProducts } from "@/lib/odoo/client";
import { getUserProducts } from "@/lib/firebase/firestore";
import { SkeletonList } from "@/components/ui/skeleton";
import { ThemeButton } from "@/components/ui/theme-button";
import { ProductCard } from "@/components/products/product-card";
import { formatExpiryDate, base64ToDataUrl, isOdooImageFalse } from "@/lib/utils";
import type { UserProduct, ProductCatalogItem } from "@/types";

export function ProductTab() {
  const user = useAuthStore((s) => s.user);
  const odooReady = useAuthStore((s) => s.odooReady);
  const router = useRouter();

  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!user || !odooReady) return;
    setLoading(true);
    try {
      const [catalog, saved] = await Promise.all([
        getAllProducts(),
        getUserProducts(user.uid),
      ]);

      const catalogMap = new Map<number, ProductCatalogItem>();
      catalog.forEach((p) => catalogMap.set(p.id, p));

      const joined = saved.map((p) => ({
        ...p,
        product: p.product_id
          ? catalogMap.get(Number(p.product_id))
          : undefined,
        display_name:
          p.display_name ??
          catalogMap.get(Number(p.product_id))?.display_name,
      }));

      setProducts(joined);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, [user, odooReady]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const goToScanner = () => router.push("/app/scan");

  if (loading) {
    return (
      <div className="p-4">
        <SkeletonList />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/empty-products.svg" alt="" className="mb-6 h-32 w-32 object-contain opacity-80" />
        <h2 className="mb-2 text-lg font-semibold">You don&apos;t have any Product</h2>
        <p className="mb-6 text-feed-body">Register your purchased product here!</p>
        <ThemeButton onClick={goToScanner} className="max-w-xs">
          + register your product
        </ThemeButton>
      </div>
    );
  }

  const countLabel =
    products.length <= 1
      ? `${products.length} Item Found`
      : `${products.length} Items Found`;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">{countLabel}</h2>
      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard
            key={product.serial}
            product={product}
            onViewDetails={() =>
              router.push(`/app/product?serial=${product.serial}`)
            }
          />
        ))}
      </div>
      <div className="mt-6">
        <ThemeButton onClick={goToScanner}>+ register another product</ThemeButton>
      </div>
    </div>
  );
}

export function getProductImage(product: UserProduct): string {
  const img = product.image_128 ?? product.product?.image_128;
  if (!img || isOdooImageFalse(img)) return "/icons/gloves-placeholder.svg";
  return base64ToDataUrl(img as string);
}

export { formatExpiryDate };
