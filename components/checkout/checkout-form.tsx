'use client'

import { ArrowRight, CheckCheck, Landmark, LoaderCircle, MapPin, Phone, Store, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { AddressPinPicker } from '@/components/checkout/address-pin-picker'
import { SearchableSelect } from '@/components/checkout/searchable-select'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { mapCartItemToAnalyticsItem, trackBeginCheckout } from '@/lib/client/analytics'
import { buildCartPricingSummary, getComboDiscountedPrice } from '@/lib/combo-pricing'
import {
  argentinaProvinces,
  getCanonicalProvince,
  getProvinceCitySuggestions,
  normalizeProvinceName,
} from '@/lib/argentina-data'
import {
  getCheckoutPreview,
  getCouponRestrictionReason,
  isBarilocheLocation,
  TRANSFER_DISCOUNT_PERCENT,
  type StoreSettingsSnapshot,
} from '@/lib/store-settings'
import { getCouponDiscountAmount } from '@/lib/coupons'
import type { CartItem, SalesChannel } from '@/types/store'
import { formatPrice } from '@/lib/utils'

type CheckoutFormProps = {
  items: CartItem[]
  settings: StoreSettingsSnapshot
  salesChannel?: SalesChannel
  clearItems?: () => void
}

type AddressSuggestion = {
  displayName: string
  line1: string
}

type GeoRefLocality = {
  nombre: string
}

type CheckoutPaymentMethod = 'ONLINE' | 'CASH_ON_DELIVERY' | 'TRANSFER'
type CheckoutDeliveryMode = 'HOME' | 'BRANCH'

type AppliedCoupon = {
  id: string
  code: string
  description?: string | null
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minSubtotal: number
}

type AndreaniBranchOption = {
  id: string
  label: string
  branchName: string
  addressLine: string
}

function addBusinessDays(baseDate: Date, days: number) {
  const nextDate = new Date(baseDate)
  let remainingDays = days

  while (remainingDays > 0) {
    nextDate.setDate(nextDate.getDate() + 1)
    const day = nextDate.getDay()
    if (day !== 0 && day !== 6) {
      remainingDays -= 1
    }
  }

  return nextDate
}

function formatDeliveryDate(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function MercadoPagoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#009ee3]/18 bg-[#ecf8ff] text-[#003b61] ${
        compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
      } font-semibold uppercase tracking-[0.12em]`}
    >
      <span
        className={`inline-flex items-center rounded-full bg-[#009ee3] ${compact ? 'px-2 py-0.5' : 'px-2.5 py-0.5'} text-white`}
      >
        MP
      </span>
      <span className="ml-2">Mercado Pago</span>
    </span>
  )
}

export function CheckoutForm({
  items,
  settings,
  salesChannel = 'RETAIL',
  clearItems,
}: CheckoutFormProps) {
  const router = useRouter()
  const { clearCart } = useCart()
  const fullNameRef = useRef<HTMLInputElement>(null)
  const lastNameRef = useRef<HTMLInputElement>(null)
  const dniRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const phoneAreaCodeRef = useRef<HTMLInputElement>(null)
  const phoneNumberRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLInputElement>(null)
  const streetNumberRef = useRef<HTMLInputElement>(null)
  const floorRef = useRef<HTMLInputElement>(null)
  const apartmentRef = useRef<HTMLInputElement>(null)
  const provinceRef = useRef<HTMLInputElement>(null)
  const cityRef = useRef<HTMLInputElement>(null)
  const postalCodeRef = useRef<HTMLInputElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const branchRef = useRef<HTMLDivElement>(null)
  const comboSummary = useMemo(() => buildCartPricingSummary(items), [items])
  const subtotal = comboSummary.payableSubtotal
  const twoForOneDiscountAmount = comboSummary.twoForOneDiscount
  const comboLinkDiscountAmount = comboSummary.comboLinkDiscount
  const [form, setForm] = useState({
    fullName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
    phoneAreaCode: '',
    phoneNumber: '',
    address: '',
    streetNumber: '',
    floor: '',
    apartment: '',
    city: settings.barilocheEnabled ? 'San Carlos de Bariloche' : '',
    province: settings.barilocheEnabled ? 'Río Negro' : '',
    postalCode: '',
    notes: '',
    whatsappOptIn: true,
    latitude: '',
    longitude: '',
    pinLabel: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('ONLINE')
  const [deliveryMode, setDeliveryMode] = useState<CheckoutDeliveryMode>('HOME')
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false)
  const [branchOptions, setBranchOptions] = useState<AndreaniBranchOption[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [branchFeedback, setBranchFeedback] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    message: string
  }>({
    status: 'idle',
    message: '',
  })
  const [state, setState] = useState<{
    status: 'idle' | 'saving' | 'success' | 'error'
    message: string
    orderNumber?: string
    shortCode?: string
    orderId?: string
    paymentUrl?: string
    paymentMethod?: CheckoutPaymentMethod
    paymentStatus?: string
  }>({
    status: 'idle',
    message: '',
  })
  const [submitProgress, setSubmitProgress] = useState(0)
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponFeedback, setCouponFeedback] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({
    status: 'idle',
    message: '',
  })
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const shippingPreview = useMemo(() => {
    return getCheckoutPreview(subtotal, form.city, form.province, settings, paymentMethod, appliedCoupon)
  }, [appliedCoupon, form.city, form.province, paymentMethod, settings, subtotal])
  const shouldRequirePin = shippingPreview.isBariloche && deliveryMode === 'HOME'
  const couponRestrictionReason = getCouponRestrictionReason(shippingPreview.qualifiesForFreeShipping, paymentMethod)
  const selectedProvince = getCanonicalProvince(form.province)
  const selectedCity = cityOptions.find((city) => normalizeProvinceName(city) === normalizeProvinceName(form.city))
  const hasValidProvince = Boolean(selectedProvince)
  const hasValidCity = Boolean(selectedCity)
  const shouldShowPinPicker =
    shouldRequirePin &&
    form.address.trim().length >= 4 &&
    hasValidCity &&
    hasValidProvince

  const citySuggestions = cityOptions
  const isTransferPayment = paymentMethod === 'TRANSFER'
  const successUsesTransfer = state.paymentMethod === 'TRANSFER'
  const successAccentClasses = {
    backdrop: 'bg-[linear-gradient(180deg,#16a34a_0%,#22c55e_48%,rgba(34,197,94,0.18)_100%)]',
    card: 'shadow-[0_40px_120px_rgba(4,120,87,0.35)]',
    hero: 'bg-[linear-gradient(135deg,#15803d_0%,#22c55e_55%,#86efac_100%)]',
    eyebrow: 'text-emerald-700',
    message: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    redirect: 'text-emerald-800',
  }
  const clearCheckoutItems = clearItems ?? clearCart
  const couponDiscountAmount = useMemo(() => {
    return getCouponDiscountAmount(subtotal, shippingPreview.discountAmount, appliedCoupon)
  }, [appliedCoupon, shippingPreview.discountAmount, subtotal])
  const isBranchPickup = deliveryMode === 'BRANCH' && !shippingPreview.isBariloche
  const selectedBranch = branchOptions.find((branch) => branch.id === selectedBranchId) ?? null
  const estimatedDeliveryWindow = useMemo(() => {
    const today = new Date()
    return {
      from: addBusinessDays(today, 5),
      to: addBusinessDays(today, 10),
    }
  }, [])
  const shouldShowShippingPrice = hasValidProvince && hasValidCity && form.postalCode.trim().length >= 3
  const shippingLabel = isBranchPickup ? 'Retiro en sucursal Andreani' : shippingPreview.isBariloche ? 'Envío a domicilio Bariloche' : 'Envío a domicilio'

  useEffect(() => {
    if (!appliedCoupon || !couponRestrictionReason) {
      return
    }

    const timeout = window.setTimeout(() => {
      setAppliedCoupon(null)
      setCouponFeedback({
        status: 'error',
        message: couponRestrictionReason,
      })
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [appliedCoupon, couponRestrictionReason])

  useEffect(() => {
    if (!selectedProvince) {
      return
    }

    const controller = new AbortController()
    const provinceName = selectedProvince

    async function loadCities() {
      try {
        const url = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(provinceName)}&campos=nombre&max=5000`
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('No pudimos cargar localidades.')
        }

        const data = (await response.json()) as { localidades?: GeoRefLocality[] }
        const nextCities = Array.from(new Set((data.localidades ?? []).map((item) => item.nombre))).sort((left, right) =>
          left.localeCompare(right, 'es'),
        )

        setCityOptions(nextCities)
      } catch {
        setCityOptions(getProvinceCitySuggestions(provinceName))
      }
    }

    void loadCities()

    return () => controller.abort()
  }, [selectedProvince])

  useEffect(() => {
    if (shippingPreview.isBariloche && deliveryMode !== 'HOME') {
      setDeliveryMode('HOME')
    }
  }, [deliveryMode, shippingPreview.isBariloche])

  useEffect(() => {
    if (!isBranchPickup || !hasValidCity || form.postalCode.trim().length < 3) {
      setBranchOptions([])
      setSelectedBranchId('')
      setBranchFeedback({
        status: 'idle',
        message: '',
      })
      return
    }

    setBranchFeedback({
      status: 'loading',
      message: 'Buscando sucursales Andreani cercanas a tu código postal…',
    })
    setBranchOptions([])
    setSelectedBranchId('')

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        const url = `/api/andreani-branches?city=${encodeURIComponent(selectedCity ?? '')}&province=${encodeURIComponent(
          selectedProvince ?? '',
        )}&postalCode=${encodeURIComponent(form.postalCode.trim())}`
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('No pudimos consultar sucursales en este momento.')
        }

        const data = (await response.json()) as {
          branches?: AndreaniBranchOption[]
          message?: string
        }
        const nextBranches = data.branches ?? []

        setBranchOptions(nextBranches)
        setSelectedBranchId((current) => (nextBranches.some((branch) => branch.id === current) ? current : nextBranches[0]?.id ?? ''))
        setBranchFeedback({
          status: nextBranches.length > 0 ? 'success' : 'error',
          message:
            nextBranches.length > 0
              ? data.message || 'Seleccioná una sucursal.'
              : data.message || 'No encontramos sucursales automáticas para ese código postal. Podés seguir con envío a domicilio.',
        })
      } catch {
        setBranchOptions([])
        setSelectedBranchId('')
        setBranchFeedback({
          status: 'error',
          message: 'No pudimos cargar sucursales Andreani ahora. Probá de nuevo en unos segundos.',
        })
      }
    }, 220)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [form.postalCode, hasValidCity, hasValidProvince, isBranchPickup, selectedCity, selectedProvince])

  useEffect(() => {
    if (state.status !== 'saving') {
      return
    }
    const interval = window.setInterval(() => {
      setSubmitProgress((current) => {
        if (current >= 88) return current
        return current + (current < 50 ? 12 : current < 75 ? 7 : 3)
      })
    }, 180)

    return () => window.clearInterval(interval)
  }, [state.status])

  useEffect(() => {
    if (state.status !== 'success' || !state.orderId || state.paymentUrl) {
      return
    }

    const interval = window.setInterval(() => {
      setRedirectCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval)
          return 0
        }

        return current - 1
      })
    }, 1000)

    const timeout = window.setTimeout(() => {
      router.push(`/perfil?email=${encodeURIComponent(form.email)}&saved=created&order=${encodeURIComponent(state.orderId ?? '')}`)
      window.setTimeout(() => {
        clearCheckoutItems()
      }, 150)
    }, 5000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [clearCheckoutItems, form.email, router, state.orderId, state.paymentUrl, state.status])

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function focusField(name: string) {
    const refMap: Record<string, HTMLElement | null> = {
      fullName: fullNameRef.current,
      lastName: lastNameRef.current,
      dni: dniRef.current,
      email: emailRef.current,
      phone: phoneRef.current,
      phoneAreaCode: phoneAreaCodeRef.current,
      phoneNumber: phoneNumberRef.current,
      address: addressRef.current,
      streetNumber: streetNumberRef.current,
      floor: floorRef.current,
      apartment: apartmentRef.current,
      province: provinceRef.current,
      city: cityRef.current,
      postalCode: postalCodeRef.current,
      pin: pinRef.current,
      branch: branchRef.current,
    }

    const element = refMap[name]
    if (!element) {
      return
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })

    if ('focus' in element && typeof element.focus === 'function') {
      window.setTimeout(() => element.focus(), 180)
    }
  }

  function applyAddressSuggestion(suggestion: AddressSuggestion) {
    setForm((current) => ({
      ...current,
      address: suggestion.line1,
      pinLabel: suggestion.displayName,
    }))
    setAddressSuggestionsOpen(false)
    window.setTimeout(() => {
      pinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }

  function validateBeforeSubmit() {
    const requiredChecks = [
      { key: 'fullName', valid: form.fullName.trim().length >= 2, message: 'Completá tu nombre para continuar.' },
      { key: 'lastName', valid: form.lastName.trim().length >= 2, message: 'Completá tu apellido para continuar.' },
      { key: 'dni', valid: form.dni.replace(/\D/g, '').length >= 7, message: 'Completá un DNI válido.' },
      { key: 'email', valid: /\S+@\S+\.\S+/.test(form.email.trim()), message: 'Completá un email válido.' },
      { key: 'phoneAreaCode', valid: form.phoneAreaCode.replace(/\D/g, '').length >= 2, message: 'Completá el código de celular.' },
      { key: 'phoneNumber', valid: form.phoneNumber.replace(/\D/g, '').length >= 6, message: 'Completá el número de celular.' },
      { key: 'province', valid: hasValidProvince, message: 'Elegí una provincia válida de la lista.' },
      { key: 'city', valid: hasValidCity, message: 'Elegí una ciudad válida de la lista.' },
      {
        key: 'address',
        valid: isBranchPickup || form.address.trim().length >= 4,
        message: 'Completá la dirección de entrega.',
      },
      {
        key: 'streetNumber',
        valid: isBranchPickup || form.streetNumber.trim().length >= 1,
        message: 'Completá la numeración de la dirección.',
      },
      { key: 'postalCode', valid: form.postalCode.trim().length >= 3, message: 'Completá el código postal.' },
      {
        key: 'pin',
        valid: !shouldRequirePin || Boolean(form.latitude && form.longitude),
        message: 'Verificá el pin en el mapa para confirmar la dirección exacta de entrega.',
      },
      {
        key: 'branch',
        valid: !isBranchPickup || Boolean(selectedBranch),
        message: 'Elegí la sucursal Andreani donde querés retirar tu pedido.',
      },
    ] as const

    const firstInvalid = requiredChecks.find((item) => !item.valid)
    if (!firstInvalid) {
      return true
    }

    setSubmitProgress(0)
    setState({
      status: 'error',
      message: firstInvalid.message,
    })
    focusField(firstInvalid.key)
    return false
  }

  useEffect(() => {
    if (isBranchPickup || !hasValidCity || form.address.trim().length < 3) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        const query = [form.address, selectedCity, selectedProvince, 'Argentina'].filter(Boolean).join(', ')
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ar&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          setAddressSuggestions([])
          setAddressSuggestionsOpen(false)
          return
        }

        const data = (await response.json()) as Array<{ display_name: string; name?: string }>
        const nextSuggestions = data.map((item) => ({
          displayName: item.display_name,
          line1: item.name || item.display_name.split(',')[0] || form.address,
        }))

        setAddressSuggestions(nextSuggestions)
        setAddressSuggestionsOpen(nextSuggestions.length > 0)
      } catch {
        setAddressSuggestions([])
        setAddressSuggestionsOpen(false)
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [form.address, hasValidCity, isBranchPickup, selectedCity, selectedProvince])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateBeforeSubmit()) {
      return
    }

    setSubmitProgress(10)
    setState({ status: 'saving', message: 'Estamos preparando tu pedido…' })

    trackBeginCheckout({
      total: shippingPreview.total,
      shipping: shippingPreview.shippingAmount,
      items: items.map(mapCartItemToAnalyticsItem),
    })

    const checkoutNotes = [
      form.notes.trim(),
      isBranchPickup ? 'Entrega elegida: Retiro en sucursal Andreani.' : 'Entrega elegida: Envío a domicilio.',
      selectedBranch ? `Sucursal Andreani: ${selectedBranch.label}.` : null,
    ]
      .filter(Boolean)
      .join(' · ')

    const payload = {
      ...form,
      address: isBranchPickup ? selectedBranch?.branchName ?? 'Sucursal Andreani' : form.address,
      streetNumber: isBranchPickup ? selectedBranch?.addressLine ?? 'Sucursal Andreani' : form.streetNumber,
      floor: isBranchPickup ? '' : form.floor,
      apartment: isBranchPickup ? '' : form.apartment,
      pinLabel: isBranchPickup ? selectedBranch?.label ?? '' : form.pinLabel,
      phone: `${form.phoneAreaCode.trim()} ${form.phoneNumber.trim()}`.trim(),
      notes: checkoutNotes || undefined,
      couponCode: appliedCoupon?.code,
      paymentMethod,
      salesChannel,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        colorName: item.colorName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.price,
        comboArmable: item.comboArmable ?? false,
      })),
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setSubmitProgress(0)
        setState({
          status: 'error',
          message: data?.message || 'No pudimos crear la orden.',
        })
        return
      }

      setSubmitProgress(100)
      setRedirectCountdown(5)
      setState({
        status: 'success',
        message: data.message,
        orderNumber: data.orderNumber,
        shortCode: data.shortCode,
        orderId: data.orderId,
        paymentUrl: data.paymentUrl,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
      })

      if (data.paymentUrl) {
        console.info('[checkout] redirecting to Mercado Pago', {
          orderId: data.orderId ?? null,
          orderNumber: data.orderNumber ?? null,
          paymentUrl: data.paymentUrl,
        })
        window.location.assign(data.paymentUrl)
        return
      }

    } catch {
      setSubmitProgress(0)
      setState({
        status: 'error',
        message: 'No pudimos procesar tu pedido en este momento. Intentá nuevamente.',
      })
    }
  }

  async function handleApplyCoupon() {
    const rawCode = couponInput.trim()

    if (couponRestrictionReason) {
      setAppliedCoupon(null)
      setCouponFeedback({
        status: 'error',
        message: couponRestrictionReason,
      })
      return
    }

    if (!rawCode) {
      setCouponFeedback({
        status: 'error',
        message: 'Ingresá un código para aplicar el cupón.',
      })
      return
    }

    setIsApplyingCoupon(true)
    setCouponFeedback({
      status: 'idle',
      message: '',
    })

    try {
      const response = await fetch('/api/checkout/coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: rawCode,
          subtotal,
          city: form.city,
          province: form.province,
          paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.coupon) {
        setAppliedCoupon(null)
        setCouponFeedback({
          status: 'error',
          message: data?.message || 'No pudimos aplicar el cupón.',
        })
        return
      }

      setAppliedCoupon({
        id: data.coupon.id,
        code: data.coupon.code,
        description: data.coupon.description ?? null,
        type: data.coupon.type,
        value: data.coupon.value,
        minSubtotal: data.coupon.minSubtotal,
      })
      setCouponInput(data.coupon.code)
      setCouponFeedback({
        status: 'success',
        message: data.message || 'Cupón aplicado.',
      })
    } catch {
      setAppliedCoupon(null)
      setCouponFeedback({
        status: 'error',
        message: 'No pudimos validar el cupón en este momento.',
      })
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponFeedback({
      status: 'idle',
      message: '',
    })
  }

  return (
    <div className="relative">
      {state.status === 'success' && !state.paymentUrl ? (
        <div className="fixed inset-0 z-[160] overflow-y-auto">
          <div className={`absolute inset-0 ${successAccentClasses.backdrop}`} />
          <div className="absolute inset-x-0 top-0 h-[56vh] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_55%)]" />
          <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 md:px-8">
            <div className={`w-full overflow-hidden rounded-[36px] border border-white/30 bg-white ${successAccentClasses.card}`}>
              <div className={`${successAccentClasses.hero} px-6 py-10 text-white md:px-10 md:py-14`}>
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/35 bg-white/14 shadow-[0_16px_40px_rgba(255,255,255,0.18)] md:h-24 md:w-24">
                    <CheckCheck className="h-10 w-10 md:h-12 md:w-12" />
                  </div>
                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/82">
                    Pedido confirmado
                  </p>
                  <h2 className="mt-4 font-display text-4xl tracking-[-0.06em] md:text-6xl">
                    {successUsesTransfer ? 'Tu pedido ya quedó registrado' : 'Gracias por tu compra'}
                  </h2>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/88 md:text-base md:leading-8">
                    {successUsesTransfer
                      ? 'Tu pedido quedó confirmado en la web y marcado como pendiente de pago. Te enviamos por email los datos para completar la transferencia y te avisamos cuando impacte.'
                      : 'Tu pago ya fue acreditado y el pedido quedó guardado en tu cuenta para que puedas seguir cada etapa del proceso.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-center">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${successAccentClasses.eyebrow}`}>Redirección automática</p>
                  <h3 className="mt-3 font-display text-3xl tracking-[-0.05em] text-black md:text-4xl">
                    Te vamos a llevar a tu panel de control para ver el estado de tu pedido en {redirectCountdown}.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-black/62 md:text-base md:leading-8">
                    {successUsesTransfer
                      ? 'Ahí vas a poder revisar la compra, ver que quedó pendiente de pago y seguir el avance una vez acreditada la transferencia.'
                      : 'Ahí vas a poder revisar la compra, confirmar que el pago quedó acreditado y seguir el avance del envío.'}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {[5, 4, 3, 2, 1].map((value) => {
                      const active = redirectCountdown === value
                      const done = redirectCountdown < value

                      return (
                        <div
                          key={value}
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-base font-semibold transition md:h-14 md:w-14 md:text-lg ${
                            active
                              ? 'scale-110 border-emerald-500 bg-emerald-500 text-white shadow-[0_18px_40px_rgba(34,197,94,0.28)]'
                              : done
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-black/10 bg-[#f6f8f3] text-black/48'
                          }`}
                        >
                          {value}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#edf6ee]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#16a34a_0%,#22c55e_50%,#86efac_100%)] transition-[width] duration-1000"
                      style={{ width: `${((5 - redirectCountdown) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div
                  className={`rounded-[30px] p-6 shadow-[0_16px_50px_rgba(17,24,39,0.06)] ${
                    successUsesTransfer ? 'border border-amber-100 bg-[#fffaf1]' : 'border border-emerald-100 bg-[#f6fff7]'
                  }`}
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${successAccentClasses.eyebrow}`}>Resumen de compra</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-black/44">Estado</p>
                      <p className="mt-1 text-lg font-semibold text-black">
                        {successUsesTransfer ? 'Pendiente de pago por transferencia' : 'Pago acreditado'}
                      </p>
                    </div>
                    {state.shortCode ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-black/44">Código</p>
                        <p className="mt-1 text-lg font-semibold text-black">{state.shortCode}</p>
                      </div>
                    ) : null}
                    {state.orderNumber ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-black/44">Pedido</p>
                        <p className="mt-1 text-lg font-semibold text-black">{state.orderNumber}</p>
                      </div>
                    ) : null}
                    <div className={`rounded-[22px] border px-4 py-4 text-sm leading-6 ${successAccentClasses.message}`}>
                      {state.message}
                    </div>
                    {successUsesTransfer ? (
                      <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-900">
                        Ya te llevamos al pedido para que lo veas en estado pendiente de pago. Las instrucciones llegan por email junto con el detalle completo.
                      </div>
                    ) : null}
                    <div className={`inline-flex items-center gap-2 text-sm font-medium ${successAccentClasses.redirect}`}>
                      <ArrowRight className="h-4 w-4" />
                      Redirigiendo a tu panel ahora
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {state.status === 'saving' ? (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-[rgba(11,15,12,0.42)] px-4 py-4 backdrop-blur-md md:items-center md:px-6 md:py-6">
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,247,244,0.96)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.22)]"
          >
            <div className="bg-[linear-gradient(135deg,#111827_0%,#1f2937_40%,#16a34a_100%)] px-5 py-6 text-white md:px-7 md:py-8">
              <div className="flex items-start gap-4 md:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/18 bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:h-16 md:w-16">
                  <LoaderCircle className="h-7 w-7 animate-spin md:h-8 md:w-8" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Procesando compra</p>
                  <h2 className="mt-2 font-display text-3xl tracking-[-0.05em] text-white md:text-4xl">
                    {isTransferPayment ? 'Estamos registrando tu pedido con transferencia' : 'Estamos abriendo el checkout de Mercado Pago'}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/82 md:text-base">
                    {isTransferPayment
                      ? 'Guardamos tu pedido, aplicamos el descuento y dejamos el pago pendiente para que puedas transferir.'
                      : 'Tu orden ya se está preparando. En unos segundos te redirigimos para completar el pago de forma segura.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 md:px-7 md:py-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/90 px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Paso 1</p>
                  <p className="mt-2 text-sm font-semibold text-black">Guardando pedido</p>
                  <p className="mt-1 text-sm leading-6 text-black/60">Registramos tus datos y reservamos esta compra.</p>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/42">Paso 2</p>
                  <p className="mt-2 text-sm font-semibold text-black">
                    {isTransferPayment ? 'Registrando pedido' : 'Preparando pago'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-black/60">
                    {isTransferPayment ? 'Estamos generando tu orden con pago pendiente.' : 'Conectamos la orden con Mercado Pago.'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/42">Paso 3</p>
                  <p className="mt-2 text-sm font-semibold text-black">Redirección automática</p>
                  <p className="mt-1 text-sm leading-6 text-black/60">
                    {isTransferPayment
                      ? 'Cuando termine, te mostraremos la confirmación del pedido y te enviaremos por email los datos para pagar.'
                      : 'Se abrirá el checkout sin que tengas que hacer nada.'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-black/44">
                  <span>Conectando</span>
                  <span>{Math.max(8, Math.min(99, submitProgress))}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#111827_0%,#16a34a_58%,#86efac_100%)] transition-[width] duration-300"
                    style={{ width: `${Math.max(8, Math.min(99, submitProgress))}%` }}
                  />
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-black/58">
                No cierres esta ventana ni vuelvas atrás. Si tu conexión es lenta, la redirección puede tardar unos segundos más.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className={`grid gap-8 transition duration-300 xl:grid-cols-[minmax(0,1fr)_380px] ${
          state.status === 'saving' || state.status === 'success' ? 'scale-[0.995] opacity-75 blur-[1px]' : 'opacity-100'
        }`}
      >
        <div className="space-y-6">
          <div className="card-surface p-7">
            <p className="eyebrow">Checkout</p>
            <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] text-black md:text-5xl">Elegí cómo recibir tu pedido y pagalo de forma simple</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62 md:text-base md:leading-8">
              Definí si querés envío a domicilio o retiro en sucursal Andreani, completá tus datos y seguí al pago.
              Vas a ver el tiempo estimado de entrega antes de terminar la compra y después vas a poder revisar el estado del pedido desde tu cuenta.
            </p>
            {state.status !== 'idle' ? (
              <div
                className={`mt-6 rounded-[24px] px-5 py-4 text-sm ${
                  state.status === 'success'
                    ? successUsesTransfer
                      ? 'border border-amber-200 bg-amber-50 text-amber-800'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : state.status === 'error'
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : 'border border-black/10 bg-[#f7f7f4] text-black/62'
                }`}
              >
                <p>{state.message}</p>
                {state.shortCode ? (
                  <p className="mt-2 font-medium text-black/82">
                    {state.shortCode} · {state.orderNumber}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="card-surface p-7">
            <div className="grid gap-6">
              <div className="rounded-[24px] border border-black/8 bg-[#fafaf8] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-black/46">Forma de entrega</p>
                    <h2 className="mt-2 font-display text-3xl tracking-[-0.05em]">Cómo querés recibirlo</h2>
                  </div>
                  {shippingPreview.isBariloche ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                      Bariloche
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <label
                    className={`group cursor-pointer rounded-[24px] border px-4 py-4 text-sm transition ${
                      deliveryMode === 'HOME'
                        ? 'border-black bg-white shadow-[0_12px_28px_rgba(0,0,0,0.06)]'
                        : 'border-black/10 bg-white/90 hover:border-black/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMode"
                      checked={deliveryMode === 'HOME'}
                      onChange={() => setDeliveryMode('HOME')}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                          deliveryMode === 'HOME' ? 'border-black bg-black' : 'border-black/22 bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        <span
                          className={`h-2 w-2 rounded-full bg-white transition ${
                            deliveryMode === 'HOME' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                          }`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-black/66" />
                          <p className="text-sm font-semibold text-black/84">Envío a domicilio</p>
                        </div>
                        <p className="mt-1 text-xs text-black/56">Lo enviamos a la dirección que cargues en el checkout.</p>
                      </div>
                    </div>
                  </label>
                  <label
                    className={`group cursor-pointer rounded-[24px] border px-4 py-4 text-sm transition ${
                      deliveryMode === 'BRANCH'
                        ? 'border-sky-300 bg-sky-50 shadow-[0_12px_28px_rgba(14,165,233,0.12)]'
                        : shippingPreview.isBariloche
                          ? 'cursor-not-allowed border-black/10 bg-white/65 opacity-55'
                          : 'border-black/10 bg-white hover:border-sky-200 hover:bg-sky-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMode"
                      checked={deliveryMode === 'BRANCH'}
                      onChange={() => {
                        if (!shippingPreview.isBariloche) {
                          setDeliveryMode('BRANCH')
                        }
                      }}
                      className="sr-only"
                      disabled={shippingPreview.isBariloche}
                    />
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                          deliveryMode === 'BRANCH' ? 'border-sky-700 bg-sky-700' : 'border-black/22 bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        <span
                          className={`h-2 w-2 rounded-full bg-white transition ${
                            deliveryMode === 'BRANCH' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                          }`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-sky-700" />
                          <p className="text-sm font-semibold text-black/84">Retiro en sucursal</p>
                        </div>
                        <p className="mt-1 text-xs text-black/56">
                          Elegís una sucursal Andreani cercana y retirás ahí tu pedido.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div ref={provinceRef}>
                    <SearchableSelect
                      label="Provincia"
                      value={form.province}
                      options={[...argentinaProvinces]}
                      placeholder="Seleccioná provincia"
                      onChange={(province) => {
                        const currentCityStillValid = cityOptions.find(
                          (city) => normalizeProvinceName(city) === normalizeProvinceName(form.city),
                        )
                        setCityOptions([])
                        setForm((current) => ({
                          ...current,
                          province,
                          city: currentCityStillValid ?? '',
                          address: currentCityStillValid ? current.address : '',
                          latitude: '',
                          longitude: '',
                          pinLabel: '',
                        }))
                        setAddressSuggestions([])
                        setAddressSuggestionsOpen(false)
                        if (!currentCityStillValid && paymentMethod === 'CASH_ON_DELIVERY') {
                          setPaymentMethod('ONLINE')
                        }
                      }}
                    />
                  </div>

                  <div ref={cityRef} className="relative">
                    <SearchableSelect
                      label="Ciudad"
                      value={form.city}
                      options={citySuggestions}
                      placeholder={selectedProvince ? 'Seleccioná ciudad' : 'Primero elegí provincia'}
                      disabled={!selectedProvince}
                      emptyMessage="No hay ciudades cargadas para esa provincia."
                      onChange={(city) => {
                        setForm((current) => ({
                          ...current,
                          city,
                          address: '',
                          latitude: '',
                          longitude: '',
                          pinLabel: '',
                        }))
                        if (!isBarilocheLocation(city, selectedProvince ?? form.province) && paymentMethod === 'CASH_ON_DELIVERY') {
                          setPaymentMethod('ONLINE')
                        }
                        setAddressSuggestions([])
                        setAddressSuggestionsOpen(false)
                      }}
                    />
                    <MapPin className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/34" />
                  </div>

                  <input
                    ref={postalCodeRef}
                    value={form.postalCode}
                    onChange={(event) => updateField('postalCode', event.target.value)}
                    placeholder="Código postal"
                    className="rounded-[20px] border border-black/10 bg-white px-4 py-4 text-sm outline-none"
                  />
                </div>
                {isBranchPickup ? (
                  <div ref={branchRef} className="mt-4 rounded-[24px] border border-black/8 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-black/46">Sucursal Andreani</p>
                        <p className="mt-2 text-sm text-black/62">
                          Elegí dónde querés retirar antes de completar tus datos.
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-800">
                        Retiro en sucursal
                      </span>
                    </div>
                    <div className="mt-4">
                      {branchFeedback.status === 'loading' ? (
                        <div className="rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                          <span className="inline-flex items-center gap-2 font-medium">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Buscando sucursales…
                          </span>
                        </div>
                      ) : null}
                      {branchOptions.length > 0 ? (
                        <div className={branchFeedback.status === 'loading' ? 'mt-3 opacity-70' : ''}>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/48">
                            Seleccioná una sucursal
                          </p>
                          <SearchableSelect
                            label="Sucursal Andreani"
                            value={selectedBranch?.label ?? ''}
                            options={branchOptions.map((branch) => branch.label)}
                            placeholder="Seleccioná una sucursal"
                            searchable={false}
                            disabled={branchFeedback.status === 'loading' || branchOptions.length === 0}
                            emptyMessage="No encontramos sucursales para esa búsqueda."
                            onChange={(label) => {
                              const branch = branchOptions.find((option) => option.label === label)
                              setSelectedBranchId(branch?.id ?? '')
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                    {branchFeedback.status !== 'idle' && branchFeedback.status !== 'loading' ? (
                      <p
                        className={`mt-3 text-sm ${
                          branchFeedback.status === 'error'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {branchFeedback.message}
                      </p>
                    ) : null}
                    {selectedBranch ? (
                      <div className="mt-4 rounded-[18px] border border-black/8 bg-[#fafaf8] px-4 py-4 text-sm text-black/74">
                        <p className="font-semibold text-black/84">{selectedBranch.branchName}</p>
                        <p className="mt-1">{selectedBranch.addressLine}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {!isBranchPickup || selectedBranch ? (
                  <>
                    <div className="mt-5 rounded-[20px] border border-black/8 bg-white px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/48">Tiempo estimado de entrega</p>
                      <p className="mt-2 text-sm font-medium text-black/82">
                        Entre el {formatDeliveryDate(estimatedDeliveryWindow.from)} y el {formatDeliveryDate(estimatedDeliveryWindow.to)}.
                      </p>
                      <p className="mt-1 text-xs text-black/54">
                        Son entre 5 y 10 días hábiles desde la confirmación del pago.
                      </p>
                    </div>
                    {shippingPreview.isBariloche ? (
                      <div className="mt-4">
                        <BarilocheDeliveryCountdown variant="block" showStatusBadge />
                      </div>
                    ) : null}
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-black/58">
                        {isBranchPickup
                          ? 'Cuando el pedido llegue a la sucursal te avisamos para que puedas retirarlo.'
                          : 'Te pedimos la dirección para calcular y validar correctamente el envío.'}
                      </p>
                      <p className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        {TRANSFER_DISCOUNT_PERCENT}% de descuento abonando por transferencia.
                      </p>
                      {shouldShowShippingPrice && shippingPreview.shippingAmount === 0 ? (
                        <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                          Envío gratis por superar {formatPrice(settings.localDeliveryFreeThreshold)}.
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card-surface p-7">
            <h2 className="font-display text-3xl tracking-[-0.05em]">
              {isBranchPickup ? 'Datos para retirar en sucursal' : 'Datos del cliente'}
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                ref={fullNameRef}
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Nombre"
                className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
              />
              <input
                ref={lastNameRef}
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                placeholder="Apellido"
                className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
              />
              <input
                ref={dniRef}
                value={form.dni}
                onChange={(event) => updateField('dni', event.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="DNI"
                className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
              />
              <input
                ref={emailRef}
                value={form.email}
                onChange={(event) => updateField('email', event.target.value.toLowerCase())}
                placeholder="Email"
                className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
              />

              <div className="md:col-span-2">
                <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto]">
                  <div className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Código celular</p>
                    <input
                      ref={phoneAreaCodeRef}
                      value={form.phoneAreaCode}
                      onChange={(event) => updateField('phoneAreaCode', event.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="11"
                      className="mt-2 h-8 w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <div className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-3">
                    <div className="flex items-center gap-3 text-black/44">
                      <Phone className="h-4 w-4" />
                      <input
                        ref={phoneNumberRef}
                        value={form.phoneNumber}
                        onChange={(event) => updateField('phoneNumber', event.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="12345678"
                        className="h-8 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-black/44">Lo usamos para seguimiento y despacho con Andreani.</p>
                  </div>
                  <input ref={phoneRef} value={`${form.phoneAreaCode} ${form.phoneNumber}`.trim()} readOnly className="hidden" />

                  <label className="flex items-center gap-3 rounded-[20px] border border-black/10 bg-white px-4 py-3 text-sm text-black/72">
                    <input
                      type="checkbox"
                      checked={form.whatsappOptIn}
                      onChange={(event) => updateField('whatsappOptIn', event.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                        form.whatsappOptIn ? 'bg-black' : 'bg-black/12'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          form.whatsappOptIn ? 'left-6' : 'left-1'
                        }`}
                      />
                    </span>
                    <span className="max-w-[16rem]">
                      <span className="block font-medium">Acepto notificaciones por WhatsApp</span>
                      <span className="block text-[11px] text-black/46">Para avisos manuales de reparto y estado del envío.</span>
                    </span>
                  </label>
                </div>
              </div>

              {deliveryMode === 'HOME' ? (
                <>
                  {hasValidCity ? (
                    <div className="relative md:col-span-2">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                        <div className="relative">
                          <input
                            ref={addressRef}
                            name="delivery-address-search"
                            value={form.address}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="words"
                            spellCheck={false}
                            data-form-type="other"
                            data-lpignore="true"
                            onChange={(event) => {
                              updateField('address', event.target.value)
                              setAddressSuggestionsOpen(true)
                            }}
                            onBlur={() => {
                              window.setTimeout(() => {
                                setAddressSuggestionsOpen(false)
                                if (shouldShowPinPicker) {
                                  pinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                              }, 140)
                            }}
                            placeholder="Calle"
                            className="w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
                          />
                          {addressSuggestionsOpen && addressSuggestions.length > 0 ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-[20px] border border-black/10 bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
                              {addressSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion.displayName}
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    applyAddressSuggestion(suggestion)
                                  }}
                                  onTouchStart={() => applyAddressSuggestion(suggestion)}
                                  className="block w-full rounded-[14px] px-3 py-3 text-left text-sm text-black/72 transition hover:bg-[#f6f6f3]"
                                >
                                  {suggestion.displayName}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <input
                          ref={streetNumberRef}
                          value={form.streetNumber}
                          onChange={(event) =>
                            updateField('streetNumber', event.target.value.replace(/[^\dA-Za-z/-]/g, '').slice(0, 10))
                          }
                          placeholder="Número"
                          className="w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
                        />
                      </div>
                    </div>
                  ) : null}

                  <input
                    ref={floorRef}
                    value={form.floor}
                    onChange={(event) => updateField('floor', event.target.value.slice(0, 10))}
                    placeholder="Piso (opcional)"
                    className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
                  />
                  <input
                    ref={apartmentRef}
                    value={form.apartment}
                    onChange={(event) => updateField('apartment', event.target.value.slice(0, 10))}
                    placeholder="Departamento (opcional)"
                    className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
                  />
                </>
              ) : null}
            </div>

            {shouldRequirePin ? (
              <div ref={pinRef} className="mt-6">
                {shouldShowPinPicker ? (
                  <AddressPinPicker
                    address={form.address}
                    city={form.city}
                    province={form.province}
                    latitude={form.latitude}
                    longitude={form.longitude}
                    pinLabel={form.pinLabel}
                    onChange={(next) =>
                      setForm((current) => ({
                        ...current,
                        latitude: next.latitude ?? current.latitude,
                        longitude: next.longitude ?? current.longitude,
                        pinLabel: next.pinLabel ?? current.pinLabel,
                      }))
                    }
                  />
                ) : (
                  <div className="rounded-[24px] border border-black/8 bg-[#fafaf8] px-5 py-5 text-sm text-black/60">
                    Completá tu dirección en Bariloche y te vamos a mostrar el mapa para que verifiques el pin exacto de tu domicilio.
                  </div>
                )}
              </div>
            ) : null}

            <textarea
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Notas del pedido"
              className="mt-6 min-h-32 w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
            />
          </div>

          <div className="card-surface p-7">
            <div className="grid gap-3">
              <div className="rounded-[24px] border border-black/10 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-black/84">Cupón de descuento</p>
                    <p className="mt-1 text-xs text-black/56">Si tenés un código, lo podés aplicar antes de pagar.</p>
                  </div>
                  <div className="flex flex-1 gap-2">
                    <input
                      value={couponInput}
                      onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                      placeholder="Ej: PATI10"
                      disabled={Boolean(couponRestrictionReason) && !appliedCoupon}
                      className="min-w-0 flex-1 rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-3 text-sm uppercase outline-none disabled:cursor-not-allowed disabled:opacity-55"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
                      >
                        Quitar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || Boolean(couponRestrictionReason)}
                        className="rounded-full bg-black px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/88 disabled:cursor-wait disabled:bg-black/70"
                      >
                        {isApplyingCoupon ? 'Aplicando…' : 'Aplicar'}
                      </button>
                    )}
                  </div>
                </div>
                {couponFeedback.status !== 'idle' ? (
                  <div
                    className={`mt-3 rounded-[18px] px-4 py-3 text-sm ${
                      couponFeedback.status === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {couponFeedback.message}
                  </div>
                ) : null}
                {couponFeedback.status === 'idle' && couponRestrictionReason ? (
                  <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {couponRestrictionReason}
                  </div>
                ) : null}
                {appliedCoupon ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-emerald-700">
                    Cupón activo: {appliedCoupon.code}
                  </p>
                ) : null}
              </div>
              <label
                className={`group cursor-pointer rounded-[24px] border px-4 py-4 text-sm transition ${
                  paymentMethod === 'ONLINE'
                    ? 'border-[#009ee3]/24 bg-[#f3fbff] shadow-[0_12px_28px_rgba(0,158,227,0.12)]'
                    : 'border-black/10 bg-white hover:border-[#009ee3]/24 hover:bg-[#f7fcff]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      paymentMethod === 'ONLINE' ? 'border-black bg-black' : 'border-black/22 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    <span
                      className={`h-2 w-2 rounded-full bg-white transition ${
                        paymentMethod === 'ONLINE' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <MercadoPagoBadge compact />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0070a3]">3 cuotas sin interés</span>
                    </div>
                    <p className="text-sm font-semibold tracking-normal text-black/84">Pagar con Mercado Pago</p>
                    <p className="mt-1 text-xs tracking-normal text-black/56">
                      Pagás con tarjeta por Mercado Pago, con checkout seguro y hasta 3 cuotas sin interés.
                    </p>
                  </div>
                </div>
              </label>
              <label
                className={`group cursor-pointer rounded-[24px] border px-4 py-4 text-sm transition ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-amber-300 bg-amber-50 shadow-[0_12px_28px_rgba(217,119,6,0.12)]'
                    : 'border-black/10 bg-white hover:border-amber-200 hover:bg-amber-50/40'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'TRANSFER'}
                  onChange={() => setPaymentMethod('TRANSFER')}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      paymentMethod === 'TRANSFER' ? 'border-amber-700 bg-amber-700' : 'border-black/22 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    <span
                      className={`h-2 w-2 rounded-full bg-white transition ${
                        paymentMethod === 'TRANSFER' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                        <Landmark className="mr-2 h-3.5 w-3.5" />
                        Transferencia
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                        {TRANSFER_DISCOUNT_PERCENT}% off
                      </span>
                    </div>
                    <p className="text-sm font-semibold tracking-normal text-black/84">Pagar por transferencia</p>
                    <p className="mt-1 text-xs tracking-normal text-black/56">
                      Te enviamos los datos por mail y el pedido queda pendiente de pago hasta acreditar la transferencia.
                    </p>
                  </div>
                </div>
              </label>
              <div className="rounded-[24px] border border-dashed border-black/14 bg-[#fafaf8] px-4 py-4 text-sm">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/18 bg-white"
                    aria-hidden="true"
                  >
                    <span className="h-2 w-2 rounded-full bg-black/18" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/84">
                        Pago contra entrega solo Bariloche
                      </p>
                      <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/54">
                        Próximamente
                      </span>
                    </div>
                    <p className="mt-1 text-xs normal-case tracking-normal text-black/56">
                      Lo vamos a habilitar dentro de poco para entregas en San Carlos de Bariloche.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="card-surface h-fit p-6 md:p-7 xl:sticky xl:top-28 xl:self-start">
          <p className="eyebrow">Resumen</p>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 border-b border-black/8 pb-4">
                <div>
                  {(() => {
                    const originalLineTotal = item.price * item.quantity
                    const discountedLineTotal = comboSummary.lineTotalsByItemId.get(item.id) ?? originalLineTotal
                    const lineSavings = Math.max(0, originalLineTotal - discountedLineTotal)
                    const comboUnits = comboSummary.comboDiscountedUnitsByItemId.get(item.id) ?? 0
                    const comboDiscountPercent =
                      comboUnits > 0
                        ? item.comboEligibleFrom?.find((combo) => items.some((cartItem) => cartItem.productId === combo.productId))?.discountPercent ?? 25
                        : 25

                    return (
                      <>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-black/52">
                    {item.colorName} · {item.size} · x{item.quantity}
                  </p>
                  {(comboSummary.freeUnitsByItemId.get(item.id) ?? 0) > 0 ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      {(comboSummary.freeUnitsByItemId.get(item.id) ?? 0)} gratis por promo 2x1
                    </p>
                  ) : null}
                  {(comboSummary.comboDiscountedUnitsByItemId.get(item.id) ?? 0) > 0 ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                      {(comboSummary.comboDiscountedUnitsByItemId.get(item.id) ?? 0)} unidad combo al 25% off
                    </p>
                  ) : null}
                  {comboUnits > 0 ? (
                    <p className="mt-1 text-xs text-sky-800">
                      Precio combo por unidad: <span className="text-black/38 line-through">{formatPrice(item.price)}</span>{' '}
                      <span className="font-semibold">{formatPrice(getComboDiscountedPrice(item.price, comboDiscountPercent))}</span>
                    </p>
                  ) : null}
                  {lineSavings > 0 ? (
                    <p className="mt-1 text-xs font-medium text-black/70">Ahorrás {formatPrice(lineSavings)} en esta línea.</p>
                  ) : null}
                      </>
                    )
                  })()}
                </div>
                {(() => {
                  const originalLineTotal = item.price * item.quantity
                  const discountedLineTotal = comboSummary.lineTotalsByItemId.get(item.id) ?? originalLineTotal
                  const lineSavings = Math.max(0, originalLineTotal - discountedLineTotal)

                  return (
                    <div className="text-right">
                      {lineSavings > 0 ? (
                        <p className="text-xs text-black/38 line-through">{formatPrice(originalLineTotal)}</p>
                      ) : null}
                      <p className="font-semibold">{formatPrice(discountedLineTotal)}</p>
                      {lineSavings > 0 ? (
                        <p className="text-xs font-medium text-emerald-700">- {formatPrice(lineSavings)}</p>
                      ) : null}
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 text-sm text-black/62">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(comboSummary.grossSubtotal)}</span>
            </div>
            {twoForOneDiscountAmount > 0 ? (
              <div className="flex justify-between text-emerald-700">
                <span>Promo 2x1</span>
                <span>-{formatPrice(twoForOneDiscountAmount)}</span>
              </div>
            ) : null}
            {comboLinkDiscountAmount > 0 ? (
              <div className="flex justify-between text-sky-700">
                <span>Combo prendas</span>
                <span>-{formatPrice(comboLinkDiscountAmount)}</span>
              </div>
            ) : null}
            {shippingPreview.barilocheDiscountAmount > 0 ? (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento Bariloche ({shippingPreview.barilocheDiscountPercent}%)</span>
                <span>-{formatPrice(shippingPreview.barilocheDiscountAmount)}</span>
              </div>
            ) : null}
            {shippingPreview.transferDiscountAmount > 0 ? (
              <div className="flex justify-between text-amber-700">
                <span>Descuento transferencia ({shippingPreview.transferDiscountPercent}%)</span>
                <span>-{formatPrice(shippingPreview.transferDiscountAmount)}</span>
              </div>
            ) : null}
            {couponDiscountAmount > 0 && appliedCoupon ? (
              <div className="flex justify-between text-sky-700">
                <span>Cupón {appliedCoupon.code}</span>
                <span>-{formatPrice(couponDiscountAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>{shippingLabel}</span>
              <span className={shouldShowShippingPrice && shippingPreview.shippingAmount === 0 ? 'font-semibold text-emerald-700' : ''}>
                {!shouldShowShippingPrice
                  ? 'Se calcula al completar destino'
                  : shippingPreview.shippingAmount === 0
                    ? 'Envío gratis'
                    : formatPrice(shippingPreview.shippingAmount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-4 text-base font-semibold text-black">
              <span>Total</span>
              <span>{shouldShowShippingPrice ? formatPrice(shippingPreview.total) : formatPrice(Math.max(0, shippingPreview.total - shippingPreview.shippingAmount))}</span>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-black/8 bg-[#fafaf8] px-4 py-4 text-sm text-black/66">
            <p className="font-semibold text-black/82">{shippingLabel}</p>
            <p className="mt-1">
              Entrega estimada entre el {formatDeliveryDate(estimatedDeliveryWindow.from)} y el {formatDeliveryDate(estimatedDeliveryWindow.to)}.
            </p>
          </div>

          <p className="mt-4 text-sm leading-6 text-red-700">
            Donamos el 5% de tu compra a refugios para mascotas en toda Argentina.
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-700">
            {TRANSFER_DISCOUNT_PERCENT}% de descuento pagando por transferencia.
          </p>

          <button
            type="submit"
            disabled={state.status === 'saving'}
            className={`relative mt-7 w-full overflow-hidden rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white transition ${
              state.status === 'saving' ? 'cursor-wait bg-black/90' : 'bg-black hover:bg-black/88'
            }`}
          >
            <span
              className="absolute inset-y-0 left-0 bg-white/12 transition-[width] duration-200"
              style={{ width: `${submitProgress}%` }}
            />
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              {state.status === 'saving' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {state.status === 'saving'
                ? isTransferPayment
                  ? 'Registrando pedido…'
                  : 'Cargando Mercado Pago…'
                : isTransferPayment
                  ? 'Confirmar pedido con transferencia'
                  : 'Continuar a Mercado Pago'}
            </span>
          </button>
          {!isTransferPayment ? (
            <p className="mt-3 text-center text-xs text-black/54">Tarjeta vía Mercado Pago. Hasta 3 cuotas sin interés.</p>
          ) : null}
        </aside>
      </form>
    </div>
  )
}
