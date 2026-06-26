const HEX_PATTERN = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim()
  const match = HEX_PATTERN.exec(trimmed)
  if (!match) return null
  let hex = match[1]
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('')
  }
  return `#${hex.toLowerCase()}`
}

type Rgb = { r: number; g: number; b: number }

function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHexColor(hex)
  if (!normalized) return null
  const raw = normalized.slice(1)
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  }
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const s = value / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Returns #ffffff or #0f172a for readable text on a solid primary surface. */
export function contrastingTextColor(backgroundHex: string): string {
  const rgb = hexToRgb(backgroundHex)
  if (!rgb) return '#ffffff'
  return relativeLuminance(rgb) > 0.45 ? '#0f172a' : '#ffffff'
}

/** Whether the header chrome uses light-colored text (matches index.css tenant tokens). */
export function headerUsesLightText(
  primaryColor: string | null | undefined,
  colorScheme: 'light' | 'dark',
): boolean {
  if (colorScheme === 'dark') {
    return true
  }
  const normalized = primaryColor ? normalizeHexColor(primaryColor) : null
  if (normalized) {
    return contrastingTextColor(normalized) === '#ffffff'
  }
  return false
}

export function shouldInvertHeaderIcon(
  invertWhenLightHeader: boolean,
  primaryColor: string | null | undefined,
  colorScheme: 'light' | 'dark',
): boolean {
  return invertWhenLightHeader && headerUsesLightText(primaryColor, colorScheme)
}

/** Header chrome background for a tenant preview (mirrors index.css tenant tokens). */
export function tenantHeaderChromeBackground(
  primaryColor: string | null | undefined,
  colorScheme: 'light' | 'dark',
): string {
  const normalized = primaryColor ? normalizeHexColor(primaryColor) : null
  if (colorScheme === 'dark') {
    if (normalized) {
      return `color-mix(in srgb, ${normalized} 44%, #020617)`
    }
    return '#1e293b'
  }
  if (normalized) return normalized
  return '#ffffff'
}

/** Header chrome text for a tenant preview (mirrors index.css tenant tokens). */
export function tenantHeaderChromeText(
  primaryColor: string | null | undefined,
  colorScheme: 'light' | 'dark',
): string {
  if (colorScheme === 'dark') {
    return '#f8fafc'
  }
  const normalized = primaryColor ? normalizeHexColor(primaryColor) : null
  if (normalized) {
    return contrastingTextColor(normalized)
  }
  return '#0f172a'
}

/** Page-tint background for the branding overview preview body. */
export function tenantPreviewBodyBackground(
  primaryColor: string | null | undefined,
  colorScheme: 'light' | 'dark',
): string {
  const normalized = primaryColor ? normalizeHexColor(primaryColor) : null
  if (!normalized) {
    return colorScheme === 'dark' ? '#1e293b' : '#ffffff'
  }
  if (colorScheme === 'dark') {
    return `color-mix(in srgb, ${normalized} 18%, #020617)`
  }
  return `color-mix(in srgb, ${normalized} 12%, #f8fafc)`
}

/** Apply tenant palette CSS variables on :root (light + dark via CSS). */
export function applyTenantTheme(primaryColor: string | null | undefined): void {
  const root = document.documentElement
  const normalized = primaryColor ? normalizeHexColor(primaryColor) : null

  if (!normalized) {
    root.removeAttribute('data-tenant-themed')
    root.style.removeProperty('--tenant-primary')
    root.style.removeProperty('--tenant-on-primary')
    return
  }

  root.setAttribute('data-tenant-themed', 'true')
  root.style.setProperty('--tenant-primary', normalized)
  root.style.setProperty('--tenant-on-primary', contrastingTextColor(normalized))
}
