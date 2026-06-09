'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatPhoneForDisplay, normalizeWhatsAppPhone } from '@/lib/contact-utils'
import type { AdoptionPet } from '@/types/store'

function getAnimalTypeLabel(animalType: AdoptionPet['animalType']) {
  return animalType === 'CAT' ? 'Gato' : 'Perro'
}

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
    <article className="adoption-pet-card card-surface group overflow-hidden border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,244,239,0.92)_100%)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
      <div className={`adoption-pet-card__gallery grid gap-2 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),rgba(241,238,232,0.96))] p-3 ${compact ? 'grid-cols-3' : 'grid-cols-3'}`}>
        {images.map((image) => (
          <div
            key={image.id}
            className={`adoption-pet-card__image relative overflow-hidden rounded-[20px] bg-[#ebe9e3] ring-1 ring-black/5 ${compact ? 'aspect-[1/1.05]' : 'aspect-[1/1.2]'}`}
          >
            <Image src={image.url} alt={image.alt} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/12 via-black/0 to-transparent" />
          </div>
        ))}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="adoption-pet-card__badge rounded-full border border-black/8 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/58 shadow-[0_8px_18px_rgba(0,0,0,0.04)]">
            {pet.ageLabel}
          </span>
          <span className="adoption-pet-card__badge adoption-pet-card__badge--type rounded-full border border-emerald-900/10 bg-emerald-900/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-950/70">
            {getAnimalTypeLabel(pet.animalType)}
          </span>
          <span className="adoption-pet-card__badge rounded-full border border-black/8 bg-black/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/54">
            En adopción
          </span>
        </div>

        <div className="adoption-pet-card__header border-b border-black/8 pb-4">
          <p className="adoption-pet-card__location text-[11px] uppercase tracking-[0.18em] text-black/42">{pet.city}, {pet.province}</p>
          <h3 className="adoption-pet-card__title mt-2 font-display text-3xl tracking-[-0.05em] text-black/90">{pet.name}</h3>
          <p className="adoption-pet-card__subtitle mt-2 text-sm leading-6 text-black/50">Buscando una familia y un hogar definitivo.</p>
        </div>

        {pet.summary ? (
          <p className="adoption-pet-card__summary text-sm leading-7 text-black/62">{pet.summary}</p>
        ) : null}

        {displayPhone ? (
          <div className="adoption-pet-card__contact rounded-[20px] border border-black/8 bg-white/72 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
            <p className="adoption-pet-card__contact-label text-[10px] font-semibold uppercase tracking-[0.16em] text-black/46">Contacto</p>
            <p className="adoption-pet-card__contact-value mt-1 text-sm leading-6 text-black/74">{displayPhone}</p>
          </div>
        ) : null}

        {contactHref ? (
          <Link
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] !text-white shadow-[0_16px_34px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-black/86 hover:!text-white visited:!text-white"
          >
            {`Contactar por ${pet.name}`}
          </Link>
        ) : null}
      </div>
    </article>
  )
}
