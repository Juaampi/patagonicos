import Link from 'next/link'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { Logo } from '@/components/brand/logo'
import type { StoreSettingsSnapshot } from '@/lib/store-settings'

const instagramUrl = 'https://www.instagram.com/patagonicos.ok/'

function InstagramGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SiteFooter({ settings }: { settings: StoreSettingsSnapshot }) {
  return (
    <footer className="mt-24 border-t border-black/10 bg-white">
      <div className={`shell grid gap-10 py-14 ${settings.barilocheEnabled ? 'md:grid-cols-[1.4fr_1fr_1fr_1fr]' : 'md:grid-cols-[1.4fr_1fr_1fr]'}`}>
        <div>
          <Logo variant="footer" />
          <p className="mt-5 max-w-sm text-sm leading-7 text-black/62">
            Abrigo pensado para acompañar a perros y gatos en los días fríos, con comodidad, cuidado y protección real para cada paseo.
          </p>
          <Link
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fafaf8] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/76 transition hover:bg-black hover:text-white"
          >
            <InstagramGlyph className="h-4 w-4" />
            @patagonicos.ok
          </Link>
        </div>
        <div>
          <p className="eyebrow">Tienda</p>
          <div className="mt-4 space-y-3 text-sm text-black/68">
            <Link href="/productos" className="block hover:text-black">Productos</Link>
            <Link href="/adoptame" className="block hover:text-black">Mascotas en adopción</Link>
            <Link href="/carrito" className="block hover:text-black">Carrito</Link>
            <Link href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-black">
              <InstagramGlyph className="h-4 w-4" />
              Instagram
            </Link>
          </div>
        </div>
        <div>
          <p className="eyebrow">Operación</p>
          <div className="mt-4 space-y-3 text-sm text-black/68">
            <Link href="/envios" className="block hover:text-black">Envíos</Link>
            <Link href="/terminosycondiciones" className="block hover:text-black">Términos y condiciones</Link>
            <Link href="/politicasdeprivacidad" className="block hover:text-black">Políticas de privacidad</Link>
          </div>
        </div>
        {settings.barilocheEnabled ? (
          <div>
            <p className="eyebrow">Bariloche</p>
            <div className="mt-4 space-y-3 text-sm text-black/68">
              <div>
                <BarilocheDeliveryCountdown variant="block" />
              </div>
              <p>Envíos a todo el país.</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="border-t border-black/8">
        <div className="shell py-5 text-center text-[11px] uppercase tracking-[0.18em] text-black/46">
          Desarrollado por{' '}
          <Link
            href="https://andinaweb.com.ar"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-black/72 transition hover:text-black"
          >
            ANDINA WEB
          </Link>
        </div>
      </div>
    </footer>
  )
}
