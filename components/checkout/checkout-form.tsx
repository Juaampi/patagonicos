'use client'

import { ArrowRight, CheckCheck, LoaderCircle, MapPin, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { AddressPinPicker } from '@/components/checkout/address-pin-picker'
import { SearchableSelect } from '@/components/checkout/searchable-select'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import {
  argentinaProvinces,
  getCanonicalProvince,
  getProvinceCitySuggestions,
  normalizeProvinceName,
} from '@/lib/argentina-data'
import { getCheckoutPreview, isBarilocheLocation, type StoreSettingsSnapshot } from '@/lib/store-settings'
import type { CartItem } from '@/types/store'
import { formatPrice } from '@/lib/utils'

type CheckoutFormProps = {
  items: CartItem[]
  settings: StoreSettingsSnapshot
}

type AddressSuggestion = {
  displayName: string
  line1: string
}

type GeoRefLocality = {
  nombre: string
}

function MercadoPagoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-black/10 bg-white text-black/82 ${
        compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
      } font-semibold uppercase tracking-[0.12em]`}
    >
      <span className={`inline-flex items-center rounded-full bg-black ${compact ? 'px-2 py-0.5' : 'px-2.5 py-0.5'} text-white`}>
        MP
      </span>
      <span className="ml-2">Mercado Pago</span>
    </span>
  )
}

export function CheckoutForm({ items, settings }: CheckoutFormProps) {
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
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
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
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH_ON_DELIVERY'>('ONLINE')
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false)
  const [state, setState] = useState<{
    status: 'idle' | 'saving' | 'success' | 'error'
    message: string
    orderNumber?: string
    shortCode?: string
    orderId?: string
    paymentUrl?: string
  }>({
    status: 'idle',
    message: '',
  })
  const [submitProgress, setSubmitProgress] = useState(0)
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  const shippingPreview = useMemo(() => {
    return getCheckoutPreview(subtotal, form.city, form.province, settings)
  }, [form.city, form.province, settings, subtotal])
  const shouldRequirePin = shippingPreview.isBariloche
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
    }, 5000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [form.email, router, state.orderId, state.paymentUrl, state.status])

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
      { key: 'address', valid: form.address.trim().length >= 4, message: 'Completá la dirección de entrega.' },
      { key: 'streetNumber', valid: form.streetNumber.trim().length >= 1, message: 'Completá la numeración de la dirección.' },
      { key: 'postalCode', valid: form.postalCode.trim().length >= 3, message: 'Completá el código postal.' },
      {
        key: 'pin',
        valid: !shouldRequirePin || Boolean(form.latitude && form.longitude),
        message: 'Verificá el pin en el mapa para confirmar la dirección exacta de entrega.',
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
    if (!hasValidCity || form.address.trim().length < 3) {
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
  }, [form.address, hasValidCity, selectedCity, selectedProvince])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateBeforeSubmit()) {
      return
    }

    setSubmitProgress(10)
    setState({ status: 'saving', message: 'Estamos preparando tu pedido…' })

    const payload = {
      ...form,
      phone: `${form.phoneAreaCode.trim()} ${form.phoneNumber.trim()}`.trim(),
      paymentMethod,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        colorName: item.colorName,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    }

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
    })

    if (data.paymentUrl) {
      window.location.assign(data.paymentUrl)
      return
    }

    clearCart()
  }

  return (
    <div className="relative">
      {state.status === 'success' && !state.paymentUrl ? (
        <div className="fixed inset-0 z-[160] overflow-y-auto">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#16a34a_0%,#22c55e_48%,rgba(34,197,94,0.18)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-[56vh] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_55%)]" />
          <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 md:px-8">
            <div className="w-full overflow-hidden rounded-[36px] border border-white/30 bg-white shadow-[0_40px_120px_rgba(4,120,87,0.35)]">
              <div className="bg-[linear-gradient(135deg,#15803d_0%,#22c55e_55%,#86efac_100%)] px-6 py-10 text-white md:px-10 md:py-14">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/35 bg-white/14 shadow-[0_16px_40px_rgba(255,255,255,0.18)] md:h-24 md:w-24">
                    <CheckCheck className="h-10 w-10 md:h-12 md:w-12" />
                  </div>
                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/82">Pago confirmado</p>
                  <h2 className="mt-4 font-display text-4xl tracking-[-0.06em] md:text-6xl">Gracias por tu compra</h2>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/88 md:text-base md:leading-8">
                    Tu pago ya fue acreditado y el pedido quedó guardado en tu cuenta para que puedas seguir cada etapa del proceso.
                  </p>
                </div>
              </div>

              <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-center">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Redirección automática</p>
                  <h3 className="mt-3 font-display text-3xl tracking-[-0.05em] text-black md:text-4xl">
                    Te vamos a llevar a tu panel de control para ver el estado de tu pedido en {redirectCountdown}.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-black/62 md:text-base md:leading-8">
                    Ahí vas a poder revisar la compra, confirmar que el pago quedó acreditado y seguir el avance del envío.
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

                <div className="rounded-[30px] border border-emerald-100 bg-[#f6fff7] p-6 shadow-[0_16px_50px_rgba(17,24,39,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Resumen de compra</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-black/44">Estado</p>
                      <p className="mt-1 text-lg font-semibold text-black">Pago acreditado</p>
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
                    <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-900">
                      {state.message}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
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
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4">
          <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-black/8 bg-white/88 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-black/8 bg-[#f7f7f4]">
              <div className="absolute inset-y-0 left-0 w-1/2 animate-[pulse_1.4s_ease-in-out_infinite] bg-black/6" />
              <LoaderCircle className="relative z-10 m-auto mt-[7px] h-4 w-4 animate-spin text-black/70" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/42">Procesando compra</p>
              <p className="mt-1 text-sm text-black/66">Guardando tu pedido y preparando tu cuenta.</p>
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
            <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] text-black md:text-5xl">Despacho rápido y seguimiento claro de tu pedido</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62 md:text-base md:leading-8">
              Comprando antes de las 17 hs, el pedido sale en el día. Si entra después de ese horario, se despacha al día siguiente.
              Contamos con una logística muy ágil, lo que nos permite preparar compras rápido y sostener envíos inmediatos a todo el país.
              Además, una vez realizada la compra, vas a poder seguir el estado del pedido y del envío desde tu cuenta.
            </p>
            {state.status !== 'idle' ? (
              <div
                className={`mt-6 rounded-[24px] px-5 py-4 text-sm ${
                  state.status === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
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
            <h2 className="font-display text-3xl tracking-[-0.05em]">Datos del cliente</h2>
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
                      placeholder="223"
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
                        placeholder="6355537"
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
                      onChange={(event) => updateField('streetNumber', event.target.value.replace(/[^\dA-Za-z/-]/g, '').slice(0, 10))}
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

              <input
                ref={postalCodeRef}
                value={form.postalCode}
                onChange={(event) => updateField('postalCode', event.target.value)}
                placeholder="Código postal"
                className="rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
              />
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
            <h2 className="font-display text-3xl tracking-[-0.05em]">Entrega y pago</h2>
            <div className="mt-5 rounded-[22px] border border-black/8 bg-[#fafaf8] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-black/46">
                {shippingPreview.isBariloche ? 'Bariloche detectado' : 'Resto del país'}
              </p>
              <div className="mt-3">
                {shippingPreview.isBariloche ? (
                  <BarilocheDeliveryCountdown variant="block" showStatusBadge />
                ) : (
                  <>
                    <span className="inline-flex rounded-full bg-black/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72">
                      Entrega nacional activa
                    </span>
                    <p className="mt-3 text-sm text-black/58">Despacho nacional listo para integrar con Andreani.</p>
                  </>
                )}
              </div>
              {shippingPreview.isBariloche ? (
                <div className="mt-3 space-y-2">
                  <p
                    className={`text-sm ${
                      shippingPreview.shippingAmount === 0 ? 'font-medium text-emerald-700' : 'font-medium text-red-700'
                    }`}
                  >
                    {shippingPreview.shippingAmount === 0
                      ? `Tu compra supera ${formatPrice(settings.localDeliveryFreeThreshold)} y accede al envío en el día en Bariloche.`
                      : `Tu compra no supera ${formatPrice(settings.localDeliveryFreeThreshold)}. Tiene que superar ese monto para obtener el envío en el día en Bariloche.`}
                  </p>
                  {shippingPreview.discountAmount > 0 ? (
                    <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                      Descuento Bariloche activo: {shippingPreview.discountPercent}% menos sobre productos en esta compra.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-black/58">
                    Comprando antes de las 17 hs despachamos en el día. Si la compra entra después, sale al día siguiente.
                  </p>
                  {shippingPreview.shippingAmount === 0 ? (
                    <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      Envío nacional gratis por superar {formatPrice(settings.localDeliveryFreeThreshold)}.
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <label
                className={`group cursor-pointer rounded-[24px] border px-4 py-4 text-sm transition ${
                  paymentMethod === 'ONLINE'
                    ? 'border-black bg-[#f7f7f4] shadow-[0_12px_28px_rgba(0,0,0,0.06)]'
                    : 'border-black/10 bg-white hover:border-black/20 hover:bg-[#fafaf7]'
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
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/42">Recomendado</span>
                    </div>
                    <p className="text-sm font-semibold tracking-normal text-black/84">Pagar con Mercado Pago</p>
                    <p className="mt-1 text-xs tracking-normal text-black/56">Checkout seguro para tarjeta, saldo o dinero en cuenta.</p>
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
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-black/52">
                    {item.colorName} · {item.size} · x{item.quantity}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 text-sm text-black/62">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {shippingPreview.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento Bariloche ({shippingPreview.discountPercent}%)</span>
                <span>-{formatPrice(shippingPreview.discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>{shippingPreview.isBariloche ? 'Envío Bariloche' : 'Envío nacional'}</span>
              <span className={shippingPreview.shippingAmount === 0 ? 'font-semibold text-emerald-700' : ''}>
                {shippingPreview.shippingAmount === 0 ? 'Envío gratis' : formatPrice(shippingPreview.shippingAmount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-4 text-base font-semibold text-black">
              <span>Total</span>
              <span>{formatPrice(shippingPreview.total)}</span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-red-700">
            Donamos el 5% de tu compra a refugios para mascotas en toda Argentina.
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
              {state.status === 'saving' ? 'Cargando Mercado Pago…' : 'Pagar con Mercado Pago'}
            </span>
          </button>
        </aside>
      </form>
    </div>
  )
}
