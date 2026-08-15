'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

type SearchableSelectProps = {
  label: string
  options: string[]
  value: string
  placeholder: string
  searchable?: boolean
  disabled?: boolean
  emptyMessage?: string
  onChange: (value: string) => void
}

function normalizeValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export function SearchableSelect({
  label,
  options,
  value,
  placeholder,
  searchable = true,
  disabled = false,
  emptyMessage = 'No encontramos opciones.',
  onChange,
}: SearchableSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery(value)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  const filteredOptions = useMemo(() => {
    if (!searchable) {
      return options
    }

    const normalizedQuery = normalizeValue(query)
    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) => normalizeValue(option).includes(normalizedQuery))
  }, [options, query])

  return (
    <div ref={wrapperRef} className="relative">
      <span className="sr-only">{label}</span>
      <input
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        autoComplete="username"
        value=""
        onChange={() => {}}
      />
      <input
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        autoComplete="new-password"
        type="password"
        value=""
        onChange={() => {}}
      />
      {searchable ? (
        <input
          value={open ? query : value}
          placeholder={placeholder}
          disabled={disabled}
          name={`selector-${inputId.replace(/:/g, '')}`}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          data-protonpass-ignore="true"
          onFocus={() => {
            if (!disabled) {
              setQuery(value)
              setOpen(true)
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              const exactMatch = options.find((option) => normalizeValue(option) === normalizeValue(query))
              if (exactMatch) {
                onChange(exactMatch)
                setQuery(exactMatch)
                setOpen(false)
              }
            }
            if (event.key === 'Escape') {
              setOpen(false)
            }
          }}
          className="w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 pr-10 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-55"
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (!disabled) {
              setOpen((current) => !current)
            }
          }}
          className="w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 pr-10 text-left text-sm outline-none disabled:cursor-not-allowed disabled:opacity-55"
        >
          <span className={value ? 'text-black' : 'text-black/46'}>{value || placeholder}</span>
        </button>
      )}
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/34" />

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] max-h-64 overflow-y-auto rounded-[20px] border border-black/10 bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option)
                  setQuery(option)
                  setOpen(false)
                }}
                className={`block w-full rounded-[14px] px-3 py-3 text-left text-sm transition ${
                  value === option ? 'bg-black text-white' : 'text-black/74 hover:bg-[#f6f6f3]'
                }`}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-black/48">{emptyMessage}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
