import { cn } from "@/lib/utils";

/** Standard page gutter + max width used by every inner route. */
export function PageContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12", className)}
      {...props}
    />
  );
}