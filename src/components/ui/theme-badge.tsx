import { cn } from "@/lib/utils";

export function ThemeBadge({
  count,
  className,
}: {
  count: string;
  className?: string;
}) {
  if (!count || count === "0") return null;

  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[14px] leading-none text-background",
        className
      )}
    >
      {count}
    </span>
  );
}
