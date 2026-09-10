import * as React from "react";
import { cn } from "@/lib/utils";
import { extractIndonesianLocalPhone, formatToE164Indonesian } from "@/lib/utils";

export interface IndonesianPhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (fullPhone: string) => void;
  error?: boolean;
}

export const IndonesianPhoneInput = React.forwardRef<HTMLInputElement, IndonesianPhoneInputProps>(
  ({ className, value = "", onChange, error, placeholder = "812-3456-7890", disabled, ...props }, ref) => {
    const localNumber = extractIndonesianLocalPhone(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const cleaned = extractIndonesianLocalPhone(raw);
      const formatted = formatToE164Indonesian(cleaned);
      onChange?.(formatted);
    };

    return (
      <div className="relative flex w-full items-center">
        <span
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-l-md border border-r-0 bg-slate-50 px-3 text-sm font-semibold text-slate-700 select-none shrink-0 transition-colors shadow-2xs",
            error ? "border-destructive text-destructive bg-destructive/10" : "border-input text-slate-700"
          )}
        >
          +62
        </span>
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={localNumber}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error}
          className={cn(
            "h-10 w-full rounded-r-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            error && "border-destructive ring-destructive/20 focus-visible:border-destructive",
            disabled && "cursor-not-allowed opacity-50 bg-muted",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
IndonesianPhoneInput.displayName = "IndonesianPhoneInput";
