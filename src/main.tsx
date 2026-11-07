import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nProvider'

// Pages are separate chunks: after a redeploy, a tab opened earlier asks for
// chunk names that no longer exist. Reload to pick up the new build, at most
// once per 10s so a server that is really down does not loop.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const lastReload = Number(sessionStorage.getItem('chunkReloadAt') ?? 0)
    if (Date.now() - lastReload < 10_000) return
    sessionStorage.setItem('chunkReloadAt', String(Date.now()))
  } catch {
    return
  }

  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
