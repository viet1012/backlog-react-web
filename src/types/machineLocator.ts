// =========================================================
// RAW LAYOUT DATA (GET /api/machine-locator/floors/{id})
// =========================================================

// [x, y, w, h] theo pt của trang PDF, gốc toạ độ góc trên-trái
export type RawBox = [number, number, number, number]

// Một đa giác: các điểm [x, y] theo pt PDF (cùng hệ toạ độ với b)
export type Polygon = [number, number][]

// Đường bao CAD của 1 khung: nhiều đa giác, hoặc null = vẽ hình chữ nhật b
export type Outline = Polygon[] | null

export interface RawMachine {
  b: RawBox[]
  // p[i] là đường bao của b[i] (cùng độ dài với b); không có p = chỉ dùng hình chữ nhật
  p?: Outline[]
  // true: nhãn trên bản vẽ bị chồng chữ, mã đọc chưa chắc chắn
  u: boolean
  // nguồn khung: manual (chỉnh tay) / cad (bám bản vẽ) / old (khung ước lượng cũ)
  src?: 'manual' | 'cad' | 'old'
  // true: khung cần người soát lại
  r?: boolean
  // fit[i]: kiểu ôm của b[i] (cùng độ dài với b); thiếu = theo mặc định
  fit?: (FitMode | null)[]
  // vị trí chữ mã máy trên bản vẽ [x, y, w, h] (pt), do generate_machine_boxes.py ghi;
  // khối nằm trùng chữ mã máy không tính là hình máy khi ôm
  t?: RawBox[]
}

// Kiểu ôm: closed = theo viền kín chứa điểm hạt giống, tight = sát theo nét, hull = bao lồi (trơn),
// rect = chỉ thu khung b, không đường bao
export type FitMode = 'closed' | 'tight' | 'hull' | 'rect'

export interface LayoutData {
  // [x, y, w, h] vùng cắt của trang PDF dùng làm ảnh nền (pt)
  crop: [number, number, number, number]
  // [width, height] trang PDF (pt)
  page: [number, number]
  // pixel ảnh trên mỗi pt
  ppp: number
  m: Record<string, RawMachine>
}

// =========================================================
// LAYOUT CONFIG
// =========================================================

export interface MachineLayoutExportMeta {
  factory: string
  floor: string
  sourcePdf: string
  imageFile: string
  // tiền tố tên file xuất, vd factory-b-machines_20260930.csv
  filePrefix: string
}

// Thông tin 1 tab layout (GET /floors); dữ liệu máy tải riêng theo floor
export interface MachineLayoutConfig {
  id: string
  name: string
  // nhãn góc trên-trái bản vẽ
  drawingTitle: string
  image: string
  imageAlt: string
  exportMeta: MachineLayoutExportMeta
}

// Response của GET /floors (mỗi phần tử) và GET /floors/{id} (có thêm m)
export interface FloorDto extends Partial<Omit<LayoutData, 'm'>> {
  id: string
  name: string
  drawingTitle?: string
  imageUrl: string
  exportMeta?: Partial<MachineLayoutExportMeta>
  version?: number
  m?: Record<string, RawMachine>
}

// =========================================================
// RUNTIME
// =========================================================

export interface Box {
  x: number
  y: number
  w: number
  h: number
  // đường bao CAD; null / thiếu = hình chữ nhật. Sửa x/y/w/h thì phải đặt lại null
  p?: Outline
  // kiểu ôm đã dùng / đã chọn cho khung này (lưu vào JSON)
  fit?: FitMode | null
  // phiên ôm gần nhất (chỉ trong bản nháp, không lưu): công thức + khối ứng viên + 3 kiểu kết quả
  fx?: FitSession
}

export type Bounds = [number, number, number, number]

export interface EffectiveMachine {
  boxes: Box[]
  manual: boolean
  u: boolean
  // cần soát: r = true trên server
  review: boolean
}

export type MachineMap = Record<string, EffectiveMachine>

// Body PUT /floors/{id}/machines/{code}
export interface MachineEdit {
  boxes: Box[]
  // true: chỉ ôm lại khung theo ảnh (hàng loạt) -> giữ nguyên trạng thái máy (u / src / r)
  keepStatus?: boolean
}

// 1 thao tác của POST /floors/{id}/bulk
export type MachineBulkOp =
  | { type: 'set', code: string, boxes: Box[] }
  | { type: 'del', code: string }

export interface MachineDraft {
  code: string
  boxes: Box[]
  dirty: boolean
  isNew: boolean
}

// =========================================================
// ÔM KHUNG THEO ẢNH
// =========================================================

// Kết quả 1 kiểu ôm: bbox mới (pt, 1 chữ số) + đường bao (pt; null với kiểu rect)
export interface FitResult {
  b: RawBox
  p: Polygon[] | null
  // điểm tin cậy 0–100: chu vi trùng nét mực + chênh diện tích so với khung gốc
  score: number
  // "Theo viền kín" không tìm được viền kín -> dùng kết quả "Sát"
  fallback?: boolean
}

// Nét bút trên vùng tìm: erase = loại trừ (Alt + kéo), add = bổ sung (Shift + kéo)
export interface FitStroke {
  mode: 'add' | 'erase'
  // bán kính bút (pt)
  r: number
  pts: [number, number][]
}

// Công thức ôm: tính lại từ đầu trong worker nên hoàn tác / làm lại chỉ cần giữ công thức
export interface FitRecipe {
  // vùng gốc (pt): khung vừa thả / khung đang chọn, hoặc vùng vuông quanh điểm click
  b: RawBox
  // nới vùng tìm mỗi chiều (0.15 = 15%; 0 = đúng vùng b)
  expand: number
  // khung gốc để so độ dời / diện tích; null: ôm quanh điểm click khi chưa có khung
  ref: RawBox | null
  // điểm hạt giống cho "Theo viền kín" (pt); null = tâm vùng b
  seed: [number, number] | null
  // Douglas–Peucker epsilon (px ảnh), theo thanh "Độ sát"
  eps: number
  // nắn cạnh gần ngang / dọc cho vuông góc
  ortho: boolean
  // "Bịt hở" (px ảnh, 1–5): khe hở lớn nhất của viền được bịt kín trước khi tìm viền kín
  gap: number
  // "Giới hạn trong khung": cắt kết quả theo khung gốc nới FIT_CONFIG.boxOverflowPx (chỉ khi có ref)
  clip?: boolean
  // Alt+click: cắt khối dính tại các điểm này (pt), theo thứ tự
  cuts: [number, number][]
  // click: bật / tắt khối chứa điểm (pt), theo thứ tự
  toggles: [number, number][]
  strokes: FitStroke[]
}

export interface FitCandidate {
  // viền khối (pt)
  poly: Polygon
  // đang dùng cho đường bao
  on: boolean
  // khối giống chữ (bị loại khi tự chọn)
  text: boolean
}

export interface FitView {
  candidates: FitCandidate[]
  // null: không nhận ra hình máy
  variants: Record<FitMode, FitResult | null>
}

export interface FitSession {
  recipe: FitRecipe
  view: FitView
}

// Chỉnh thông số ôm trong hàng xem trước: "Độ sát", "Nắn vuông góc", "Bịt hở", "Giới hạn trong khung"
export interface FitTune {
  tightness?: number
  ortho?: boolean
  gap?: number
  clip?: boolean
}

// fit: đã ôm, review: đã ôm nhưng khung đổi nhiều, miss: không nhận ra hình máy
export type FitStatus = 'fit' | 'review' | 'miss'

export interface FitBatchRow {
  code: string
  // vị trí trong danh sách khung của máy
  i: number
  // số khung của máy (hiện "vị trí i" khi > 1)
  n: number
  // độ dời/đổi lớn nhất của cạnh (pt); null khi không nhận ra
  shift: number | null
  // điểm tin cậy 0–100; null khi không nhận ra
  score: number | null
  status: FitStatus
  // soát lần lượt: accept = nhận (Enter), skip = bỏ qua, giữ khung cũ (S)
  decision?: 'accept' | 'skip'
}

export interface FitBatch {
  running: boolean
  done: number
  total: number
  // sắp theo điểm tin cậy tăng dần (khung kém nhất lên đầu)
  rows: FitBatchRow[]
  // kết quả chờ lưu: code -> toàn bộ khung của máy
  pending: Record<string, Box[]>
  // khung trước khi ôm của các máy trong pending (để bỏ qua từng khung)
  orig: Record<string, Box[]>
  // đang soát lần lượt: index dòng đang xem; null = không soát
  reviewIdx: number | null
}

export interface FitToast {
  id: number
  text: string
  kind: 'success' | 'warning' | 'info'
  // id mục hoàn tác (nút "Hoàn tác" của toast)
  undoId?: number
}

export type DrawMode = 'add' | 'replace'

export type PanelMode = 'new' | 'rename' | 'del'

export type StatusKind = '' | 'ok' | 'err'

export interface StatusMessage {
  t: string
  k: StatusKind
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
