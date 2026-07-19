"use client";

import Image from "next/image";

export function LoaderView({ className }: { className?: string }) {
  return (
    <div className={className ?? "relative h-[150px] w-[150px]"}>
      <div className="absolute inset-0 animate-pulse rounded-lg bg-[#5e8fcc]/30" />
      <Image
        src="/brand/logo-long.svg"
        alt="eVehicleSafe"
        width={150}
        height={32}
        className="relative z-10 h-full w-full object-contain"
        priority
      />
    </div>
  );
}
