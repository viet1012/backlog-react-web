import type {
  FitRecipe,
  FitView,
  RawBox,
} from '../types/machineLocator'
import {
  fitView,
  writeInkMasks,
  type InkMasks,
} from './machineLocatorFit'

// =========================================================
// WORKER: giữ mặt nạ nét của 1 ảnh layout, ôm khung theo công thức
// =========================================================

export interface FitJob {
  recipe: FitRecipe
  crop: number[]
  ppp: number
  // ô chữ mã máy quanh khung (pt)
  labels: RawBox[]
}

export type FitWorkerRequest =
  | { t: 'init', bitmap: ImageBitmap }
  | ({ t: 'fit', id: number } & FitJob)

export type FitWorkerResponse =
  | { t: 'ready', w: number, h: number }
  | { t: 'error', message: string }
  | { t: 'fit', id: number, view: FitView | null, ms: number, error?: string }

// tsconfig chỉ có lib DOM: khai báo phần scope worker cần dùng
const scope = self as unknown as {
  onmessage: ((e: MessageEvent<FitWorkerRequest>) => void) | null
  postMessage: (m: FitWorkerResponse) => void
}

// đọc ảnh theo dải để không giữ cả ImageData RGBA của ảnh lớn
const STRIP_ROWS = 256

let masks: InkMasks | null = null

function buildMasks(bitmap: ImageBitmap): InkMasks {
  const { width: w, height: h } = bitmap
  const canvas = new OffscreenCanvas(w, h)
  const g = canvas.getContext('2d', { willReadFrequently: true })

  if (!g) throw new Error('Trình duyệt không hỗ trợ OffscreenCanvas 2D.')

  // nền trắng: điểm trong suốt không bị coi là nét đen
  g.fillStyle = '#fff'
  g.fillRect(0, 0, w, h)
  g.drawImage(bitmap, 0, 0)
  bitmap.close()

  const out: InkMasks = { w, h, ink160: new Uint8Array(w * h), ink215: new Uint8Array(w * h) }

  for (let y = 0; y < h; y += STRIP_ROWS) {
    const rows = Math.min(STRIP_ROWS, h - y)

    writeInkMasks(g.getImageData(0, y, w, rows).data, out, y * w)
  }

  return out
}

scope.onmessage = (e) => {
  const m = e.data

  if (m.t === 'init') {
    try {
      masks = buildMasks(m.bitmap)
      scope.postMessage({ t: 'ready', w: masks.w, h: masks.h })
    } catch (err) {
      scope.postMessage({ t: 'error', message: err instanceof Error ? err.message : String(err) })
    }
    return
  }

  if (!masks) {
    scope.postMessage({ t: 'fit', id: m.id, view: null, ms: 0, error: 'Chưa có ảnh layout.' })
    return
  }

  const t0 = performance.now()

  try {
    const view = fitView(masks, m.recipe, m.crop, m.ppp, m.labels)

    scope.postMessage({ t: 'fit', id: m.id, view, ms: performance.now() - t0 })
  } catch (err) {
    scope.postMessage({
      t: 'fit',
      id: m.id,
      view: null,
      ms: performance.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
