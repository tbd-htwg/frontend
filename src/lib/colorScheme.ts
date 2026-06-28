export type ColorScheme = 'light' | 'dark'

export const COLOR_SCHEME_STORAGE_KEY = 'trip-planner-color-scheme'

export function getStoredColorScheme(): ColorScheme | null {
  try {
    const value = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    /* private browsing / blocked storage */
  }
  return null
}

export function getSystemColorScheme(): ColorScheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveColorScheme(): ColorScheme {
  return getStoredColorScheme() ?? getSystemColorScheme()
}

export function applyColorScheme(scheme: ColorScheme) {
  document.documentElement.setAttribute('data-color-scheme', scheme)
  document.documentElement.style.colorScheme = scheme
}

export function persistColorScheme(scheme: ColorScheme) {
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme)
  } catch {
    /* ignore */
  }
}

/** Call before React mounts to avoid a flash of the wrong theme. */
export function initColorScheme() {
  applyColorScheme(resolveColorScheme())
}
