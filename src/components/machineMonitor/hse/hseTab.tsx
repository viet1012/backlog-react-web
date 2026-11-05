import dayjs from 'dayjs'

import { fetchHseMonitor } from '../../../services/machineMonitorService'
import type {
  HseItem,
  HseMachine,
  HseResponse,
} from '../../../types/machineMonitor'
import {
  presetRange,
  resolveRange,
} from '../monitorRange'
import type {
  MachineMark,
  MonitorHistoryRow,
  MonitorLegendItem,
  MonitorTabDef,
  MonitorTarget,
} from '../monitorTypes'
import { HseDetailPanel } from './HseDetailPanel'
import { getMessages } from '../../../i18n/i18nContext'
import {
  hseChip,
  hseSeverity,
  hseTone,
  isPastDue,
  isSafe,
  overdueDays,
} from './hseStatus'

// mặc định: tháng này
const DEFAULT_SAFE_RANGE = presetRange('month')

// Số máy theo trạng thái lấy từ summary (thử vài kiểu tên khoá);
// summary thiếu khoá thì đếm từ machines
function summaryCount(data: HseResponse, statuses: string[]): number {
  const s = data.summary ?? {}
  let total = 0
  let found = false

  for (const st of statuses) {
    const camel = st.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    const v = [st, st.toLowerCase(), camel, `${camel}Count`]
      .map((k) => s[k])
      .find((x) => typeof x === 'number')

    if (typeof v === 'number') {
      total += v
      found = true
    }
  }

  if (found) return total

  return Object.values(data.machines).filter((m) => statuses.includes(m.status)).length
}

const openOf = (m: HseMachine) => (m.openCount ?? 0) + (m.waitCount ?? 0)

// số lỗi không gắn máy chưa đóng: summary.unassignedOpen; thiếu thì cộng từ các nhóm
function unassignedOpen(data: HseResponse): number {
  const n = data.summary?.unassignedOpen

  return typeof n === 'number' ? n : data.unassigned.reduce((a, g) => a + openOf(g), 0)
}

// nhóm danh sách bên phải
function sectionOf(status: string): string | undefined {
  if (isSafe(status)) return undefined
  if (status === 'OVERDUE') return 'overdue'
  if (status === 'WAIT_HSE') return 'wait'

  return 'open'
}

// Mức risk I–V từ maxRisk. Giả định: 1–5 là mức sẵn; lớn hơn là điểm tổng (F×P×S) -> chia theo ngưỡng.
// Chỉnh RISK_THRESHOLDS khi có bảng quy đổi chính thức của HSE
const RISK_ROMAN = ['I', 'II', 'III', 'IV', 'V']
const RISK_THRESHOLDS = [3, 6, 11, 15]

function riskLevel(risk: number | null | undefined): MachineMark['level'] {
  if (risk == null || !Number.isFinite(risk) || risk <= 0) return undefined

  const level = risk <= 5 && Number.isInteger(risk)
    ? risk
    : RISK_THRESHOLDS.filter((t) => risk > t).length + 1

  return { label: RISK_ROMAN[level - 1], strong: level >= 4 }
}

// ngày dạng dd/MM; không có / sai -> null
function dayMonth(v: string | null | undefined): string | null {
  const d = v ? dayjs(v) : null

  return d?.isValid() ? d.format('DD/MM') : null
}

// ngày sớm nhất / muộn nhất (dd/MM) trong danh sách ngày
function pickDay(values: (string | null | undefined)[], latest: boolean): string | null {
  const days = values
    .map((v) => (v ? dayjs(v) : null))
    .filter((d): d is dayjs.Dayjs => !!d?.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf())
  const d = latest ? days[days.length - 1] : days[0]

  return d ? d.format('DD/MM') : null
}

// lỗi chưa đóng, nặng trước
function openItemsOf(m: HseMachine): HseItem[] {
  return (m.items ?? [])
    .filter((it) => !isSafe(it.status))
    .sort((a, b) => hseSeverity(b.status) - hseSeverity(a.status) || (b.riskTotal ?? 0) - (a.riskTotal ?? 0))
}

const hseText = () => getMessages().monitor.hse

// trạng thái hiển thị của 1 lỗi: OPEN / NG đã qua hạn -> OVERDUE
function itemStatus(it: HseItem): string {
  return (it.status === 'OPEN' || it.status === 'NG') && isPastDue(it.dueDate, it.status) ? 'OVERDUE' : it.status
}

// mốc thời gian theo trạng thái: chờ HSE -> ngày PIC báo xong; còn lại -> hạn xử lý
function timeText(status: string, items: HseItem[]): string | null {
  if (status === 'WAIT_HSE') {
    const at = pickDay(items.map((it) => it.atDate), true)

    return at ? hseText().picDone(at) : null
  }

  const due = pickDay(items.map((it) => it.dueDate), false)

  return due ? hseText().due(due) : null
}

// máy hoặc nhóm không gắn máy (cùng dạng HseMachine)
function hseMark(m: HseMachine): MachineMark {
  const open = openOf(m)
  const openItems = openItemsOf(m)
  const first = openItems[0] ?? m.items?.[0]
  const area = first?.area?.trim() || null
  const pic = first?.pic?.trim() ? hseText().pic(first.pic.trim()) : null
  // số ngày quá hạn lâu nhất trong các lỗi chưa đóng
  const late = Math.max(0, ...openItems.map((it) => overdueDays(it.dueDate)))
  const chip = hseChip(m.status, late)
  const time = timeText(m.status, openItems)

  return {
    tone: hseTone(m.status),
    dashed: m.status === 'NG',
    // 1 lỗi: màu máy đã đủ, không hiện số
    badge: open > 1 ? open : undefined,
    active: open > 0 || !isSafe(m.status),
    // status trước, rồi maxRisk
    rank: hseSeverity(m.status) * 10000 + (m.maxRisk ?? 0),
    // tooltip trên bản đồ
    sub: [
      chip.label,
      area,
      pic,
      time,
      open > 1 ? getMessages().monitor.openErrorCount(open) : null,
      m.maxRisk != null ? getMessages().monitor.riskMax(m.maxRisk) : null,
    ].filter(Boolean).join(' · '),
    section: sectionOf(m.status),
    chip,
    detail: [area, pic, time].filter(Boolean).join(' · ') || undefined,
    level: riskLevel(m.maxRisk),
  }
}

export const hseTab: MonitorTabDef<HseResponse> = {
  id: 'hse',
  // getters: text follows the current UI language
  get label() { return getMessages().monitor.tabs.hse },
  get listTitle() { return hseText().listTitle },
  get activeFilterLabel() { return hseText().activeFilter },

  history: {
    defaultRange: DEFAULT_SAFE_RANGE,
    get label() { return hseText().historyLabel },
    get note() { return hseText().historyNote },
    get rowsTitle() { return hseText().historyRowsTitle },
  },

  get sections() {
    const s = hseText().sections

    return [
      { id: 'overdue', label: s.overdue.label, hint: s.overdue.hint },
      { id: 'open', label: s.open.label, hint: s.open.hint },
      { id: 'wait', label: s.wait.label, hint: s.wait.hint },
    ]
  },

  get help() {
    const h = hseText().help

    return [
      { chip: hseChip('OVERDUE'), text: h.OVERDUE },
      { chip: hseChip('OPEN'), text: h.OPEN },
      { chip: hseChip('NG'), text: h.NG },
      { chip: hseChip('WAIT_HSE'), text: h.WAIT_HSE },
      { chip: hseChip('SAFE'), text: h.SAFE },
    ]
  },

  load(floorId, signal, history) {
    return fetchHseMonitor(floorId, signal, resolveRange(history ?? DEFAULT_SAFE_RANGE))
  },

  generatedAt(data) {
    const g = data.generatedAt ?? data.summary?.generatedAt

    return typeof g === 'string' ? g : null
  },

  marks(data) {
    const out: Record<string, MachineMark> = {}

    for (const [code, m] of Object.entries(data.machines)) out[code] = hseMark(m)

    return out
  },

  // ô số ở header panel phải (số máy); "Không gắn máy" do page thêm
  legend(data): MonitorLegendItem[] {
    return [
      { tone: 'critical', label: getMessages().monitor.hseStatus.OVERDUE, count: summaryCount(data, ['OVERDUE']), section: 'overdue' },
      { tone: 'bad', label: hseText().legendOpen, count: summaryCount(data, ['NG', 'OPEN']), section: 'open' },
      { tone: 'warn', label: getMessages().monitor.hseStatus.WAIT_HSE, count: summaryCount(data, ['WAIT_HSE']), section: 'wait' },
    ]
  },

  // phạm vi lịch sử đã hiện ở segmented ngay trên -> không lặp lại
  panelSummary(data, { mapCodes }) {
    // số lỗi SAFE trong phạm vi lịch sử (máy + nhóm không gắn máy)
    const nSafeItems = [...Object.values(data.machines), ...data.unassigned]
      .reduce((a, m) => a + (m.safeCount ?? 0), 0)

    return hseText().safeSummary(nSafeItems, mapCodes.length)
  },

  groups(data) {
    return data.unassigned.map((g) => ({
      key: g.key,
      label: g.label,
      description: g.description,
      mark: hseMark(g),
    }))
  },

  groupsOpenCount: unassignedOpen,

  // máy / nhóm có lỗi đã an toàn trong khoảng (server chỉ trả lỗi SAFE trong safeFrom–safeTo);
  // mới xác nhận gần nhất lên trước
  historyRows(data) {
    const rows: (MonitorHistoryRow & { last: number })[] = []

    function add(target: MonitorTarget, title: string, m: HseMachine) {
      const safe = (m.items ?? []).filter((it) => isSafe(it.status))
      const count = safe.length || (m.safeCount ?? 0)

      if (!count) return

      const last = safe
        .map((it) => (it.hseDate ? dayjs(it.hseDate) : null))
        .filter((d): d is dayjs.Dayjs => !!d?.isValid())
        .sort((a, b) => b.valueOf() - a.valueOf())[0]

      rows.push({
        target,
        title,
        detail: [
          safe.find((it) => it.area?.trim())?.area?.trim(),
          last ? hseText().hseConfirmed(last.format('DD/MM')) : null,
        ].filter(Boolean).join(' · '),
        count,
        last: last?.valueOf() ?? 0,
      })
    }

    for (const [code, m] of Object.entries(data.machines)) add({ kind: 'machine', id: code }, code, m)
    for (const g of data.unassigned) add({ kind: 'group', id: g.key }, g.label, g)

    return rows.sort((a, b) => b.last - a.last || a.title.localeCompare(b.title))
  },

  // dòng mở rộng: từng lỗi chưa đóng (nội dung 1 dòng, PIC, hạn / ngày PIC xong)
  preview(data, target) {
    const m = target.kind === 'machine'
      ? data.machines[target.id]
      : data.unassigned.find((g) => g.key === target.id)

    return (m ? openItemsOf(m) : []).map((it) => {
      const st = itemStatus(it)
      const text = (it.comment || it.countermeasure || '').split(/\r?\n/).map((s) => s.trim()).find(Boolean)

      return {
        id: String(it.id),
        chip: hseChip(st, overdueDays(it.dueDate)),
        text: text || hseText().noContent,
        meta: [
          it.pic?.trim() ? hseText().pic(it.pic.trim()) : null,
          st === 'WAIT_HSE'
            ? (dayMonth(it.atDate) ? hseText().picDone(dayMonth(it.atDate)!) : null)
            : (dayMonth(it.dueDate) ? hseText().due(dayMonth(it.dueDate)!) : null),
        ].filter(Boolean).join(' · '),
      }
    })
  },

  renderDetail({ target, data }) {
    return target.kind === 'machine'
      ? <HseDetailPanel machine={data.machines[target.id]} />
      : <HseDetailPanel machine={data.unassigned.find((g) => g.key === target.id)} unassigned />
  },
}
