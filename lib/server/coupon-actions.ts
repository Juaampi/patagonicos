'use server'

import { CouponType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { normalizeCouponCode } from '@/lib/coupons'
import { prisma } from '@/lib/prisma'

function readOptionalIntField(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? '').trim()

  if (!raw) {
    return null
  }

  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Valor inválido para ${key}.`)
  }

  return value
}

function readRequiredIntField(formData: FormData, key: string) {
  const value = readOptionalIntField(formData, key)

  if (value == null) {
    throw new Error(`Completá ${key}.`)
  }

  return value
}

function readOptionalDateField(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? '').trim()

  if (!raw) {
    return null
  }

  const value = new Date(raw)

  if (Number.isNaN(value.getTime())) {
    throw new Error(`Fecha inválida para ${key}.`)
  }

  return value
}

function revalidateCouponPaths() {
  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/cupones')
  revalidatePath('/carrito')
}

export async function saveCouponAction(formData: FormData) {
  try {
    const couponId = String(formData.get('couponId') ?? '').trim()
    const code = normalizeCouponCode(String(formData.get('code') ?? ''))
    const description = String(formData.get('description') ?? '').trim()
    const type = String(formData.get('type') ?? 'PERCENTAGE').trim() === 'FIXED' ? CouponType.FIXED : CouponType.PERCENTAGE
    const value = readRequiredIntField(formData, 'value')
    const minSubtotal = readOptionalIntField(formData, 'minSubtotal') ?? 0
    const maxUses = readOptionalIntField(formData, 'maxUses')
    const startsAt = readOptionalDateField(formData, 'startsAt')
    const expiresAt = readOptionalDateField(formData, 'expiresAt')
    const active = formData.get('active') === 'on'

    if (!code) {
      throw new Error('Completá el código del cupón.')
    }

    if (type === CouponType.PERCENTAGE && (value <= 0 || value > 100)) {
      throw new Error('El cupón porcentual debe estar entre 1 y 100.')
    }

    if (type === CouponType.FIXED && value <= 0) {
      throw new Error('El cupón fijo debe ser mayor a 0.')
    }

    if (startsAt && expiresAt && startsAt > expiresAt) {
      throw new Error('La fecha de inicio no puede ser posterior al vencimiento.')
    }

    await prisma.coupon.upsert({
      where: {
        id: couponId || '__new_coupon__',
      },
      update: {
        code,
        description: description || null,
        type,
        value,
        minSubtotal,
        maxUses,
        startsAt,
        expiresAt,
        active,
      },
      create: {
        code,
        description: description || null,
        type,
        value,
        minSubtotal,
        maxUses,
        startsAt,
        expiresAt,
        active,
      },
    })

    revalidateCouponPaths()
    redirect('/admin/cupones?saved=1')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No pudimos guardar el cupón.'
    redirect(`/admin/cupones?error=${encodeURIComponent(message)}`)
  }
}
