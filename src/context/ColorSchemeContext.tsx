import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
  getStoredColorScheme,
  getSystemColorScheme,
  persistColorScheme,
  resolveColorScheme,
  type ColorScheme,
} from '../lib/colorScheme'

type ColorSchemeContextValue = {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null)

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(resolveColorScheme)

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    persistColorScheme(scheme)
    applyColorScheme(scheme)
    setColorSchemeState(scheme)
  }, [])

  const toggleColorScheme = useCallback(() => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
  }, [colorScheme, setColorScheme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (getStoredColorScheme() != null) return
      const scheme = getSystemColorScheme()
      applyColorScheme(scheme)
      setColorSchemeState(scheme)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== COLOR_SCHEME_STORAGE_KEY) return
      const scheme = resolveColorScheme()
      applyColorScheme(scheme)
      setColorSchemeState(scheme)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(
    () => ({ colorScheme, setColorScheme, toggleColorScheme }),
    [colorScheme, setColorScheme, toggleColorScheme],
  )

  return <ColorSchemeContext.Provider value={value}>{children}</ColorSchemeContext.Provider>
}

export function useColorScheme() {
  const ctx = useContext(ColorSchemeContext)
  if (!ctx) {
    throw new Error('useColorScheme must be used within ColorSchemeProvider')
  }
  return ctx
}
