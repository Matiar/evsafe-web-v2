"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AuthGuard } from "@/providers/auth-provider";
import { useAuthStore } from "@/stores/auth-store";
import { getProductDetails, isProductValid } from "@/lib/odoo/client";
import { getUserProducts, saveUserProduct, removeUserProduct } from "@/lib/firebase/firestore";
import { ThemeButton } from "@/components/ui/theme-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Snack } from "@/stores/toast-store";
import { avoidFalse, formatExpiryDate, truncateSerial } from "@/lib/utils";
import { getProductImage } from "@/components/tabs/product-tab";
import type { UserProduct } from "@/types";

function ProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serial = searchParams.get("serial") ?? "";
  const user = useAuthStore((s) => s.user);
  const odooReady = useAuthStore((s) => s.odooReady);

  const [product, setProduct] = useState<UserProduct | null>(null);
  const [loading, setLoading] = useState(!!serial);
  const [showRemove, setShowRemove] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!serial || !odooReady) return;

    async function load() {
      setLoading(true);
      try {
        const cached = sessionStorage.getItem(`validated_${serial}`);
        let data: UserProduct;
        if (cached) {
          data = JSON.parse(cached) as UserProduct;
        } else {
          data = await getProductDetails(serial);
        }
        setProduct({ ...data, serial });

        if (user) {
          const saved = await getUserProducts(user.uid);
          setIsSaved(saved.some((p) => p.serial === serial));
        }
      } catch (err) {
        console.error(err);
        setProduct({ serial, error: String(err) });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [serial, odooReady, user]);

  const handleSave = async () => {
    if (!user || !product) return;
    const existing = await getUserProducts(user.uid);
    if (existing.some((p) => p.serial === product.serial)) {
      Snack.error(`serial ${product.serial} already exists`);
      return;
    }
    await saveUserProduct(user.uid, product);
    Snack.ok("Product added successfully");
    router.push("/app?tab=product");
  };

  const handleRemove = async () => {
    if (!user || !product) return;
    await removeUserProduct(user.uid, product.serial);
    Snack.ok("Item Removed");
    router.push("/app?tab=product");
  };

  const title = serial ? "Product Details" : "Product Registration";
  const valid = product ? isProductValid(product) : false;

  if (!serial) {
    return (
      <div className="min-h-screen bg-background p-4">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-medium">{title}</h1>
          <Link href="/app?tab=product" className="text-brand">
            ?
          </Link>
        </header>

        <div className="space-y-4">
          <Link
            href="/app/scan"
            className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm"
          >
            <Image src="/icons/qr.svg" alt="" width={48} height={48} />
            <span className="font-medium">Scan product serial</span>
          </Link>
          <Link
            href="/app/validate"
            className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm"
          >
            <Image src="/icons/manual.svg" alt="" width={48} height={48} />
            <span className="font-medium">Manual Product Validation</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-medium">{title}</h1>
        <Link href="/app?tab=product" className="text-brand">
          ?
        </Link>
      </header>

      <p className="mb-4 text-sm">
        Scanned Product: <strong>{truncateSerial(serial)}</strong>
      </p>

      {loading && <p className="text-feed-muted">Loading...</p>}

      {product?.error && (
        <p className="text-serial-red">{product.error}</p>
      )}

      {product && !product.error && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {!valid ? (
            <p className="text-center text-serial-red">Not a Valid Serial Number</p>
          ) : (
            <>
              {isSaved && (
                <Image
                  src={getProductImage(product)}
                  alt=""
                  width={120}
                  height={120}
                  className="mx-auto mb-4 h-28 w-28 rounded-lg object-cover"
                  unoptimized
                />
              )}
              <p className="mb-4 text-center text-lg font-medium">
                {product.display_name ?? "-"}
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-feed-muted">Serial No</dt>
                  <dd>{product.serial}</dd>
                </div>
                {product.batch_number && (
                  <div className="flex justify-between">
                    <dt className="text-feed-muted">Batch No</dt>
                    <dd>{avoidFalse(product.batch_number)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-feed-muted">Manufacturing Date</dt>
                  <dd>
                    {avoidFalse(product.manufacturing_month)}/
                    {avoidFalse(product.year)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-feed-muted">Expiry Date</dt>
                  <dd>{formatExpiryDate(product.expired_date)}</dd>
                </div>
              </dl>

              {isSaved ? (
                <button
                  onClick={() => setShowRemove(true)}
                  className="mt-6 w-full text-center font-bold text-serial-red"
                >
                  Remove Item
                </button>
              ) : (
                <div className="mt-6 flex gap-3">
                  <ThemeButton onClick={handleSave}>Save Product</ThemeButton>
                  <button
                    onClick={() => router.back()}
                    className="flex-1 rounded-full border border-brand py-5 text-center font-semibold text-brand"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showRemove}
        title="Sure to remove"
        message={product?.display_name ?? product?.serial ?? ""}
        onConfirm={handleRemove}
        onCancel={() => setShowRemove(false)}
      />
    </div>
  );
}

export default function ProductPage() {
  return (
    <AuthGuard requireAuth>
      <Suspense fallback={null}>
        <ProductContent />
      </Suspense>
    </AuthGuard>
  );
}
