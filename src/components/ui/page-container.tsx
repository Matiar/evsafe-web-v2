"use client";

import { LoaderView } from "@/components/ui/loader-view";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  busy?: boolean;
}

export function PageContainer({ children, className, busy }: PageContainerProps) {
  return (
    <div className={cn("relative px-4 pt-2.5", className)}>
      {children}
      {busy && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40">
          <LoaderView />
        </div>
      )}
    </div>
  );
}
