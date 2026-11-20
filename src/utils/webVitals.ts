import type { MetricWithAttribution } from 'web-vitals/attribution'

/*
 * Đo hiệu năng (đề xuất 9) — chỉ ghi ra console, KHÔNG gửi đi đâu.
 *
 * Bật:
 *   - `npm run dev`: luôn bật.
 *   - Bản build: mở link có `?vitals=1` một lần (nhớ trong localStorage của máy đó),
 *     `?vitals=0` để tắt. Không bật thì không tải thư viện, không gắn listener nào.
 *
 * Đo 2 loại:
 *   1. Core Web Vitals của trình duyệt (thư viện web-vitals, bản attribution):
 *      TTFB, FCP, LCP (chỉ lần tải trang đầu), INP, CLS (cả phiên, theo trang đang mở).
 *   2. "Trang sẵn sàng" (READY:<tên>): từ lúc mở trang tới lúc dữ liệu chính hiện ra
 *      (usePageReadyMetric). Mở thẳng link / F5: tính từ lúc trình duyệt bắt đầu tải
 *      (gồm cả tải JS); chuyển trang trong app: tính từ lúc đổi đường dẫn.
 *
 * Xem lại: gõ `__vitals.table()` trong console (giá trị mới nhất theo chỉ số × trang).
 */

const STORAGE_KEY = 'debug:vitals'
const MAX_ENTRIES = 300

// Ngưỡng "trang sẵn sàng" (quy ước nội bộ, không phải chuẩn Google)
const READY_GOOD_MS = 1000
const READY_POOR_MS = 2500

export type VitalRating = 'good' | 'needs-improvement' | 'poor'

export interface VitalEntry {
  /** LCP / INP / CLS / FCP / TTFB / READY:<tên trang> */
  name: string
  /** ms (CLS: không đơn vị) */
  value: number
  rating: VitalRating
  /** Trang lúc ghi nhận */
  path: string
  /** Phần tử gây ra (LCP / INP / CLS), hoặc cold / nav cho READY */
  detail?: string
  at: number
}

const entries: VitalEntry[] = []

function readEnabled(): boolean {
  try {
    const flag = new URLSearchParams(window.location.search).get('vitals')

    if (flag === '1') localStorage.setItem(STORAGE_KEY, '1')
    if (flag === '0') localStorage.removeItem(STORAGE_KEY)

    return import.meta.env.DEV || localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return import.meta.env.DEV
  }
}

const enabled = typeof window !== 'undefined' && readEnabled()

export function isVitalsEnabled(): boolean {
  return enabled
}

// =========================================================
// GHI / IN
// =========================================================

const RATING_STYLE: Record<VitalRating, string> = {
  good: 'color:#0f9d58;font-weight:700',
  'needs-improvement': 'color:#e37400;font-weight:700',
  poor: 'color:#d93025;font-weight:700',
}

const formatValue = (name: string, value: number) => (name === 'CLS'
  ? value.toFixed(3)
  : value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`)

// Giá trị đã in gần nhất theo chỉ số × trang. reportAllChanges báo cả những thay đổi
// rất nhỏ (vd CLS 0.0001 mỗi lần thanh tiến trình chạy): cùng giá trị sau khi làm tròn thì không in lại
const lastShown = new Map<string, string>()

function record(entry: VitalEntry) {
  const key = `${entry.name}|${entry.path}`
  const shown = formatValue(entry.name, entry.value)

  // READY: mỗi lần mở trang là một lần đo riêng, luôn in
  if (!entry.name.startsWith('READY:')) {
    if (lastShown.get(key) === shown) return
    lastShown.set(key, shown)
  }

  entries.push(entry)
  if (entries.length > MAX_ENTRIES) entries.shift()

  console.info(
    `%c[vitals]%c ${entry.name} %c${formatValue(entry.name, entry.value)} (${entry.rating})%c ${entry.path}${entry.detail ? ` · ${entry.detail}` : ''}`,
    'color:#64748b',
    'color:inherit;font-weight:700',
    RATING_STYLE[entry.rating],
    'color:#64748b',
  )
}

/** Giá trị mới nhất của từng chỉ số × trang */
function latestTable() {
  const latest = new Map<string, VitalEntry>()

  for (const entry of entries) latest.set(`${entry.name}|${entry.path}`, entry)

  return [...latest.values()]
    .sort((a, b) => a.path.localeCompare(b.path) || a.name.localeCompare(b.name))
    .map((entry) => ({
      metric: entry.name,
      page: entry.path,
      value: formatValue(entry.name, entry.value),
      rating: entry.rating,
      detail: entry.detail ?? '',
    }))
}

// =========================================================
// "TRANG SẴN SÀNG"
// =========================================================

// Lần đổi trang gần nhất. Lúc mở app: at = 0 (gốc thời gian = lúc trình duyệt bắt đầu tải)
let navStart = {
  path: typeof window === 'undefined' ? '' : window.location.pathname,
  at: 0,
}

// (tên + lần đổi trang) đã ghi: mỗi trang chỉ ghi 1 lần cho mỗi lần mở
const reported = new Set<string>()

/** Gọi khi đường dẫn đổi; đổi query / hash (bộ lọc trên URL) không tính */
export function markNavigation(path: string) {
  if (!enabled || path === navStart.path) return

  navStart = { path, at: performance.now() }
}

/** Ghi "trang sẵn sàng" sau lần vẽ kế tiếp (dữ liệu đã thật sự hiện ra) */
export function reportPageReady(name: string, path: string) {
  if (!enabled) return

  requestAnimationFrame(() => {
    window.setTimeout(() => {
      // đã sang trang khác trước khi kịp hiện: bỏ
      if (path !== navStart.path) return

      const key = `${name}@${navStart.at}`
      if (reported.has(key)) return
      reported.add(key)

      const end = performance.now()
      const value = end - navStart.at
      const cold = navStart.at === 0

      try {
        // hiện trong tab Performance của DevTools
        performance.measure(`READY:${name}`, { start: navStart.at, end })
      } catch {
        // trình duyệt cũ: bỏ qua
      }

      record({
        name: `READY:${name}`,
        value,
        rating: value <= READY_GOOD_MS ? 'good' : value <= READY_POOR_MS ? 'needs-improvement' : 'poor',
        path,
        detail: cold ? 'cold (mở link / F5)' : 'nav (chuyển trang trong app)',
        at: end,
      })
    }, 0)
  })
}

// =========================================================
// CORE WEB VITALS
// =========================================================

// Phần tử vừa được bấm / gõ. Dự phòng cho INP: thao tác làm phần tử bị gỡ khỏi DOM
// (đóng menu, đổi tab…) thì thư viện không còn lấy được selector
let lastInputTarget: string | undefined

function describeElement(el: Element): string {
  const label = el.getAttribute('aria-label') || (el.textContent ?? '').trim().slice(0, 40)
  const cls = [...el.classList].find((c) => !c.startsWith('css-')) ?? ''

  return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${label ? ` "${label}"` : ''}`
}

function trackInputTarget(event: Event) {
  const el = event.target instanceof Element
    ? event.target.closest('button, a, [role="button"], [role="tab"], [role="option"], [role="menuitem"], input, select, textarea, label') ?? event.target
    : null

  if (el) lastInputTarget = describeElement(el)
}

type InpAttribution = Extract<MetricWithAttribution, { name: 'INP' }>['attribution']

/**
 * INP: phần tử + thời gian từng pha, để biết chậm vì đâu:
 *   chờ   (input delay)      – luồng chính đang bận việc khác lúc bấm
 *   xử lý (processing)       – code của handler (setState, tính toán)
 *   vẽ    (presentation)     – React render + layout + paint sau handler
 * kèm script chạy lâu nhất (nếu trình duyệt có Long Animation Frames).
 */
function inpDetail(a: InpAttribution): string | undefined {
  const target = a.interactionTarget || (lastInputTarget ? `${lastInputTarget} (đã gỡ khỏi DOM)` : '')
  const phases = `chờ ${Math.round(a.inputDelay)} · xử lý ${Math.round(a.processingDuration)} · vẽ ${Math.round(a.presentationDelay)} ms`
  const script = a.longestScript
    ? `script lâu nhất ${Math.round(a.longestScript.intersectingDuration)} ms: ${[
      a.longestScript.entry.invoker,
      a.longestScript.entry.sourceFunctionName,
      a.longestScript.entry.sourceURL?.split('/').pop(),
    ].filter(Boolean).join(' ')}`
    : ''

  return [a.interactionType, target, `(${phases})`, script].filter(Boolean).join(' ')
}

function attributionDetail(metric: MetricWithAttribution): string | undefined {
  switch (metric.name) {
    case 'LCP': return metric.attribution.target
    case 'INP': return inpDetail(metric.attribution)
    case 'CLS': return metric.attribution.largestShiftTarget
    default: return undefined
  }
}

function onMetric(metric: MetricWithAttribution) {
  record({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    path: window.location.pathname,
    detail: attributionDetail(metric),
    at: performance.now(),
  })
}

/** Gọi 1 lần lúc khởi động (main.tsx) */
export function startWebVitals() {
  if (!enabled) return

  // Đổi trang: Navigation API (Chrome / Edge) báo ngay lúc bấm, trước cả khi chunk
  // của trang lazy tải xong. Trình duyệt khác: MainLayout gọi markNavigation.
  const navigation = (window as Window & {
    navigation?: EventTarget
  }).navigation

  navigation?.addEventListener('navigate', (event) => {
    const destination = (event as Event & { destination?: { url?: string } }).destination

    if (destination?.url) markNavigation(new URL(destination.url).pathname)
  })

  // nhớ phần tử vừa thao tác (capture: chạy trước mọi handler, kể cả khi handler gỡ phần tử)
  for (const type of ['pointerdown', 'keydown'] as const) {
    window.addEventListener(type, trackInputTarget, { capture: true, passive: true })
  }

  Object.assign(window, {
    __vitals: {
      entries,
      table: () => console.table(latestTable()),
    },
  })

  // Tải thư viện lúc rảnh: không giành băng thông với trang. Các chỉ số dùng
  // buffered PerformanceObserver nên đăng ký muộn vẫn đo đúng từ đầu.
  const load = () => {
    void import('web-vitals/attribution').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      const opts = { reportAllChanges: true }

      onTTFB(onMetric, opts)
      onFCP(onMetric, opts)
      onLCP(onMetric, opts)
      onINP(onMetric, opts)
      onCLS(onMetric, opts)
    }).catch((error: unknown) => {
      console.warn('[vitals] không tải được web-vitals', error)
    })
  }

  const idle = () => (window.requestIdleCallback
    ? window.requestIdleCallback(load, { timeout: 3000 })
    : window.setTimeout(load, 1000))

  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}
