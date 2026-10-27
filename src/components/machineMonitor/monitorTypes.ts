import type { ReactNode } from 'react'

import type { MonitorRange } from './monitorRange'

// =========================================================
// KHUNG CHUNG CHO CÁC TAB GIÁM SÁT
// Mỗi tab = { load (service), mark (code -> màu / badge), legend, renderDetail (panel chi tiết) };
// bản đồ, danh sách máy, bộ lọc, làm mới dùng chung (MachineMonitorPage)
// =========================================================

// Mức màu trên bản đồ, nặng -> nhẹ; none = máy không có trong response
export type MonitorTone = 'critical' | 'bad' | 'warn' | 'ok' | 'none'

export const MONITOR_TONES: MonitorTone[] = ['critical', 'bad', 'warn', 'ok', 'none']

// chip trạng thái bằng chữ (vd "Quá hạn 25 ngày"); dashed = viền đứt
export interface MonitorChip {
  label: string
  tone: MonitorTone
  dashed?: boolean
}

export interface MachineMark {
  tone: MonitorTone
  // viền nét đứt (phân biệt trạng thái cùng màu, vd NG với OPEN)
  dashed?: boolean
  // số trên máy (không hiện khi 0 / thiếu)
  badge?: number
  // có việc chưa đóng: lọc "chỉ hiện máy có lỗi" + danh sách bên phải
  active: boolean
  // sắp danh sách: số lớn đứng trước
  rank: number
  // tooltip trên bản đồ + dòng phụ panel chi tiết
  sub: string
  // nhóm trong danh sách bên phải (id trong tab.sections)
  section?: string
  // dòng 1 danh sách: chip trạng thái cạnh mã
  chip?: MonitorChip
  // dòng 2 danh sách (nhạt), vd "area · PIC · hạn 12/10"
  detail?: string
  // chip mức (vd risk "IV"); strong = mức cao, tô đậm
  level?: { label: string, strong: boolean }
}

export interface MonitorSection {
  id: string
  label: string
  // 1 dòng giải thích nhạt dưới tiêu đề nhóm
  hint?: string
}

// ô số ở header panel phải; bấm -> lọc theo section
export interface MonitorLegendItem {
  tone: MonitorTone
  label: string
  count: number
  section?: string
}

// mục trong popover "?" giải thích trạng thái / màu
export interface MonitorHelpItem {
  chip: MonitorChip
  text: string
}

// 1 lỗi trong dòng mở rộng của danh sách
export interface MonitorPreviewItem {
  id: string
  chip: MonitorChip
  // nội dung rút gọn 1 dòng
  text: string
  // vd "PIC A · hạn 12/10"
  meta: string
}

// Nhóm lỗi không gắn được vào máy trên bản đồ (vd INS, Bàn máy tính)
export interface MonitorGroup {
  key: string
  label: string
  // mô tả ngắn (dòng phụ); thiếu thì dùng mark.sub
  description?: string | null
  mark: MachineMark
}

// Panel chi tiết mở cho 1 máy hoặc 1 nhóm không gắn máy
export type MonitorTarget =
  | { kind: 'machine', id: string }
  | { kind: 'group', id: string }

export interface MonitorDetailProps<T> {
  target: MonitorTarget
  data: T
}

// Bộ lọc khoảng ngày lịch sử (gửi kèm khi tải); nút chọn khoảng ở header panel phải
export interface MonitorHistoryFilter {
  defaultRange: MonitorRange
  // nhãn cạnh nút
  label: string
  // ghi chú (tooltip)
  note: string
  // tiêu đề mục cuối danh sách, vd "Đã an toàn trong khoảng"
  rowsTitle: string
}

// 1 dòng trong mục lịch sử cuối danh sách (vd máy / nhóm có lỗi đã an toàn trong khoảng)
export interface MonitorHistoryRow {
  target: MonitorTarget
  title: string
  // vd "area · HSE xác nhận 12/10"
  detail: string
  count: number
}

// Ngữ cảnh cho dòng tóm tắt ở header panel phải
export interface MonitorSummaryContext {
  // mã máy trên bản đồ của floor
  mapCodes: string[]
  // nhãn phạm vi lịch sử đang chọn, vd "Tháng này"
  historyLabel?: string
}

// Khai báo bằng method để MonitorTabDef<HseResponse> gán được vào MonitorTabDef<unknown>
export interface MonitorTabDef<T> {
  id: string
  label: string
  // tiêu đề panel bên phải, vd "Máy có lỗi chưa đóng"
  listTitle: string
  // nhãn checkbox lọc
  activeFilterLabel: string
  history?: MonitorHistoryFilter
  // popover "?" cạnh tiêu đề panel
  help?: MonitorHelpItem[]
  // history: khoảng đang chọn (undefined khi tab không có history)
  load(floorId: string, signal: AbortSignal, history?: MonitorRange): Promise<T>
  generatedAt(data: T): string | null
  // chỉ gọi với mã có trong response; mã không có -> tone none
  marks(data: T): Record<string, MachineMark>
  // hàng ô số ở header panel phải (màu + số), bấm = lọc theo section
  legend(data: T): MonitorLegendItem[]
  // nhóm danh sách bên phải theo thứ tự; dòng có mark.section không thuộc đâu -> "Khác"
  sections?: MonitorSection[]
  // dòng phụ nhạt dưới hàng ô số
  panelSummary?(data: T, ctx: MonitorSummaryContext): string
  // nhóm lỗi không gắn máy + tổng số lỗi chưa đóng của các nhóm (tab không có -> bỏ qua)
  groups?(data: T): MonitorGroup[]
  groupsOpenCount?(data: T): number
  // các lỗi chưa đóng hiện khi mở rộng 1 dòng danh sách
  preview?(data: T, target: MonitorTarget): MonitorPreviewItem[]
  // mục lịch sử cuối danh sách (cần history)
  historyRows?(data: T): MonitorHistoryRow[]
  renderDetail(props: MonitorDetailProps<T>): ReactNode
}

export interface MonitorTabEntry {
  id: string
  label: string
  // chưa có: tab disabled + nhãn "Coming soon"
  def: MonitorTabDef<unknown> | null
}
