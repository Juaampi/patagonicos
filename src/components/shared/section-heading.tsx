import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("space-y-4", align === "center" && "mx-auto max-w-3xl text-center", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-gold">{eyebrow}</p>
      <h2 className="font-serif text-4xl leading-tight text-ivory md:text-5xl">{title}</h2>
      {description && <p className="max-w-2xl text-base leading-8 text-ivory/70">{description}</p>}
    </div>
  );
}
