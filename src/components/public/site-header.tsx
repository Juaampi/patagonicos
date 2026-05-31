import Link from "next/link";
import { navigation, siteConfig } from "@/lib/site";
import { Logo } from "@/components/shared/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm text-ivory/70 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-ivory">
              {item.label}
            </Link>
          ))}
        </nav>

        <a
          href={`https://wa.me/${siteConfig.phoneLink}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-full border border-rose-gold/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-champagne transition hover:border-champagne hover:bg-white/5"
        >
          WhatsApp
        </a>
      </div>
    </header>
  );
}
