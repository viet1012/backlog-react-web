import type {
  DxfPreview,
  Pdf2cadBotReply,
  Pdf2cadBotRequest,
  Pdf2cadHealth,
  Pdf2cadJob,
  Pdf2cadLearnResult,
  Pdf2cadOptions,
  Pdf2cadReport,
  Pdf2cadTemplate,
} from '../types/pdf2cad'
import { downloadBlob, zipStore } from '../utils/xlsxWriter'
import {
  buildPartDrawing,
  countEntities,
  fmtMm,
  previewToDxf,
  previewToSvgDataUrl,
  type PartSpec,
} from './pdf2cadDrawing'
import { Pdf2cadError, type Pdf2cadApi } from './pdf2cadApi'

// =========================================================
// DỮ LIỆU MẪU – chạy hoàn toàn trên trình duyệt khi chưa có BE.
// Mô phỏng hàng đợi / tiến độ / kết quả / bot giống server pdf2cad thật;
// thông báo (stage, lỗi) bằng tiếng Việt như server, UI tự dịch.
// =========================================================

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function randomId() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const pick = <T,>(list: readonly T[], seed: number) => list[seed % list.length]

const ACCEPTED = /\.(pdf|tiff?|png|jpe?g|bmp)$/i
const IMAGE = /\.(tiff?|png|jpe?g|bmp)$/i
const BROKEN = /(error|loi|broken|hong)/i

const VECTOR_STAGES = ['Đọc nét vẽ vector', 'Nhận dạng chữ (OCR)', 'Ghi file DXF']
const RASTER_STAGES = [
  'Đọc ảnh scan',
  'Tìm ký hiệu sửa đổi △',
  'Tìm và xoá dấu mộc',
  'Nhận dạng chữ (OCR)',
  'Dò nét vẽ',
  'Đọc lại từng ô bảng',
  'Tạo chữ sửa được',
  'Ghi file DXF',
]

// ---------------------------------------------------------
// Kết quả (DXF) đã tạo: key = jobId/tên file
// ---------------------------------------------------------

const outputs = new Map<string, { preview: DxfPreview; scan: boolean }>()

// ---------------------------------------------------------
// Job chuyển đổi
// ---------------------------------------------------------

interface MockPage {
  file: string
  fileIdx: number
  page: number
  scan: boolean
  broken: boolean
  ms: number
}

interface MockJob {
  id: string
  t0: number
  files: { name: string; pages: number }[]
  pages: MockPage[]
  cancelledAt: number | null
  reports: Map<number, Pdf2cadReport>
}

const jobs = new Map<string, MockJob>()
const QUEUE_MS = 700

function stem(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

function pageSpec(file: string, page: number, scan: boolean): PartSpec {
  const seed = hash(`${file}#${page}`)
  const D = pick([10, 12, 16, 20, 25, 30], seed)
  const head = seed % 3 !== 0
  return {
    D,
    L: 40 + (seed % 12) * 10,
    H: head ? D + 6 : undefined,
    T: head ? pick([5, 6, 8], seed >> 3) : undefined,
    hole: seed % 4 === 1 ? { d: Math.round(D * 0.5), depth: 15, label: `M${Math.round(D * 0.5)} DP15` } : undefined,
    title: stem(file).toUpperCase().slice(0, 22),
    drawingNo: `DR-TE-${String(10000 + (seed % 89999)).padStart(5, '0')}-${String(page).padStart(2, '0')}`,
    material: pick(['SKD11', 'SKH51', 'HAP40', 'S45C'], seed >> 5),
    scan,
  }
}

function pageDrawing(file: string, page: number, scan: boolean) {
  return buildPartDrawing(pageSpec(file, page, scan))
}

function outputName(p: MockPage) {
  return `${stem(p.file)}_p${String(p.page).padStart(3, '0')}.dxf`
}

function makeReport(job: MockJob, p: MockPage): Pdf2cadReport {
  if (p.broken) {
    return {
      file: p.file, page: p.page, kind: 'error', scale: 1, scale_source: '', counts: {},
      seconds: p.ms / 1000, output: null,
      error: `${p.file}: file hỏng, có mật khẩu hoặc không đọc được`,
    }
  }

  const { preview, scale } = pageDrawing(p.file, p.page, p.scan)
  const output = outputName(p)
  outputs.set(`${job.id}/${output}`, { preview, scan: p.scan })
  const seed = hash(p.file)

  return {
    file: p.file,
    page: p.page,
    kind: p.scan ? 'raster' : 'vector',
    scale,
    scale_source: 'khung tên',
    counts: Object.fromEntries(Object.entries(countEntities(preview)).filter(([, n]) => n > 0)),
    seconds: Math.round(p.ms * (0.9 + (seed % 20) / 100)) / 1000,
    output,
    rotated: p.scan && seed % 4 === 1 ? 90 : null,
    warning: p.scan && seed % 3 === 0
      ? 'Tỷ lệ FREE (không theo tỷ lệ): hình vẽ chỉ để tham khảo, kích thước đúng là số ghi trên bản vẽ'
      : null,
  }
}

function jobSnapshot(job: MockJob): Pdf2cadJob {
  const now = job.cancelledAt ?? Date.now()
  let t = now - job.t0 - QUEUE_MS
  const totalMs = job.pages.reduce((sum, p) => sum + p.ms, 0)
  const base = {
    id: job.id,
    total_pages: job.pages.length,
    files: job.files,
  }

  if (t < 0 && job.cancelledAt == null) {
    return { ...base, status: 'queued', queue_position: 1, done_pages: 0, percent: 0, reports: [] }
  }

  let done = 0
  let spent = 0
  let current: MockPage | null = null
  let frac = 0
  for (const p of job.pages) {
    if (t >= p.ms) {
      t -= p.ms
      spent += p.ms
      if (!job.reports.has(done)) job.reports.set(done, makeReport(job, p))
      done++
    } else {
      current = p
      frac = Math.max(0, t) / p.ms
      spent += Math.max(0, t)
      break
    }
  }

  const reports = [...job.reports.values()]
  if (job.cancelledAt != null) {
    return { ...base, status: 'cancelled', done_pages: done, percent: (100 * spent) / totalMs, reports }
  }
  if (!current) return { ...base, status: 'done', done_pages: done, percent: 100, reports }

  const stages = current.scan ? RASTER_STAGES : VECTOR_STAGES
  return {
    ...base,
    status: 'running',
    done_pages: done,
    percent: (100 * spent) / totalMs,
    current: current.file,
    stage: stages[Math.min(stages.length - 1, Math.floor(frac * stages.length))],
    reports,
  }
}

// ---------------------------------------------------------
// Mẫu vẽ lại + bot (theo luật, giữ ngữ cảnh theo session)
// ---------------------------------------------------------

interface MockTemplate extends Pdf2cadTemplate {
  /** khoá bắt buộc, hỏi lần lượt */
  keys: string[]
  /** giải thích ký hiệu */
  explain: Record<string, { vi: string; en: string }>
  /** tra bảng → thông số vẽ; null = giá trị khoá không có trong bảng */
  resolve: (p: Record<string, number>) => { spec: PartSpec; picked: string[]; warn: { vi: string; en: string }[] } | null
  /** giá trị hợp lệ cho khoá (để gợi ý) */
  options: (key: string, p: Record<string, number>) => number[]
}

function inRange(v: number, min: number, max: number) {
  return v >= min && v <= max
}

const DSJC_ROWS = [
  { No: 8, D: 8, H: 12, T: 4, L: [20, 60], P: [8, 10] },
  { No: 10, D: 10, H: 14, T: 5, L: [25, 80], P: [10, 12] },
  { No: 13, D: 13, H: 18, T: 5, L: [30, 100], P: [12, 15] },
  { No: 16, D: 16, H: 22, T: 6, L: [40, 120], P: [15, 20] },
  { No: 20, D: 20, H: 26, T: 8, L: [50, 150], P: [18, 25] },
]

const SPLB_ROWS = [10, 13, 16, 20, 25, 30].map((D) => ({ D, H: D + 6, T: D >= 20 ? 8 : 6, L: [20, 150] }))

const DSPLB_ROWS = [
  { D: 16, d: [5, 6.6], C: 0.5, L: [30, 120] },
  { D: 20, d: [6.6, 9], C: 0.5, L: [40, 150] },
  { D: 25, d: [9, 11], C: 1, L: [50, 150] },
  { D: 30, d: [9, 11, 14], C: 1, L: [60, 200] },
]

const templates: MockTemplate[] = [
  {
    name: 'dsjc-b',
    title: 'DSJC-B · Chốt dẫn hướng có ren',
    example: 'No.16 L=80 P=15',
    keys: ['No', 'L'],
    columns: ['No', 'D', 'H', 'T', 'L', 'P'],
    rows: DSJC_ROWS.map((r) => [r.No, r.D, r.H, r.T, `${r.L[0]}~${r.L[1]}`, r.P.join('/')]),
    explain: {
      No: { vi: 'Số hiệu size (cỡ chốt) – tra bảng ra D, H, T.', en: 'Size number – looks up D, H, T in the table.' },
      L: { vi: 'Chiều dài toàn bộ (mm), bước 5 mm.', en: 'Overall length (mm), 5 mm steps.' },
      P: { vi: 'Chiều sâu ren ở đầu thân (mm). ℓ là giả định, cần xác nhận.', en: 'Thread depth at the shaft end (mm). Assumed, needs confirming.' },
      D: { vi: 'Đường kính thân (theo No).', en: 'Shaft diameter (from No).' },
      H: { vi: 'Đường kính mũ (theo No).', en: 'Head diameter (from No).' },
      T: { vi: 'Chiều dày mũ (theo No).', en: 'Head thickness (from No).' },
    },
    options: (key, p) => {
      if (key === 'No') return DSJC_ROWS.map((r) => r.No)
      const row = DSJC_ROWS.find((r) => r.No === p.No)
      if (key === 'L' && row) return [row.L[0], Math.round((row.L[0] + row.L[1]) / 20) * 10, row.L[1]]
      if (key === 'P' && row) return row.P
      return []
    },
    resolve: (p) => {
      const row = DSJC_ROWS.find((r) => r.No === p.No)
      if (!row) return null
      const picked: string[] = [`D=${row.D}`, `H=${row.H}`, `T=${row.T}`]
      const warn: { vi: string; en: string }[] = []
      const P = p.P ?? row.P[0]
      if (p.P == null) picked.push(`P=${P}`)
      if (!inRange(p.L, row.L[0], row.L[1])) {
        warn.push({
          vi: `⚠ L=${p.L} ngoài chuẩn No.${row.No} (${row.L[0]}~${row.L[1]}) – vẫn vẽ, cần kiểm tra lại`,
          en: `⚠ L=${p.L} is outside the No.${row.No} standard (${row.L[0]}~${row.L[1]}) – drawn anyway, please check`,
        })
      }
      // NOTE trên bản vẽ: No.8 với L ≥ 40 ⇒ P = 10
      if (row.No === 8 && p.L >= 40 && P !== 10) {
        warn.push({ vi: '⚠ NOTE: No.8, L ≥ 40 ⇒ P=10 (đã áp dụng)', en: '⚠ NOTE: No.8, L ≥ 40 ⇒ P=10 (applied)' })
      }
      const depth = row.No === 8 && p.L >= 40 ? 10 : P
      return {
        spec: {
          D: row.D, L: p.L, H: row.H, T: row.T,
          hole: { d: Math.round(row.D * 0.5), depth, label: `M${Math.round(row.D * 0.5)} DP${depth}` },
          title: `DSJC-B No.${row.No}`,
          drawingNo: `DSJC-B${row.No}-${p.L}`,
          material: 'SUJ2',
        },
        picked,
        warn,
      }
    },
  },
  {
    name: 'splb-b',
    title: 'SPLB-B · Chốt định vị trơn',
    example: 'D=30 L=120',
    keys: ['D', 'L'],
    columns: ['D', 'H', 'T', 'L'],
    rows: SPLB_ROWS.map((r) => [r.D, r.H, r.T, '20~50/55/60~150']),
    explain: {
      D: { vi: 'Đường kính thân (khoá bảng).', en: 'Shaft diameter (table key).' },
      L: { vi: 'Chiều dài (mm): 20~50 bước 5, 55, 60~150 bước 10. L>200 ⇒ dung sai +1.2/+0.6.', en: 'Length (mm): 20~50 step 5, 55, 60~150 step 10. L>200 ⇒ tolerance +1.2/+0.6.' },
      H: { vi: 'Đường kính mũ = D + 6.', en: 'Head diameter = D + 6.' },
      T: { vi: 'Chiều dày mũ (6 hoặc 8).', en: 'Head thickness (6 or 8).' },
    },
    options: (key) => (key === 'D' ? SPLB_ROWS.map((r) => r.D) : key === 'L' ? [30, 50, 80, 120] : []),
    resolve: (p) => {
      const row = SPLB_ROWS.find((r) => r.D === p.D)
      if (!row) return null
      const warn = inRange(p.L, row.L[0], row.L[1])
        ? []
        : [{ vi: `⚠ L=${p.L} ngoài bảng (20~150) – vẫn vẽ`, en: `⚠ L=${p.L} is outside the table (20~150) – drawn anyway` }]
      return {
        spec: { D: row.D, L: p.L, H: row.H, T: row.T, title: `SPLB-B D${row.D}`, drawingNo: `SPLB-B${row.D}-${p.L}`, material: 'SKD11' },
        picked: [`H=${row.H}`, `T=${row.T}`],
        warn,
      }
    },
  },
  {
    name: 'dsplb-b',
    title: 'DSPLB-B · Chốt định vị có lỗ',
    example: 'D=30 d=9 L=120',
    keys: ['D', 'd', 'L'],
    columns: ['D', 'd', 'C', 'L'],
    rows: DSPLB_ROWS.map((r) => [r.D, r.d.join('/'), r.C, `${r.L[0]}~${r.L[1]}`]),
    explain: {
      D: { vi: 'Đường kính ngoài (khoá bảng 1).', en: 'Outer diameter (table key 1).' },
      d: { vi: 'Đường kính lỗ xuyên (khoá bảng 2, phụ thuộc D). d<14 ⇒ ±0.1, d≥14 ⇒ ±0.2.', en: 'Through-hole diameter (key 2, depends on D). d<14 ⇒ ±0.1, d≥14 ⇒ ±0.2.' },
      L: { vi: 'Chiều dài (mm).', en: 'Length (mm).' },
      C: { vi: 'Vát mép.', en: 'Chamfer.' },
    },
    options: (key, p) => {
      if (key === 'D') return DSPLB_ROWS.map((r) => r.D)
      const row = DSPLB_ROWS.find((r) => r.D === p.D)
      if (key === 'd') return row ? row.d : []
      if (key === 'L' && row) return [row.L[0], 100, row.L[1]]
      return []
    },
    resolve: (p) => {
      const row = DSPLB_ROWS.find((r) => r.D === p.D)
      if (!row || !row.d.includes(p.d)) return null
      const warn = inRange(p.L, row.L[0], row.L[1])
        ? []
        : [{ vi: `⚠ L=${p.L} ngoài chuẩn (${row.L[0]}~${row.L[1]})`, en: `⚠ L=${p.L} is outside the standard (${row.L[0]}~${row.L[1]})` }]
      return {
        spec: {
          D: row.D, L: p.L,
          hole: { d: p.d, depth: p.L, label: `Ø${fmtMm(p.d)} THRU ${p.d < 14 ? '±0.1' : '±0.2'}` },
          title: `DSPLB-B D${row.D} d${p.d}`,
          drawingNo: `DSPLB-B${row.D}-${p.d}-${p.L}`,
          material: 'SKD11',
        },
        picked: [`C=${row.C}`, `${p.d < 14 ? '±0.1' : '±0.2'}`],
        warn,
      }
    },
  },
]

interface BotSession {
  template: string
  params: Record<string, number>
  /** khoá đang hỏi – câu trả lời ngắn ("16") gán vào khoá này */
  asking: string | null
  last: { params: Record<string, number>; job: string; output: string } | null
}

const sessions = new Map<string, BotSession>()

function normKey(raw: string, tpl: MockTemplate): string | null {
  if (/^no$/i.test(raw) || /^số$/i.test(raw)) return 'No'
  if (tpl.keys.includes(raw) || tpl.explain[raw]) return raw
  const upper = raw.toUpperCase()
  if (tpl.keys.includes(upper) || tpl.explain[upper]) return upper
  const lower = raw.toLowerCase()
  if (tpl.keys.includes(lower) || tpl.explain[lower]) return lower
  return null
}

function parseMessage(message: string, tpl: MockTemplate, session: BotSession) {
  const set: Record<string, number> = {}
  const rel: Record<string, number> = {}
  let m: RegExpExecArray | null

  // No.16 / No 16 / số 16
  const no = /(?:\bno\.?|số)\s*(\d+)/i.exec(message)
  if (no) set.No = Number(no[1])

  // tăng L thêm 10 / giảm L 5 / increase L by 10
  const incRe = /(tăng|giảm|increase|decrease)\s+([a-zA-Z]+)\s+(?:thêm|by|bớt)?\s*(\d+(?:[.,]\d+)?)/gi
  while ((m = incRe.exec(message))) {
    const key = normKey(m[2], tpl)
    if (key) rel[key] = (/(giảm|decrease)/i.test(m[1]) ? -1 : 1) * Number(m[3].replace(',', '.'))
  }

  // giảm chiều dài xuống 55 / dài 70 / length 70
  const len = /(?:chiều dài|dài|length)\s*(?:xuống|lên|thành|to)?\s*(\d+(?:[.,]\d+)?)/i.exec(message)
  if (len) set.L = Number(len[1].replace(',', '.'))

  // L=80, H+2, đổi P thành 15
  const kvRe = /\b([a-zA-Z]{1,2})\s*(=|:|\+|-|thành)\s*(\d+(?:[.,]\d+)?)/g
  while ((m = kvRe.exec(message))) {
    const key = normKey(m[1], tpl)
    if (!key) continue
    const v = Number(m[3].replace(',', '.'))
    if (m[2] === '+') rel[key] = v
    else if (m[2] === '-') rel[key] = -v
    else set[key] = v
  }

  // trả lời ngắn cho câu hỏi trước
  const bare = /^\s*(\d+(?:[.,]\d+)?)\s*$/.exec(message)
  if (bare && session.asking) set[session.asking] = Number(bare[1].replace(',', '.'))

  return { set, rel }
}

function reply(
  session: string,
  vi: string,
  en: string,
  chips: { vi: string[]; en: string[] },
  extra: Partial<Pdf2cadBotReply> = {},
): Pdf2cadBotReply {
  return { session, text: vi, text_en: en, chips: chips.vi, chips_en: chips.en, engine: 'rules', ...extra }
}

function botReply(req: Pdf2cadBotRequest): Pdf2cadBotReply {
  const tpl = templates.find((t) => t.name === req.template)
  if (!tpl) throw new Pdf2cadError('Không có mẫu này', 404)

  let sid = req.session
  let session = sid ? sessions.get(sid) : undefined
  if (!session || session.template !== tpl.name) {
    sid = randomId()
    session = { template: tpl.name, params: {}, asking: null, last: null }
    sessions.set(sid, session)
  }
  const S = sid!
  const msg = req.message.trim()
  const baseChips = {
    vi: [tpl.example, 'Có những size nào?', `${tpl.keys[tpl.keys.length - 1]} là gì?`],
    en: [tpl.example, 'What sizes are available?', `What is ${tpl.keys[tpl.keys.length - 1]}?`],
  }

  // lời chào
  if (!msg) {
    return reply(
      S,
      `Xin chào! Mình vẽ lại bản vẽ **${tpl.title}** đúng tỷ lệ 1:1 theo kích thước bạn muốn.\n` +
        `Gõ các kích thước, ví dụ: **${tpl.example}**\nThiếu gì mình sẽ hỏi lại, kèm giá trị hợp lệ theo bảng.`,
      `Hi! I redraw **${tpl.title}** at 1:1 with the dimensions you want.\n` +
        `Type the dimensions, e.g. **${tpl.example}**\nIf something is missing I will ask, with the valid values from the table.`,
      baseChips,
    )
  }

  // bản vẽ mới
  if (/(bản vẽ mới|làm lại|reset|new drawing|start over)/i.test(msg)) {
    session.params = {}
    session.asking = null
    return reply(S, 'Bắt đầu bản vẽ mới. Bạn cần size nào?', 'Starting a new drawing. Which size do you need?', baseChips)
  }

  // bảng size
  if (/(size nào|những size|bảng|sizes|table)/i.test(msg)) {
    const head = tpl.columns!.join(' | ')
    const body = tpl.rows!.map((r) => r.join(' | ')).join('\n')
    return reply(
      S,
      `Bảng tham số **${tpl.title}** (${tpl.rows!.length} hàng):\n${head}\n${body}`,
      `Parameter table **${tpl.title}** (${tpl.rows!.length} rows):\n${head}\n${body}`,
      { vi: [tpl.example, 'Bản vẽ mới'], en: [tpl.example, 'New drawing'] },
    )
  }

  // giải thích ký hiệu
  const what = /^\s*(?:what is\s+)?([a-zA-Z]{1,2})\s*(?:là gì|\?)/i.exec(msg)
  if (what) {
    const key = normKey(what[1], tpl)
    const ex = key ? tpl.explain[key] : null
    if (ex) return reply(S, `**${key}**: ${ex.vi}`, `**${key}**: ${ex.en}`, baseChips)
  }

  // tải file
  if (/(tải|download|lấy file|get file)/i.test(msg)) {
    if (!session.last) {
      return reply(S, 'Chưa có bản vẽ nào. Hãy cho mình kích thước trước nhé.', 'No drawing yet. Give me the dimensions first.', baseChips)
    }
    return reply(S, 'File DXF của bản vẽ gần nhất:', 'DXF file of the latest drawing:', baseChips, {
      output: session.last.output,
      job: session.last.job,
    })
  }

  const { set, rel } = parseMessage(msg, tpl, session)
  if (!Object.keys(set).length && !Object.keys(rel).length) {
    return reply(
      S,
      `Mình chưa hiểu câu này. Hãy gõ kích thước dạng **${tpl.example}**, hoặc hỏi "Có những size nào?".`,
      `I did not get that. Type dimensions like **${tpl.example}**, or ask "What sizes are available?".`,
      baseChips,
    )
  }

  const params = { ...session.params, ...set }
  for (const [k, v] of Object.entries(rel)) {
    if (params[k] == null) continue
    params[k] = Math.round((params[k] + v) * 100) / 100
  }

  // đổi khoá trước (D) → khoá phụ thuộc (d) không còn hợp lệ thì bỏ
  if (tpl.name === 'dsplb-b' && set.D != null && params.d != null && !tpl.options('d', params).includes(params.d)) {
    delete params.d
  }

  session.params = params

  // khoá còn thiếu → hỏi lần lượt
  const missing = tpl.keys.find((k) => params[k] == null)
  if (missing) {
    session.asking = missing
    const opts = tpl.options(missing, params)
    const label = missing === 'No' ? 'No' : missing
    return reply(
      S,
      `Còn thiếu **${label}**.${opts.length ? ` Giá trị hợp lệ: ${opts.join(', ')}` : ''}`,
      `**${label}** is missing.${opts.length ? ` Valid values: ${opts.join(', ')}` : ''}`,
      { vi: opts.map(String), en: opts.map(String) },
    )
  }
  session.asking = null

  const resolved = tpl.resolve(params)
  if (!resolved) {
    const bad = tpl.keys.find((k) => !tpl.options(k, params).includes(params[k])) ?? tpl.keys[0]
    const opts = tpl.options(bad, params)
    delete params[bad]
    session.asking = bad
    return reply(
      S,
      `⚠ ${bad}=${set[bad] ?? '?'} không có trong bảng. Chọn: ${opts.join(', ')}`,
      `⚠ ${bad}=${set[bad] ?? '?'} is not in the table. Choose: ${opts.join(', ')}`,
      { vi: opts.map(String), en: opts.map(String) },
    )
  }

  // vẽ
  const { preview } = buildPartDrawing(resolved.spec)
  const job = randomId()
  const keyText = tpl.keys.map((k) => (k === 'No' ? `No.${params.No}` : `${k}=${params[k]}`)).join(' ')
  const output = `${resolved.spec.drawingNo}.dxf`
  outputs.set(`${job}/${output}`, { preview, scan: false })

  const changes = session.last
    ? Object.keys(params)
        .filter((k) => session.last!.params[k] !== params[k])
        .map((k) => `${k} ${session.last!.params[k] ?? '–'} → ${params[k]}`)
    : []
  session.last = { params: { ...params }, job, output }

  const measured = `L=${fmtMm(resolved.spec.L)} ✓ Ø${fmtMm(resolved.spec.D)} ✓${resolved.spec.H ? ` Ø${fmtMm(resolved.spec.H)} ✓` : ''}`
  const lines = (lang: 'vi' | 'en') => [
    lang === 'vi' ? `Đã vẽ **${tpl.title.split(' · ')[0]} ${keyText}**.` : `Drew **${tpl.title.split(' · ')[0]} ${keyText}**.`,
    resolved.picked.length ? (lang === 'vi' ? `• Theo bảng: ${resolved.picked.join(', ')}` : `• From the table: ${resolved.picked.join(', ')}`) : '',
    changes.length ? (lang === 'vi' ? `• Thay đổi: ${changes.join(', ')}` : `• Changes: ${changes.join(', ')}`) : '',
    lang === 'vi' ? `• Đo lại: ${measured}` : `• Re-measured: ${measured}`,
    ...resolved.warn.map((w) => w[lang]),
  ].filter(Boolean).join('\n')

  const lastKey = tpl.keys[tpl.keys.length - 1]
  return reply(
    S,
    lines('vi'),
    lines('en'),
    {
      vi: [`tăng ${lastKey} thêm 10`, `giảm ${lastKey} 10`, 'Bản vẽ mới', 'Tải file'],
      en: [`increase ${lastKey} by 10`, `decrease ${lastKey} 10`, 'New drawing', 'Download'],
    },
    { output, job },
  )
}

// ---------------------------------------------------------
// API mẫu
// ---------------------------------------------------------

function getOutput(jobId: string, name: string) {
  const out = outputs.get(`${jobId}/${name}`)
  if (!out) throw new Pdf2cadError('Chưa có file DXF', 404)
  return out
}

export const pdf2cadMockApi: Pdf2cadApi = {
  async health(): Promise<Pdf2cadHealth> {
    await wait(150)
    const running = [...jobs.values()].filter((j) => jobSnapshot(j).status === 'running').length
    return { version: 'mock', ocr: true, running, queued: 0, max_upload_mb: 200, llm: { ok: false } }
  },

  async createJob(files: File[], options: Pdf2cadOptions, onUpload) {
    if (!files.length) throw new Pdf2cadError('Chưa có file', 400)
    if (files.length > 50) throw new Pdf2cadError('Tối đa 50 file mỗi lần', 400)
    const bad = files.find((f) => !ACCEPTED.test(f.name))
    if (bad) throw new Pdf2cadError(`${bad.name}: chỉ nhận PDF, TIFF, PNG, JPG, BMP`, 400)
    const total = files.reduce((sum, f) => sum + f.size, 0)
    if (total > 200 * 1048576) throw new Pdf2cadError('Tổng dung lượng vượt 200 MB', 413)

    // tải lên giả: 4 nấc
    for (let i = 1; i <= 4; i++) {
      await wait(150)
      onUpload?.((total * i) / 4, total)
    }

    const id = randomId()
    const jobFiles = files.map((f) => ({ name: f.name, pages: !IMAGE.test(f.name) && f.size > 2 * 1048576 ? 2 : 1 }))
    const pages: MockPage[] = []
    jobFiles.forEach((f, fileIdx) => {
      const scan = IMAGE.test(f.name) || (options.ocr === 'on' && hash(f.name) % 2 === 0)
      for (let page = 1; page <= f.pages; page++) {
        pages.push({ file: f.name, fileIdx, page, scan, broken: BROKEN.test(f.name), ms: scan ? 4200 : 1600 })
      }
    })
    jobs.set(id, { id, t0: Date.now(), files: jobFiles, pages, cancelledAt: null, reports: new Map() })
    return id
  },

  async getJob(id) {
    await wait(60)
    const job = jobs.get(id)
    return job ? jobSnapshot(job) : null
  },

  async cancelJob(id) {
    const job = jobs.get(id)
    if (job && job.cancelledAt == null) job.cancelledAt = Date.now()
  },

  async downloadFile(jobId, name) {
    downloadBlob(new Blob([previewToDxf(getOutput(jobId, name).preview)], { type: 'application/dxf' }), name)
  },

  async downloadZip(jobId) {
    const prefix = `${jobId}/`
    const files = [...outputs.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, out]) => ({ path: key.slice(prefix.length), content: previewToDxf(out.preview) }))
    if (!files.length) throw new Pdf2cadError('Chưa có file DXF', 404)
    downloadBlob(new Blob([zipStore(files)], { type: 'application/zip' }), `pdf2cad_${jobId.slice(0, 8)}.zip`)
  },

  async preview(jobId, name) {
    await wait(120)
    return getOutput(jobId, name).preview
  },

  async pageImageUrl(jobId, fileIdx, page) {
    const job = jobs.get(jobId)
    const p = job?.pages.find((x) => x.fileIdx === fileIdx && x.page === page)
    if (!p) throw new Pdf2cadError('Không có trang', 404)
    await wait(100)
    return previewToSvgDataUrl(pageDrawing(p.file, p.page, p.scan).preview, p.scan)
  },

  async learn(jobId, name): Promise<Pdf2cadLearnResult> {
    getOutput(jobId, name)
    await wait(900)
    const base = stem(name).replace(/_p\d+$/, '')
    const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const tplName = `learned-${slug}`
    const seed = hash(base)
    if (BROKEN.test(base) || seed % 5 === 0) {
      throw new Pdf2cadError('Không tìm thấy bảng tham số (hàng tiêu đề D/H/T/L...) trên bản vẽ này', 422)
    }

    const rows = [10, 13, 16, 20].map((D) => ({ D, H: D + 5, T: 5, L: [30, 120] as [number, number] }))
    if (!templates.some((t) => t.name === tplName)) {
      templates.push({
        name: tplName,
        title: `${base} (nháp)`,
        example: 'D=16 L=60',
        draft: true,
        keys: ['D', 'L'],
        columns: ['D', 'H', 'T', 'L'],
        rows: rows.map((r) => [r.D, r.H, r.T, `${r.L[0]}~${r.L[1]}`]),
        explain: {
          D: { vi: 'Đường kính thân (cột D của bảng đã học).', en: 'Shaft diameter (column D of the learned table).' },
          L: { vi: 'Chiều dài toàn bộ.', en: 'Overall length.' },
          H: { vi: 'Đường kính mũ.', en: 'Head diameter.' },
          T: { vi: 'Chiều dày mũ.', en: 'Head thickness.' },
        },
        options: (key) => (key === 'D' ? rows.map((r) => r.D) : key === 'L' ? [30, 60, 120] : []),
        resolve: (p) => {
          const row = rows.find((r) => r.D === p.D)
          if (!row) return null
          return {
            spec: { D: row.D, L: p.L, H: row.H, T: row.T, title: `${base} D${row.D}`, drawingNo: `${base}-${row.D}-${p.L}` },
            picked: [`H=${row.H}`, `T=${row.T}`],
            warn: inRange(p.L, row.L[0], row.L[1]) ? [] : [{ vi: `⚠ L=${p.L} ngoài bảng`, en: `⚠ L=${p.L} is outside the table` }],
          }
        },
      })
    }
    return { templates: [{ name: tplName, title: `${base} (nháp)`, rows: rows.length, columns: ['D', 'H', 'T', 'L'] }] }
  },

  async templates() {
    await wait(120)
    return templates.map(({ name, title, example, draft, columns, rows }) => ({ name, title, example, draft, columns, rows }))
  },

  async bot(req) {
    await wait(req.message ? 500 + Math.random() * 400 : 200)
    return botReply(req)
  },
}
