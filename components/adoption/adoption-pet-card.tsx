'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatPhoneForDisplay, normalizeWhatsAppPhone } from '@/lib/contact-utils'
import type { AdoptionPet } from '@/types/store'

export function AdoptionPetCard({
  pet,
  compact = false,
}: {
  pet: AdoptionPet
  compact?: boolean
}) {
  const images = pet.images.slice(0, 3)
  const whatsappPhone = pet.contactPhone ? normalizeWhatsAppPhone(pet.contactPhone) : ''
  const contactHref = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hola, quiero consultar por ${pet.name}.`)}` 
    : undefined
  const displayPhone = pet.contactPhone ? formatPhoneForDisplay(pet.contactPhone) : ''

  return (
    <article className="card-surface overflow-hidden">
      <div className={`grid gap-2 bg-[#f3f3ef] p-3 ${compact ? 'grid-cols-3' : 'grid-cols-3'}`}>
        {images.map((image) => (
          <div key={image.id} className={`relative overflow-hidden rounded-[20px] bg-[#ebe9e3] ${compact ? 'aspect-[1/1.05]' : 'aspect-[1/1.2]'}`}>
            <Image src={image.url} alt={image.alt} fill className="object-cover" />
          </div>
        ))}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-black/44">{pet.city}, {pet.province}</p>
            <h3 className="mt-2 font-display text-3xl tracking-[-0.05em]">{pet.name}</h3>
          </div>
          <span className="rounded-full border border-black/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/64">
            {pet.ageLabel}
          </span>
        </div>

        {pet.summary ? (
          <p className="text-sm leading-7 text-black/62">{pet.summary}</p>
        ) : null}

        {displayPhone ? (
          <p className="text-sm leading-6 text-black/66">
            <span className="font-semibold text-black/82">Comunicarse al:</span> {displayPhone}
          </p>
        ) : null}

        {contactHref ? (
          <Link
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] !text-white transition hover:bg-black/86 hover:!text-white visited:!text-white"
          >
            {`Contactar por ${pet.name}`}
          </Link>
        ) : null}
      </div>
    </article>
  )
}
