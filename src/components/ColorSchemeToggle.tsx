import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useColorScheme } from '../context/ColorSchemeContext'

type ColorSchemeToggleProps = {
  className?: string
}

export function ColorSchemeToggle({ className = '' }: ColorSchemeToggleProps) {
  const { colorScheme, toggleColorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <button
      type="button"
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md opacity-80 transition-[opacity,background-color] hover:bg-[color-mix(in_srgb,var(--tenant-surface-text)_14%,transparent)] hover:opacity-100 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleColorScheme}
    >
      <FontAwesomeIcon
        icon={isDark ? faSun : faMoon}
        className="h-4 w-4"
        aria-hidden="true"
      />
    </button>
  )
}
