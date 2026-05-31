'use client'

import { LoaderCircle, LocateFixed, MapPinned, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type AddressPinPickerProps = {
  address: string
  city: string
  province: string
  latitude: string
  longitude: string
  pinLabel: string
  onChange: (next: { latitude?: string; longitude?: string; pinLabel?: string }) => void
}

type GeocodeResult = {
  display_name: string
  lat: string
  lon: string
}

type ReverseGeocodeResult = {
  display_name?: string
}

const DEFAULT_CENTER = {
  lat: -41.1335,
  lng: -71.3103,
}

function normalizeCoordinate(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildPinIcon(leaflet: typeof import('leaflet')) {
  return leaflet.divIcon({
    className: 'address-pin-marker',
    html: `
      <div style="position:relative;width:26px;height:26px;">
        <span style="position:absolute;inset:0;border-radius:999px;background:#73c339;border:3px solid white;box-shadow:0 8px 18px rgba(0,0,0,0.22);"></span>
        <span style="position:absolute;left:50%;bottom:-9px;width:2px;height:12px;background:#73c339;transform:translateX(-50%);border-radius:999px;"></span>
      </div>
    `,
    iconSize: [26, 38],
    iconAnchor: [13, 34],
  })
}

export function AddressPinPicker({
  address,
  city,
  province,
  latitude,
  longitude,
  pinLabel,
  onChange,
}: AddressPinPickerProps) {
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const query = useMemo(() => [address, city, province, 'Argentina'].filter(Boolean).join(', '), [address, city, province])
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const autoSearchedQueryRef = useRef('')
  const mountedRef = useRef(true)
  const currentLat = normalizeCoordinate(latitude)
  const currentLng = normalizeCoordinate(longitude)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      markerRef.current?.remove()
      mapInstanceRef.current?.remove()
      markerRef.current = null
      mapInstanceRef.current = null
    }
  }, [])

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        return ''
      }

      const data = (await response.json()) as ReverseGeocodeResult
      return data.display_name ?? ''
    } catch {
      return ''
    }
  }, [])

  const updatePin = useCallback(async (lat: number, lng: number, label?: string) => {
    const resolvedLabel = label || (await reverseGeocode(lat, lng)) || pinLabel || 'Ubicación ajustada manualmente'

    if (!mountedRef.current) {
      return
    }

    onChange({
      latitude: String(lat),
      longitude: String(lng),
      pinLabel: resolvedLabel,
    })

    setMessage('Pin ajustado manualmente sobre el mapa.')
  }, [onChange, pinLabel, reverseGeocode])

  useEffect(() => {
    let cancelled = false

    async function setupMap() {
      if (!mapElementRef.current || mapInstanceRef.current) {
        return
      }

      const leaflet = await import('leaflet')
      if (cancelled || !mapElementRef.current) {
        return
      }

      leafletRef.current = leaflet

      const map = leaflet.map(mapElementRef.current, {
        zoomControl: true,
      }).setView(
        [currentLat ?? DEFAULT_CENTER.lat, currentLng ?? DEFAULT_CENTER.lng],
        currentLat != null && currentLng != null ? 16 : 12,
      )

      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        })
        .addTo(map)

      window.requestAnimationFrame(() => {
        map.invalidateSize()
        window.setTimeout(() => map.invalidateSize(), 120)
      })

      map.on('click', async (event) => {
        const nextLat = event.latlng.lat
        const nextLng = event.latlng.lng

        if (markerRef.current) {
          markerRef.current.setLatLng(event.latlng)
        } else if (leafletRef.current) {
          const marker = leafletRef.current
            .marker(event.latlng, { draggable: true, icon: buildPinIcon(leafletRef.current) })
            .addTo(map)

          marker.on('dragend', async () => {
            const point = marker.getLatLng()
            await updatePin(point.lat, point.lng)
          })

          markerRef.current = marker
        }

        await updatePin(nextLat, nextLng)
      })

      mapInstanceRef.current = map

      if (currentLat != null && currentLng != null) {
        const marker = leaflet
          .marker([currentLat, currentLng], { draggable: true, icon: buildPinIcon(leaflet) })
          .addTo(map)

        marker.on('dragend', async () => {
          const point = marker.getLatLng()
          await updatePin(point.lat, point.lng)
        })

        markerRef.current = marker
      }
    }

    void setupMap()

    return () => {
      cancelled = true
    }
  }, [currentLat, currentLng, pinLabel, updatePin])

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current || currentLat == null || currentLng == null) {
      return
    }

    const nextLatLng = leafletRef.current.latLng(currentLat, currentLng)

    if (markerRef.current) {
      markerRef.current.setLatLng(nextLatLng)
    } else {
      const marker = leafletRef.current
        .marker(nextLatLng, { draggable: true, icon: buildPinIcon(leafletRef.current) })
        .addTo(mapInstanceRef.current)

      marker.on('dragend', async () => {
        const point = marker.getLatLng()
        await updatePin(point.lat, point.lng)
      })

      markerRef.current = marker
    }

    mapInstanceRef.current.setView(nextLatLng, Math.max(mapInstanceRef.current.getZoom(), 16))
    mapInstanceRef.current.invalidateSize()
  }, [currentLat, currentLng, updatePin])

  const searchPin = useCallback(async () => {
    if (!query.trim()) {
      setMessage('Completá dirección, ciudad y provincia para ubicar el domicilio.')
      return false
    }

    setLoading(true)
    setMessage('')
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ar&limit=5&q=${encodeURIComponent(query)}`
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })

      const data = (await response.json()) as GeocodeResult[]
      setResults(data)

      if (!data[0]) {
        setMessage('No encontramos esa dirección. Probá agregando altura, barrio o una referencia cercana.')
        return false
      }

      const first = data[0]
      await updatePin(Number(first.lat), Number(first.lon), first.display_name)
      setMessage('Revisá el pin y movelo si hace falta para dejarlo exacto.')
      return true
    } finally {
      setLoading(false)
    }
  }, [query, updatePin])

  useEffect(() => {
    if (query.trim().length < 10) {
      autoSearchedQueryRef.current = ''
      return
    }

    if (autoSearchedQueryRef.current === query) {
      return
    }

    const timeout = window.setTimeout(() => {
      autoSearchedQueryRef.current = query
      void searchPin()
    }, 450)

    return () => window.clearTimeout(timeout)
  }, [query, searchPin])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage('Tu navegador no permite geolocalización en este dispositivo.')
      return
    }

    setLoading(true)
    setMessage('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await updatePin(position.coords.latitude, position.coords.longitude, 'Ubicación detectada desde tu dispositivo')
        setLoading(false)
      },
      () => {
        setMessage('No pudimos obtener tu ubicación exacta. Podés mover el pin manualmente sobre el mapa.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  return (
    <div className="rounded-[24px] border border-black/8 bg-[#fafaf8] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-black/46">Verificación de domicilio</p>
          <p className="mt-2 text-sm text-black/62">
            Usá el pin para indicarnos dónde está tu domicilio. Revisalo y movelo si hace falta hasta dejarlo exacto.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={searchPin}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar dirección
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
          >
            <LocateFixed className="h-4 w-4" />
            Mi ubicación
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <div className="rounded-[18px] border border-black/10 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">
              Estado
            </p>
            {latitude && longitude ? (
              <>
                <p className="mt-2 text-sm font-medium text-black/82">Pin verificado</p>
                <p className="mt-2 text-sm leading-6 text-black/58">
                  {pinLabel || 'La ubicación quedó marcada para esta entrega.'}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-6 text-black/58">
                Completá la dirección y te marcamos el punto en el mapa para que lo confirmes.
              </p>
            )}
          </div>

          <div className="rounded-[18px] border border-black/10 bg-white px-4 py-4 text-sm leading-6 text-black/58">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">Cómo marcarlo</p>
            <p className="mt-2">1. Escribí tu dirección y te ubicamos el punto automáticamente.</p>
            <p>2. Tocá el mapa o arrastrá el pin verde hasta la entrada exacta de tu domicilio.</p>
            <p>3. Si hace falta, podés usar “Mi ubicación” como referencia y corregirlo a mano.</p>
          </div>

          {message ? (
            <div className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-3 text-sm text-black/60">
              {message}
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[22px] border border-black/8 bg-white">
          <div ref={mapElementRef} className="h-[320px] w-full" />
          {!latitude || !longitude ? (
            <div className="border-t border-black/8 px-4 py-3 text-xs text-black/46">
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4" />
                Hacé click en el mapa para fijar el pin exacto.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="mt-4 space-y-2">
          {results.map((result) => (
            <button
              key={`${result.lat}-${result.lon}`}
              type="button"
              onClick={() =>
                onChange({
                  latitude: result.lat,
                  longitude: result.lon,
                  pinLabel: result.display_name,
                })
              }
              className="block w-full rounded-[18px] border border-black/8 bg-white px-4 py-3 text-left text-sm text-black/66 transition hover:border-black/14 hover:bg-[#f7f7f4]"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
