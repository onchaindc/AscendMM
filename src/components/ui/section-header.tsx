import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Consistent page-header block: eyebrow, title, subtitle, optional actions. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
