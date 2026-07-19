"use client";

import { cn } from "@/lib/utils";

interface ThemeTextFieldProps {
  label: string;
  hint?: string;
  prefixText?: string;
  errorText?: string;
  isRequired?: boolean;
  labelOnTop?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  maxLength?: number;
  className?: string;
}

export function ThemeTextField({
  label,
  hint,
  prefixText,
  errorText,
  isRequired,
  labelOnTop = true,
  type = "text",
  value,
  onChange,
  readOnly,
  maxLength,
  className,
}: ThemeTextFieldProps) {
  const displayLabel = isRequired ? (
    <>
      {label} <span className="text-serial-red">*</span>
    </>
  ) : (
    label
  );

  return (
    <div className={cn("w-full", className)}>
      {labelOnTop && (
        <label className="mb-1 block text-xs text-brand">{displayLabel}</label>
      )}
      <div
        className={cn(
          "flex items-center rounded-[10px] border border-border bg-white px-3 py-3",
          errorText && "border-serial-red",
          readOnly && "bg-surface-alt"
        )}
      >
        {prefixText && (
          <span className="mr-1 shrink-0 text-sm text-brand">{prefixText}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint}
          readOnly={readOnly}
          maxLength={maxLength}
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-[#2d2d2d]"
        />
      </div>
      {errorText && (
        <p className="mt-1 text-xs text-serial-red">{errorText}</p>
      )}
    </div>
  );
}
