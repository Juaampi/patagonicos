import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { navigation, siteConfig } from "@/lib/site";
import { Logo } from "@/components/shared/logo";

export function SiteFooter() {
  return (
    <footer id="contacto" className="border-t border-white/10 bg-[#120c10]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_0.8fr] md:px-8">
        <div className="space-y-6">
          <Logo />
          <p className="max-w-xl text-base leading-8 text-ivory/70">
            Plataforma inmobiliaria orientada a una experiencia premium, con asesoramiento profesional,
            estrategia comercial y una mirada contemporánea del mercado.
          </p>
          <div className="grid gap-4 text-sm text-ivory/70">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-4 w-4 text-rose-gold" />
              <span>{siteConfig.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-rose-gold" />
              <span>{siteConfig.phoneDisplay}</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-rose-gold" />
              <span>{siteConfig.license}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">Navegación</h3>
            <ul className="mt-5 space-y-3 text-sm text-ivory/70">
              {navigation.map((item) => (
                <li key={item.href}>{item.label}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">Contacto directo</h3>
            <div className="mt-5 space-y-3 text-sm text-ivory/70">
              <p>{siteConfig.email}</p>
              <p>{siteConfig.socialHandle}</p>
              <p>Atención personalizada por WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
