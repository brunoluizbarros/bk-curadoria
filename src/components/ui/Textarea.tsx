import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 4, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-widest text-ink-soft font-body">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(
          "w-full border border-ink/20 bg-cream-soft px-3 py-2 text-sm text-ink resize-y",
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

Textarea.displayName = "Textarea";
