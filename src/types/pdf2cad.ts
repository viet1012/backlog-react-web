// pdf2cad (PDF / scan → DXF 2D, vẽ lại từ mẫu tham số).
// Shape giữ giống API của server pdf2cad (src/pdf2cad/web/app.py) để BE sau này
// chỉ cần proxy / trỏ thẳng tới server đó.

export type Pdf2cadOcrMode = 'auto' | 'on' | 'off'

export interface Pdf2cadOptions {
  /** "" = tất cả, vd "1-3,5" */
  pages: string
  /** "" = tự đọc từ khung tên */
  scale: string
  dpi: number
  /** nét đậm ≥ (mm) */
  thick: number
  ocr: Pdf2cadOcrMode
  fitArcs: boolean
  raster: boolean
  autoRotate: boolean
  removeStamps: boolean
  keepGlyphs: boolean
}

export type Pdf2cadJobStatus = 'queued' | 'running' | 'done' | 'cancelled' | 'error'

export interface Pdf2cadReport {
  file: string
  page: number
  /** vector | raster | template | error */
  kind: string
  scale: number
  /** nguồn tỷ lệ: "khung tên", "mặc định", "người dùng"… */
  scale_source: string
  counts: Record<string, number>
  seconds: number
  output: string | null
  error?: string | null
  warning?: string | null
  /** đã tự xoay bản vẽ (độ) */
  rotated?: number | null
}

export interface Pdf2cadJobFile {
  name: string
  pages?: number
}

export interface Pdf2cadJob {
  id: string
  status: Pdf2cadJobStatus
  percent?: number | null
  done_pages: number
  total_pages: number
  /** file đang xử lý */
  current?: string | null
  /** bước đang chạy (tiếng Việt từ server) */
  stage?: string | null
  queue_position?: number | null
  message?: string | null
  files: Pdf2cadJobFile[]
  reports: Pdf2cadReport[]
}

/** Hình học DXF rút gọn để xem trước (mm, trục Y hướng lên) */
export interface DxfLayerData {
  /** [x1, y1, x2, y2] */
  l: [number, number, number, number][]
  /** [x, y, r] */
  c: [number, number, number][]
  /** [x, y, r, góc đầu, góc cuối] (độ, ngược chiều kim đồng hồ) */
  a: [number, number, number, number, number][]
  /** polyline hở */
  p: [number, number][][]
  /** [x, y, cao, góc xoay, hệ số rộng, chữ] */
  t: [number, number, number, number, number, string][]
  /** vùng tô (khép kín) */
  f?: [number, number][][]
}

export interface DxfPreview {
  layers: Record<string, DxfLayerData>
  count: number
  truncated?: boolean
}

export interface Pdf2cadTemplate {
  name: string
  title: string
  /** câu chat mẫu, vd "No.16 L=80" */
  example: string
  /** mẫu nháp vừa học ("Dạy bot") */
  draft?: boolean
  /** bảng tham số (nếu server trả về) */
  columns?: string[]
  rows?: (string | number)[][]
}

export interface Pdf2cadBotRequest {
  template: string
  session: string | null
  message: string
  lang: string
}

export interface Pdf2cadBotReply {
  session: string
  text: string
  text_en?: string
  output?: string | null
  job?: string | null
  chips?: string[]
  chips_en?: string[]
  /** "llm:<model>" hoặc "rules" */
  engine?: string
}

export interface Pdf2cadHealth {
  version: string
  ocr: boolean
  running: number
  queued: number
  max_upload_mb: number
  llm?: { ok: boolean; model?: string | null } | null
}

export interface Pdf2cadLearnedTemplate {
  name: string
  title: string
  rows: number
  columns: string[]
}

export interface Pdf2cadLearnResult {
  templates: Pdf2cadLearnedTemplate[]
}
