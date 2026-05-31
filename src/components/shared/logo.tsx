import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  compact?: boolean;
};

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-4", className)}>
      <span className="relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-[linear-gradient(135deg,#f5e5d4_0%,#cba46a_38%,#8d6546_100%)] shadow-[0_20px_40px_rgba(62,37,22,0.22)]">
        <svg viewBox="0 0 80 80" className="h-11 w-11" aria-hidden="true">
          <path d="M20 18h10v35h18v9H20V18Z" fill="#5D4028" />
          <path
            d="M54 57c-4.4 3.8-10.1 5.7-17 5.7-7.3 0-13-2.1-17.2-6.1 0 0 5.8-2.8 12.1-2.8 3.4 0 6.8.8 10 2.3V34.3c0-8 5.3-12.8 14.4-12.8 6.3 0 11.6 1.8 15.7 5.3l-4 7.4c-3.3-2.6-7.1-3.9-11.2-3.9-3.4 0-5.6 1.4-5.6 4.6V57Z"
            fill="#9A7250"
          />
        </svg>
      </span>

      {!compact && (
        <span className="flex flex-col">
          <span className="font-serif text-[1.15rem] uppercase tracking-[0.34em] text-champagne">
            Leonor Granados
          </span>
          <span className="text-xs uppercase tracking-[0.34em] text-rose-gold/80">
            Negocios Inmobiliarios
          </span>
        </span>
      )}
    </Link>
  );
}
