import { useId } from 'react'

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  if (!HEX_PATTERN.test(trimmed)) return null
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return trimmed.toLowerCase()
}

function hexForColorInput(value: string): string {
  const normalized = normalizeHex(value)
  return normalized ?? '#2563eb'
}

type ColorPickerFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function ColorPickerField({ value, onChange, label = 'Primary color' }: ColorPickerFieldProps) {
  const inputId = useId()

  return (
    <div className="block space-y-2">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="color"
        value={hexForColorInput(value)}
        onChange={(e) => onChange(e.target.value)}
        className="block h-10 w-12 cursor-pointer rounded-md border border-slate-300 bg-white p-1"
        aria-label={`${label} picker`}
      />
      <details className="group">
        <summary className="cursor-pointer list-none text-sm text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700 [&::-webkit-details-marker]:hidden">
          Enter hex code manually
        </summary>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const normalized = normalizeHex(value)
            if (normalized) onChange(normalized)
          }}
          placeholder="#2563eb"
          className="mt-2 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
          aria-label={`${label} hex code`}
        />
      </details>
    </div>
  )
}
