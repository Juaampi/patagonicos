import { cache } from 'react'
import type { Coupon } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCouponDiscountAmount, normalizeCouponCode } from '@/lib/coupons'

type CouponValidationInput = {
  code: string
  subtotal: number
  existingDiscountAmount?: number
}

export const getAdminCouponsSnapshot = cache(async function getAdminCouponsSnapshot() {
  const coupons = await prisma.coupon.findMany({
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
  })

  return coupons
})

function isCouponCurrentlyValid(coupon: Coupon, now: Date) {
  if (!coupon.active) {
    return 'Este cupón está desactivado.'
  }

  if (coupon.startsAt && coupon.startsAt > now) {
    return 'Este cupón todavía no empezó.'
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return 'Este cupón ya venció.'
  }

  return null
}

export async function validateCouponCode({
  code,
  subtotal,
  existingDiscountAmount = 0,
}: CouponValidationInput) {
  const normalizedCode = normalizeCouponCode(code)

  if (!normalizedCode) {
    return {
      ok: false as const,
      message: 'Ingresá un código de cupón.',
      coupon: null,
      discountAmount: 0,
    }
  }

  const coupon = await prisma.coupon.findUnique({
    where: {
      code: normalizedCode,
    },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  if (!coupon) {
    return {
      ok: false as const,
      message: 'No encontramos ese cupón.',
      coupon: null,
      discountAmount: 0,
    }
  }

  const now = new Date()
  const invalidReason = isCouponCurrentlyValid(coupon, now)

  if (invalidReason) {
    return {
      ok: false as const,
      message: invalidReason,
      coupon: null,
      discountAmount: 0,
    }
  }

  if (coupon.maxUses != null && coupon._count.orders >= coupon.maxUses) {
    return {
      ok: false as const,
      message: 'Este cupón alcanzó el máximo de usos.',
      coupon: null,
      discountAmount: 0,
    }
  }

  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false as const,
      message: `Este cupón aplica desde ${coupon.minSubtotal}.`,
      coupon: null,
      discountAmount: 0,
    }
  }

  const discountAmount = getCouponDiscountAmount(subtotal, existingDiscountAmount, {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minSubtotal: coupon.minSubtotal,
  })

  if (discountAmount <= 0) {
    return {
      ok: false as const,
      message: 'Este cupón no aplica sobre esta compra.',
      coupon: null,
      discountAmount: 0,
    }
  }

  return {
    ok: true as const,
    message: `Cupón ${coupon.code} aplicado.`,
    discountAmount,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minSubtotal: coupon.minSubtotal,
      maxUses: coupon.maxUses,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      active: coupon.active,
      uses: coupon._count.orders,
    },
  }
}
