import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Primary — soft champagne gold with a subtle glass shine and a
           warm glow on hover (light refraction, not a color swap). */
        default:
          "bg-accent text-accent-fg shadow-[inset_0_1px_0_0_oklch(1_0_0/0.35),0_6px_22px_-10px_oklch(0.85_0.08_88/0.55)] hover:brightness-[1.07] hover:shadow-[inset_0_1px_0_0_oklch(1_0_0/0.4),0_0_26px_-6px_oklch(0.85_0.08_88/0.6)] active:brightness-100",
        /* Secondary — dark glass with a thin gold border. */
        secondary:
          "border border-line-strong bg-surface-2 text-fg backdrop-blur-sm hover:border-accent/40 hover:bg-surface-3 hover:shadow-[0_0_22px_-10px_oklch(0.85_0.08_88/0.5)]",
        outline:
          "border border-line-strong bg-transparent text-fg hover:border-accent/40 hover:bg-surface-2/60 hover:shadow-[0_0_22px_-8px_oklch(0.85_0.08_88/0.4)]",
        ghost: "bg-transparent text-muted hover:bg-surface-2/70 hover:text-fg",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-11 px-6 text-[15px]",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
