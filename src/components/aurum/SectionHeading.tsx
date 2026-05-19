import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        {eyebrow && (
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
            {eyebrow}
          </div>
        )}
        <h2 className="font-serif text-2xl sm:text-[28px] leading-tight text-foreground">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
