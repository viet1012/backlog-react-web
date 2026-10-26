import type {
  FitRecipe,
  FitView,
  Polygon,
  RawBox,
} from '../types/machineLocator'
import {
  fitView,
  snapToInk,
  tidyOutline,
  writeGray,
  type FitTiming,
  type GrayImage,
} from './machineLocatorFit'

// =========================================================
// WORKER: giữ ảnh xám (độ phân giải gốc) của 1 layout, ôm khung theo công thức
// =========================================================

export interface FitJob {
  recipe: FitRecipe
  crop: number[]
  ppp: number
  // ô chữ mã máy quanh khung (pt)
  labels: RawBox[]
}

export interface SnapJob {
  // điểm cần bắt dính (pt)
  pt: [number, number]
  crop: number[]
  ppp: number
}

export interface TidyJob {
  // đường bao hiện tại (pt)
  polys: Polygon[]
  crop: number[]
  ppp: number
  // "Mức gọn" 1–5
  level: number
}

export type FitWorkerTask =
  | ({ t: 'fit' } & FitJob)
  | ({ t: 'snap' } & SnapJob)
  | ({ t: 'tidy' } & TidyJob)

export type FitWorkerRequest =
  | { t: 'init', bitmap: ImageBitmap }
  | (FitWorkerTask & { id: number })

export type FitWorkerResponse =
  | { t: 'ready', w: number, h: number }
  | { t: 'error', message: string }
  | {
    t: 'done'
    id: number
    view?: FitView
    pt?: [number, number] | null
    polys?: Polygon[]
    ms: number
    error?: string
  }

// tsconfig chỉ có lib DOM: khai báo phần scope worker cần dùng
const scope = self as unknown as {
  onmessage: ((e: MessageEvent<FitWorkerRequest>) => void) | null
  postMessage: (m: FitWorkerResponse) => void
}

// đọc ảnh theo dải để không giữ cả ImageData RGBA của ảnh lớn
const STRIP_ROWS = 256

let img: GrayImage | null = null

function buildGray(bitmap: ImageBitmap): GrayImage {
  const { width: w, height: h } = bitmap
  const canvas = new OffscreenCanvas(w, h)
  const g = canvas.getContext('2d', { willReadFrequently: true })

  if (!g) throw new Error('Trình duyệt không hỗ trợ OffscreenCanvas 2D.')

  // nền trắng: điểm trong suốt không bị coi là nét đen
  g.fillStyle = '#fff'
  g.fillRect(0, 0, w, h)
  g.drawImage(bitmap, 0, 0)
  bitmap.close()

  const out: GrayImage = { w, h, gray: new Uint8Array(w * h) }

  for (let y = 0; y < h; y += STRIP_ROWS) {
    const rows = Math.min(STRIP_ROWS, h - y)

    writeGray(g.getImageData(0, y, w, rows).data, out, y * w)
  }

  return out
}

scope.onmessage = (e) => {
  const m = e.data

  if (m.t === 'init') {
    try {
      img = buildGray(m.bitmap)
      scope.postMessage({ t: 'ready', w: img.w, h: img.h })
    } catch (err) {
      scope.postMessage({ t: 'error', message: err instanceof Error ? err.message : String(err) })
    }
    return
  }

  if (!img) {
    scope.postMessage({ t: 'done', id: m.id, ms: 0, error: 'Chưa có ảnh layout.' })
    return
  }

  const t0 = performance.now()

  try {
    if (m.t === 'fit') {
      const timing = {} as FitTiming
      const view = fitView(img, m.recipe, m.crop, m.ppp, m.labels, timing)
      const f = (v: number | undefined) => (v ?? 0).toFixed(1)

      // debug: thời gian từng bước (bật mức Verbose trong DevTools để xem)
      console.debug(
        `[machine-locator fit] ${f(timing.total)} ms · vùng ${timing.px ?? 0} px`
        + `${timing.downscaled ? ' (viền kín trên ảnh 1/2)' : ''}`
        + ` · nét ${f(timing.ink)} · sát/gọn ${f(timing.tight)} · viền kín ${f(timing.closed)}`,
      )
      scope.postMessage({ t: 'done', id: m.id, view, ms: performance.now() - t0 })
    } else if (m.t === 'tidy') {
      const polys = tidyOutline(img, m.polys, m.crop, m.ppp, m.level)

      scope.postMessage({ t: 'done', id: m.id, polys, ms: performance.now() - t0 })
    } else {
      scope.postMessage({ t: 'done', id: m.id, pt: snapToInk(img, m.pt, m.crop, m.ppp), ms: performance.now() - t0 })
    }
  } catch (err) {
    scope.postMessage({
      t: 'done',
      id: m.id,
      ms: performance.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
