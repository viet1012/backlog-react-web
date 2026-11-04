import type { CostSeriesKey } from './costChartConfig'
import type { CostStatusLevel } from './costChartUtils'

// =========================================================
// NỘI DUNG HƯỚNG DẪN COST MONITORING
// Chỉ chứa text – sửa nội dung ở đây, không cần đụng UI.
// =========================================================

export const GUIDE_TITLE = 'Hướng dẫn Cost Monitoring'

export const GUIDE_TABS = [
  { id: 'quick', label: 'Bắt đầu nhanh' },
  { id: 'read', label: 'Cách đọc chart' },
  { id: 'glossary', label: 'Thuật ngữ' },
  { id: 'example', label: 'Ví dụ thực tế' },
  { id: 'faq', label: 'Câu hỏi thường gặp' },
] as const

export type GuideTabId = (typeof GUIDE_TABS)[number]['id']


// ---------- Tab 1: Bắt đầu nhanh ----------

export const QUICK_START = {
  intro:
    'Màn hình gồm 9 chart: 3 bộ phận (PRESS, MOLD, GUIDE) × 3 loại chi phí (OT, T&SL, RM). Đơn vị: nghìn USD (K$).',

  steps: [
    {
      title: 'Chọn tháng',
      body: 'Chọn tháng ở góc phải trên. "Simu week" để mặc định "Latest".',
    },
    {
      title: 'Nhìn màu badge',
      body: 'Badge ở góc phải mỗi chart cho biết chart nào cần chú ý:',
      badges: [
        { level: 'ok', text: 'OK ≤100%' },
        { level: 'watch', text: 'Watch 100–105%' },
        { level: 'over', text: 'Over >105%' },
      ],
    },
    {
      title: 'Bấm vào chart cần xem',
      body: 'Đọc chart theo tab "Cách đọc chart".',
    },
  ],
} as const


// ---------- Tab 2: Cách đọc chart ----------

export const READ_CHART = {
  annotations: [
    {
      no: 1,
      title: 'Hàng số liệu',
      body: 'Các con số chính của chart: FC, PL, Actual, Estimate, Fluct. Chấm màu bên cạnh khớp với màu đường trên chart.',
    },
    {
      no: 2,
      title: 'Badge trạng thái',
      body: 'So giá trị cuối tháng với target. Xanh = trong ngân sách, vàng = cần theo dõi, đỏ = có nguy cơ vượt.',
    },
    {
      no: 3,
      title: 'Đường Actual',
      body: 'Chi phí thực tế cộng dồn từ đầu tháng. Mũi tên đánh dấu ngày có số liệu mới nhất.',
    },
    {
      no: 4,
      title: 'Đường Estimate',
      body: 'Nối tiếp từ mũi tên đến cuối tháng: dự phóng chi phí nếu phần còn lại đi đúng kế hoạch.',
    },
    {
      no: 5,
      title: 'Tag giá trị bên phải',
      body: 'Giá trị của các đường ngang (FC, PL, Fluct), cùng màu với đường, để khỏi phải dò trục Y.',
    },
  ],

  quickRead: {
    title: 'Đọc trong 10 giây',
    lines: [
      'Nhìn điểm cuối đường xanh (Actual, hoặc Estimate nếu tháng chưa hết) rồi so với đường target.',
      'Nằm DƯỚI target → đang tiết kiệm. Nằm TRÊN target → có nguy cơ vượt ngân sách.',
    ],
  },

  note: {
    title: 'Lưu ý',
    body: 'Đầu tháng mới có vài ngày số liệu nên Estimate chủ yếu là kế hoạch kéo dài; kết luận chắc chắn hơn từ giữa tháng.',
  },
} as const


// ---------- Tab 3: Thuật ngữ ----------

export interface GlossaryTerm {
  term: string
  meaning: string
  // đường mẫu hiển thị ở cột "Trên chart"
  line?: CostSeriesKey
  lineNote?: string
}

export interface GlossaryGroup {
  title: string
  // nhóm có cột "Trên chart"
  showLine?: boolean
  terms: GlossaryTerm[]
}

export const GLOSSARY: GlossaryGroup[] = [
  {
    title: 'Các đường trên chart',
    showLine: true,
    terms: [
      {
        term: 'FC TGT (Forecast)',
        meaning: 'Dự báo chi phí của tháng, cập nhật theo tình hình thực tế. Là mốc chính để đánh giá.',
        line: 'fcTgt',
        lineNote: 'Đường xám nét đứt',
      },
      {
        term: 'PL TGT (Plan)',
        meaning: 'Kế hoạch đã tính lại gần nhất (bản Simulation mới nhất).',
        line: 'plTgt',
        lineNote: 'Đường xanh lá',
      },
      {
        term: 'Actual (MTD)',
        meaning: 'Chi phí thực tế đã phát sinh, cộng dồn từ đầu tháng.',
        line: 'actMtd',
        lineNote: 'Đường xanh dương liền, mũi tên ở cuối',
      },
      {
        term: 'Estimate (MTD)',
        meaning: 'Dự phóng cuối tháng = Actual hiện tại + phần kế hoạch còn lại.',
        line: 'estMtd',
        lineNote: 'Đường xanh dương nét đứt',
      },
      {
        term: 'Fluctuating TGT',
        meaning:
          'Target co giãn theo sản lượng: FC × (1 + mức chênh sales & tồn kho so với dự báo). Làm nhiều hàng hơn thì được phép tiêu nhiều hơn.',
        line: 'fluctTgt',
        lineNote: 'Đường đỏ',
      },
    ],
  },
  {
    title: 'Dữ liệu gốc',
    terms: [
      { term: 'BP (Budget Plan)', meaning: 'Ngân sách gốc lập từ đầu năm.' },
      { term: 'Simu W1–W5', meaning: 'Bản tính lại target theo từng tuần trong tháng.' },
      { term: 'MTD (Month-To-Date)', meaning: 'Lũy kế từ ngày 1 đến ngày đang xem.' },
      { term: 'K$', meaning: 'Nghìn đô la Mỹ.' },
    ],
  },
  {
    title: 'Loại chi phí',
    terms: [
      { term: 'OT (Over Time)', meaning: 'Chi phí làm thêm giờ.' },
      { term: 'T&SL (Tools & Supplies)', meaning: 'Dụng cụ, dao cụ, vật tư tiêu hao.' },
      { term: 'RM (Raw Material)', meaning: 'Nguyên vật liệu.' },
    ],
  },
]

// Tooltip 1 câu cho legend / chip / badge
export const SERIES_HINTS: Record<CostSeriesKey, string> = {
  fcTgt: 'FC TGT – dự báo chi phí của tháng, mốc chính để đánh giá.',
  plTgt: 'PL TGT – kế hoạch đã tính lại gần nhất (bản Simulation mới nhất).',
  actMtd: 'Actual – chi phí thực tế đã phát sinh, cộng dồn từ đầu tháng.',
  estMtd: 'Estimate – dự phóng cuối tháng = Actual hiện tại + phần kế hoạch còn lại.',
  fluctTgt: 'Fluctuating TGT – target co giãn theo sản lượng (sales & tồn kho).',
}

// Tooltip của dropdown "PL TGT theo" ở header
export const SIMU_WEEK_HINT =
  'Chọn bản kế hoạch (Simulation) theo tuần dùng làm đường PL TGT. Mặc định lấy tuần mới nhất có số liệu.'

export const BADGE_HINT =
  'So giá trị cuối (Estimate, không có thì Actual) với target (Fluctuating, không có thì FC): ≤100% OK · 100–105% Watch · >105% Over.'

export const NO_ACTUAL_HINT =
  'Tháng này chưa có số liệu Actual nên chưa đánh giá được; chỉ xem được target và kế hoạch.'


// ---------- Tab 4: Ví dụ thực tế ----------

export const EXAMPLE = {
  storyTitle: 'Ví dụ đời thường – tiền chợ tháng',

  // amount: triệu đồng
  steps: [
    { text: 'Đầu năm định chi mỗi tháng', amount: '5', term: 'BP' },
    { text: 'Cuối tháng trước tính lại: tháng này cần', amount: '6', term: 'FC' },
    { text: 'Tuần 2 tính lại còn', amount: '6,2', term: 'PL (Simu)' },
    { text: 'Đến ngày 10 đã tiêu', amount: '2,5', term: 'Actual' },
    { text: 'Cứ đà này cuối tháng: 2,5 + 6,2 × 20/30 ≈', amount: '6,63', term: 'Estimate' },
    { text: 'Nhà đông người hơn 10% → target hợp lý 6 × 1,1 =', amount: '6,6', term: 'Fluctuating TGT' },
  ],

  amountUnit: 'triệu đồng',

  chartTitle: 'Áp vào chart',
  chartBody:
    'Cách đọc 1 chart T&SL: "Estimate 191 > FC 183 → nhìn badge Watch 104% → xem đường đỏ (nếu có) để biết có do sản lượng tăng không."',
} as const

// Chart minh họa cho ví dụ tiền chợ – dữ liệu cố định, không gọi API (đơn vị: triệu đ)
export const EXAMPLE_DEMO = {
  title: 'Xem ví dụ trên chart',
  unitNote: 'Đơn vị trong ví dụ: triệu đồng.',

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

  // slider mặc định = ngày hôm nay (giới hạn 1 → daysInMonth)
  sliderLabelToday: (day: number) => `Hôm nay là ngày ${day}`,
  sliderLabelAssumed: (day: number) => `Giả sử hôm nay là ngày ${day}`,
  todayChip: (ddMM: string) => `Hôm nay ${ddMM}`,
  resetToday: '↺ Về hôm nay',
  sliderHint:
    'Ví dụ đang dùng ngày hôm nay — chart thật bên ngoài cũng đang ở ngày này. Kéo thử để xem cuối tháng Estimate sẽ thay đổi ra sao.',
  // nhãn đường dọc trên chart
  todayLabel: 'Hôm nay',
  dayLabel: (day: number) => `Ngày ${day}`,
  plMtdLegend: 'PL MTD – kế hoạch lũy kế đến từng ngày (đường chấm xanh lá nhạt)',

  callouts: {
    actual: (v: string) => `Đã tiêu ${v} (Actual)`,
    plMtd: (v: string, diff: number) =>
      `Kế hoạch đến hôm nay: ${v} (PL MTD) → Actual đang ${diff >= 0 ? 'cao' : 'thấp'} hơn kế hoạch ${Math.abs(diff).toFixed(2)}`,
    estimate: (v: string) => `Dự phóng cuối tháng: ${v}`,
    fluct: (v: string) => `Target co giãn: ${v}`,
  },

  // Kết luận dưới chart – sinh theo badge
  conclusionTitle: 'Kết luận',
  statusLabel: { ok: 'OK', watch: 'Watch', over: 'Over' },
  verdict: {
    ok: 'Đang trong mức cho phép',
    watch: 'Sát target, tiếp tục theo dõi',
    over: 'Có nguy cơ vượt, cần xem lại chi tiêu',
  },
  conclusion: (finalLabel: string, final: string, target: string, ratio: string, status: string, verdict: string) =>
    `${finalLabel} ${final} / target co giãn ${target} = ${ratio}% → ${status}: ${verdict}.`,
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

export const FORMULA_TITLE = 'Cách tính'

const f2 = (v: number) => v.toFixed(2)
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${f2(Math.abs(v))}`

// Thẻ "Cách tính" – thay số theo ngày d đang chọn trên slider
export function buildFormulas(v: ExampleValues): FormulaCard[] {
  const left = v.daysInMonth - v.day

  return [
    {
      title: 'PL MTD (kế hoạch đến hôm nay)',
      meaning: 'Phần chi phí lẽ ra đã tiêu tính đến hôm nay nếu đi đúng kế hoạch.',
      formula: ['PL MTD = PL TGT × (số ngày đã qua / số ngày trong tháng)'],
      substitution: `= ${v.pl} × ${v.day}/${v.daysInMonth}`,
      result: f2(v.plMtd),
      tone: 'plTgt',
    },
    {
      title: 'Chênh lệch so với kế hoạch',
      meaning: 'Cho biết đang tiêu nhanh hay chậm hơn kế hoạch.',
      formula: ['Chênh lệch = Actual − PL MTD'],
      substitution: `= ${f2(v.act)} − ${f2(v.plMtd)}`,
      result: signed(v.diff),
      resultNote: v.diff >= 0 ? 'đang tiêu nhanh hơn kế hoạch' : 'đang tiêu chậm hơn kế hoạch',
      tone: 'actMtd',
    },
    v.estEnd != null
      ? {
          title: 'Estimate cuối tháng',
          meaning: 'Nếu những ngày còn lại đi đúng kế hoạch thì cuối tháng sẽ tiêu bao nhiêu.',
          formula: ['Estimate = Actual + PL TGT × (số ngày còn lại / số ngày trong tháng)'],
          substitution: `= ${f2(v.act)} + ${v.pl} × ${left}/${v.daysInMonth}`,
          result: f2(v.estEnd),
          tip: `Mẹo: Estimate − PL TGT = Actual − PL MTD → ${f2(v.estEnd)} − ${v.pl} = ${signed(v.estEnd - v.pl)}`,
          tone: 'estMtd',
        }
      : {
          title: 'Estimate cuối tháng',
          meaning: 'Tháng đã hết nên không còn dự phóng – giá trị cuối chính là Actual.',
          formula: ['Estimate = Actual + PL TGT × (số ngày còn lại / số ngày trong tháng)'],
          substitution: `= ${f2(v.act)} + ${v.pl} × 0/${v.daysInMonth}`,
          result: f2(v.act),
          resultNote: '(= Actual cuối tháng)',
          tone: 'actMtd',
        },
    {
      title: 'Fluctuating TGT',
      meaning: 'Target được nới hoặc siết theo sản lượng thực tế so với dự báo.',
      formula: [
        'Fluct = FC × (1 + Ratio)',
        'Ratio = (chênh sales + chênh tồn kho) / Sales dự báo cả tháng',
      ],
      substitution: `= ${v.fc} × (1 + 10%)`,
      result: String(v.fluct),
      tone: 'fluctTgt',
    },
    {
      title: 'Badge',
      meaning: 'Một con số cho biết chart có cần chú ý không.',
      formula: [
        '% = Giá trị cuối / Target',
        'Giá trị cuối = Estimate nếu tháng chưa hết, Actual nếu đã hết',
        'Target = Fluct nếu có, không thì FC',
      ],
      substitution: `= ${f2(v.final)} / ${v.fluct}`,
      result: `${v.ratio.toFixed(1)}% → ${EXAMPLE_DEMO.statusLabel[v.level]}`,
      resultNote: '(≤100% OK, 100–105% Watch, >105% Over)',
      tone: v.level,
    },
  ]
}

// Câu kết luận dưới chart
export function buildConclusion(v: ExampleValues) {
  return EXAMPLE_DEMO.conclusion(
    v.estEnd != null ? 'Estimate cuối tháng' : 'Actual cuối tháng',
    f2(v.final),
    String(v.fluct),
    v.ratio.toFixed(1),
    EXAMPLE_DEMO.statusLabel[v.level],
    EXAMPLE_DEMO.verdict[v.level],
  )
}


// ---------- Tab 5: Câu hỏi thường gặp ----------

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Vì sao chart OT không có đường Actual?',
    a: 'Dữ liệu OT thực tế chưa được đưa vào hệ thống. Hiện chỉ xem được target và kế hoạch; badge OT chỉ mang tính tham khảo.',
  },
  {
    q: 'Vì sao chưa có đường đỏ (Fluctuating TGT)?',
    a: 'Cần dữ liệu doanh số & tồn kho theo ngày, đang chuẩn bị.',
  },
  {
    q: 'Vì sao RM chỉ có số đến 2 ngày trước?',
    a: 'Dữ liệu xuất nguyên vật liệu được cập nhật chậm hơn 1 ngày so với T&SL.',
  },
  {
    q: 'Đường Actual có lúc đi xuống?',
    a: 'Do có hàng trả lại kho hoặc điều chỉnh, chi phí âm trong ngày.',
  },
  {
    q: 'Badge tính thế nào?',
    a: 'So giá trị cuối (Estimate nếu tháng chưa hết, Actual nếu đã hết) với target (Fluctuating nếu có, không thì FC).',
  },
  {
    q: 'Số liệu khác file Excel?',
    a: 'Báo IT kèm tháng + chart + ngày.',
  },
]
