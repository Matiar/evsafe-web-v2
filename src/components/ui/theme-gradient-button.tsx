import { cn } from "@/lib/utils";

interface ThemeGradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function ThemeGradientButton({
  className,
  children,
  loading,
  disabled,
  ...props
}: ThemeGradientButtonProps) {
  return (
    <button
      className={cn(
        "flex h-14 w-full items-center justify-center rounded-full evs-gradient text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
