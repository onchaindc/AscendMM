import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        outline: "border-line-strong text-muted",
        muted: "border-transparent bg-surface-2 text-muted",
        accent: "border-accent/30 bg-accent-muted text-accent",
        positive: "border-positive/25 bg-positive/10 text-positive",
        negative: "border-negative/25 bg-negative/10 text-negative",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
