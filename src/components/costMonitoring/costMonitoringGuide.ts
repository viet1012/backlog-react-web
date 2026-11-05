import type { Messages } from '../../i18n/messages/en'
import type { CostSeriesKey } from './costChartConfig'
import type { CostStatusLevel } from './costChartUtils'

// =========================================================
// HƯỚNG DẪN COST MONITORING
// Text (vi/en) nằm ở i18n/messages – mục `costGuide`.
// File này chỉ giữ cấu trúc, số liệu ví dụ và cách ghép công thức.
// =========================================================

type GuideText = Messages['costGuide']

export const GUIDE_TAB_IDS = ['quick', 'read', 'glossary', 'example', 'faq'] as const

export type GuideTabId = (typeof GUIDE_TAB_IDS)[number]


// ---------- Tab 1: Bắt đầu nhanh ----------

export const QUICK_STEP_IDS = ['month', 'badge', 'open'] as const

export const BADGE_LEVELS = ['ok', 'watch', 'over'] as const


// ---------- Tab 3: Thuật ngữ ----------

export type GlossaryTermId = keyof GuideText['glossary']['terms']

export interface GlossaryGroup {
  id: keyof GuideText['glossary']['groups']
  // nhóm có cột "Trên chart"
  showLine?: boolean
  // line: đường mẫu hiển thị ở cột "Trên chart"
  terms: { id: GlossaryTermId; line?: CostSeriesKey }[]
}

export const GLOSSARY: GlossaryGroup[] = [
  {
    id: 'lines',
    showLine: true,
    terms: [
      { id: 'fcTgt', line: 'fcTgt' },
      { id: 'plTgt', line: 'plTgt' },
      { id: 'actMtd', line: 'actMtd' },
      { id: 'estMtd', line: 'estMtd' },
      { id: 'fluctTgt', line: 'fluctTgt' },
    ],
  },
  {
    id: 'source',
    terms: [{ id: 'bp' }, { id: 'simu' }, { id: 'mtd' }, { id: 'kusd' }],
  },
  {
    id: 'costTypes',
    terms: [{ id: 'ot' }, { id: 'tsl' }, { id: 'rm' }],
  },
]


// ---------- Tab 4: Ví dụ thực tế ----------

// Chart minh họa cho ví dụ tiền chợ – dữ liệu cố định, không gọi API (đơn vị: triệu đ)
export const EXAMPLE_DATA = {
  // tháng 30 ngày – chỉ để dựng trục X
  month: '2026-11',
  daysInMonth: 30,

  bp: 5,
  fc: 6,
  pl: 6.2,
  fluct: 6.6,

  // Actual lũy kế ngày 1 → 30
  actual: [
    0.2, 0.45, 0.7, 0.95, 1.2, 1.45, 1.7, 1.95, 2.25, 2.5,
    2.7, 2.95, 3.1, 3.4, 3.6, 3.85, 4.05, 4.15, 4.4, 4.6,
    4.8, 5.1, 5.25, 5.45, 5.7, 5.9, 6.05, 6.3, 6.5, 6.75,
  ],
}

// Số liệu ví dụ tại ngày d – do costGuideDemo.ts tính
export interface ExampleValues {
  day: number
  daysInMonth: number
  pl: number
  fc: number
  fluct: number
  act: number
  plMtd: number
  diff: number
  // null khi d = ngày cuối tháng
  estEnd: number | null
  final: number
  ratio: number
  level: CostStatusLevel
}

export interface FormulaCard {
  title: string
  meaning: string
  formula: string[]
  substitution: string
  result: string
  resultNote?: string
  tip?: string
  // màu kết quả = màu đường tương ứng (hoặc màu badge)
  tone: CostSeriesKey | CostStatusLevel
}

const f2 = (v: number) => v.toFixed(2)
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${f2(Math.abs(v))}`

// Thẻ "Cách tính" – thay số theo ngày d đang chọn trên slider
export function buildFormulas(t: Messages, v: ExampleValues): FormulaCard[] {
  const text = t.costGuide.formulas
  const left = v.daysInMonth - v.day

  return [
    {
      title: text.plMtd.title,
      meaning: text.plMtd.meaning,
      formula: [text.plMtd.formula],
      substitution: `= ${v.pl} × ${v.day}/${v.daysInMonth}`,
      result: f2(v.plMtd),
      tone: 'plTgt',
    },
    {
      title: text.diff.title,
      meaning: text.diff.meaning,
      formula: [text.diff.formula],
      substitution: `= ${f2(v.act)} − ${f2(v.plMtd)}`,
      result: signed(v.diff),
      resultNote: v.diff >= 0 ? text.diff.faster : text.diff.slower,
      tone: 'actMtd',
    },
    v.estEnd != null
      ? {
          title: text.estimate.title,
          meaning: text.estimate.meaning,
          formula: [text.estimate.formula],
          substitution: `= ${f2(v.act)} + ${v.pl} × ${left}/${v.daysInMonth}`,
          result: f2(v.estEnd),
          tip: text.estimate.tip(f2(v.estEnd), v.pl, signed(v.estEnd - v.pl)),
          tone: 'estMtd',
        }
      : {
          title: text.estimate.title,
          meaning: text.estimate.meaningEnded,
          formula: [text.estimate.formula],
          substitution: `= ${f2(v.act)} + ${v.pl} × 0/${v.daysInMonth}`,
          result: f2(v.act),
          resultNote: text.estimate.endedNote,
          tone: 'actMtd',
        },
    {
      title: text.fluct.title,
      meaning: text.fluct.meaning,
      formula: text.fluct.formula,
      substitution: `= ${v.fc} × (1 + 10%)`,
      result: String(v.fluct),
      tone: 'fluctTgt',
    },
    {
      title: text.badge.title,
      meaning: text.badge.meaning,
      formula: text.badge.formula,
      substitution: `= ${f2(v.final)} / ${v.fluct}`,
      result: `${v.ratio.toFixed(1)}% → ${t.cost.status[v.level]}`,
      resultNote: text.badge.note,
      tone: v.level,
    },
  ]
}

// Câu kết luận dưới chart
export function buildConclusion(t: Messages, v: ExampleValues) {
  const demo = t.costGuide.example.demo

  return demo.conclusion(
    v.estEnd != null ? demo.finalEstimate : demo.finalActual,
    f2(v.final),
    String(v.fluct),
    v.ratio.toFixed(1),
    t.cost.status[v.level],
    demo.verdict[v.level],
  )
}
