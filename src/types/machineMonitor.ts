// =========================================================
// HSE (GET /api/machine-monitor/hse?floorId=)
// =========================================================

// Trạng thái máy / lỗi; server có thể thêm giá trị khác -> string
export type HseStatus =
  | 'OVERDUE'
  | 'NG'
  | 'OPEN'
  | 'WAIT_HSE'
  | 'SAFE'

export interface HseItem {
  id: number | string
  stt?: number | string | null
  status: HseStatus | string
  area?: string | null
  riskTotal?: number | null
  riskFreq?: number | null
  riskProb?: number | null
  riskSev?: number | null
  comment?: string | null
  countermeasure?: string | null
  patrolUser?: string | null
  createdAt?: string | null
  pic?: string | null
  dueDate?: string | null
  // PIC khắc phục
  atStatus?: string | null
  atUser?: string | null
  atDate?: string | null
  atComment?: string | null
  // HSE xác nhận
  hseJudge?: string | null
  hseUser?: string | null
  hseDate?: string | null
  hseComment?: string | null
  imageNames?: string[] | null
  atImageNames?: string[] | null
  hseImageNames?: string[] | null
  // mã / tên máy ghi trên phiếu (lỗi không gắn được vào máy trên bản đồ)
  machineText?: string | null
  division?: string | null
}

export interface HseMachine {
  status: HseStatus | string
  openCount: number
  overdueCount: number
  waitCount: number
  safeCount: number
  maxRisk: number | null
  items: HseItem[]
}

// Nhóm lỗi không gắn máy (vd INS, Bàn máy tính): cùng dạng với HseMachine + nhãn.
// BE chỉ trả label; key (= label) và description do service tạo
export interface HseUnassignedGroup extends HseMachine {
  key: string
  label: string
  description: string
}

export interface HseResponse {
  // số máy theo trạng thái, unassignedOpen (+ generatedAt nếu server đặt trong summary)
  summary?: Record<string, unknown> | null
  generatedAt?: string | null
  machines: Record<string, HseMachine>
  // service chuẩn hoá về mảng
  unassigned: HseUnassignedGroup[]
}

// Khoảng "Lịch sử an toàn" (lỗi SAFE) gửi safeFrom / safeTo (YYYY-MM-DD); lỗi chưa đóng luôn trả về hết
export interface HseSafeRange {
  from: string | null
  to: string | null
}
