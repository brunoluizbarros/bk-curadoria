import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-widest text-ink-soft font-body">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full border border-ink/20 bg-cream-soft px-3 py-2 text-sm text-ink",
          "focus:outline-none focus:border-ink focus-visible:ring-2 focus-visible:ring-terracotta/40 placeholder:text-ink-soft/50",
          "transition-colors rounded-btn",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
);

Input.displayName = "Input";
