"use client";

import Image from "next/image";
import { formatExpiryDate, getProductImage } from "@/components/tabs/product-tab";
import type { UserProduct } from "@/types";

interface ProductCardProps {
  product: UserProduct;
  onViewDetails: () => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-white p-4">
      <Image
        src={getProductImage(product)}
        alt={product.display_name ?? "Product"}
        width={80}
        height={80}
        className="h-20 w-20 shrink-0 rounded-lg bg-background object-cover"
        unoptimized
      />
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="font-medium text-text">
            {product.display_name ?? "Ev vehicle gloves"}
          </p>
          <p className="text-sm">
            Serial Number :{" "}
            <span className="text-serial-red">{product.serial}</span>
          </p>
          <p className="text-sm">
            Expire In :{" "}
            <span>{formatExpiryDate(product.expired_date)}</span>
          </p>
        </div>
        <button
          onClick={onViewDetails}
          className="mt-2 self-start rounded-full border border-brand px-4 py-1.5 text-sm font-medium text-brand"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
