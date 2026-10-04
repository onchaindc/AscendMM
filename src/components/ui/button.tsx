import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent",
        secondary: "bg-surface-2 text-fg hover:bg-surface-3 border border-line",
        outline:
          "border border-line-strong bg-transparent text-fg hover:bg-surface-2 hover:border-accent/40",
        ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-fg",
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
