import { cn } from "@/lib/utils";

interface ThemeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function ThemeButton({
  className,
  children,
  loading,
  disabled,
  ...props
}: ThemeButtonProps) {
  return (
    <button
      className={cn(
        "w-full rounded-full bg-brand px-6 py-5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
