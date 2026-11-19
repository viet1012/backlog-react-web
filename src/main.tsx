import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted Inter (variable weight, all subsets incl. Vietnamese; the
// browser only downloads the subsets a page actually uses)
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nProvider'
import { preloadRoute } from './pages/lazyPages'
import { getDefaultAuthRoute } from './services/authService'

// F5 / mở thẳng link: tải ngay chunk của trang đang mở (trang chủ: cả three.js + font)
// song song với lúc React khởi động, thay vì tải tuần tự chunk trang -> chunk 3D -> font.
// Vào gốc "/" (mở project) thì sẽ bị chuyển sang trang mặc định (thường là /user-home): tải trang đó
const bootPath = window.location.pathname.replace(/(.)\/+$/, '$1')
preloadRoute(bootPath === '/' ? getDefaultAuthRoute() : bootPath)

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
