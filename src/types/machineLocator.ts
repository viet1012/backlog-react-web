// =========================================================
// RAW LAYOUT DATA (src/data/machineLocator/*.json)
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
}

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

export interface MachineLayoutConfig {
  id: string
  name: string
  // nhãn góc trên-trái bản vẽ
  drawingTitle: string
  image: string
  imageAlt: string
  // dữ liệu gốc đóng gói sẵn (bản build); khi dev được thay bằng bản đọc từ file
  data: LayoutData
  // đường dẫn file JSON gốc (tính từ thư mục gốc dự án)
  dataFile: string
  exportMeta: MachineLayoutExportMeta
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
}

export type Bounds = [number, number, number, number]

export interface EffectiveMachine {
  boxes: Box[]
  manual: boolean
  u: boolean
  // cần soát: r = true trong dữ liệu gốc và chưa có EDITS
  review: boolean
}

export type MachineMap = Record<string, EffectiveMachine>

// Phần chỉnh tay lưu lại (cùng format bản demo): code -> { boxes, deleted? }
export interface MachineEdit {
  boxes: Box[]
  deleted?: boolean
  renamedFrom?: string
  renamedTo?: string
  updatedAt?: string
}

export type MachineEdits = Record<string, MachineEdit>

export interface MachineDraft {
  code: string
  boxes: Box[]
  dirty: boolean
  isNew: boolean
  revert?: boolean
}

export type DrawMode = 'add' | 'replace'

export type PanelMode = 'new' | 'rename' | 'del'

export type StatusKind = '' | 'ok' | 'err'

export interface StatusMessage {
  t: string
  k: StatusKind
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
