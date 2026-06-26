import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initColorScheme } from './lib/colorScheme'
import './index.css'

initColorScheme()

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

createRoot(rootEl).render(<App />)
