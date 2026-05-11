import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-terracotta text-cream hover:bg-terracotta-soft",
  secondary: "bg-ink text-cream hover:bg-ink-soft",
  ghost: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-cream",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-body tracking-widest uppercase transition-colors rounded-btn",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = "Button";
