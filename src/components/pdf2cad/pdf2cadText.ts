import { useI18n } from '../../i18n/useI18n'
import type { Pdf2cadHealth, Pdf2cadReport } from '../../types/pdf2cad'
import type { Language } from '../../utils/uiPreferences'

// Chữ của màn PDF → CAD (vi / en), để riêng như AuthGuide cho gọn file i18n chung.

const vi = {
  title: 'PDF → CAD',
  subtitle: 'Chuyển bản vẽ PDF / scan sang DXF 2D (mm, 1:1) · vẽ lại từ mẫu tham số',
  sectionAria: 'Chức năng PDF → CAD',
  tabConvert: 'Chuyển sang DXF',
  tabRedraw: 'Vẽ lại từ mẫu',
  mockChip: 'Dữ liệu mẫu',
  mockTip: 'Chưa nối BE: chuyển đổi, bot và file DXF đều được mô phỏng trên trình duyệt.',
  health: (h: Pdf2cadHealth) =>
    `v${h.version} · OCR ${h.ocr ? 'có' : 'chưa cài'} · đang chạy ${h.running}, chờ ${h.queued} · tối đa ${h.max_upload_mb} MB`,
  noServer: 'Không kết nối được server pdf2cad',
  authShort: 'Chưa xác thực',
  sessionExpired: 'Phiên đăng nhập đã hết hạn (hoặc đăng nhập từ trước khi có token). Hãy đăng nhập lại để dùng PDF → CAD.',
  forbidden: 'Tài khoản không có quyền dùng PDF → CAD.',
  relogin: 'Đăng nhập lại',

  // ---- chọn file
  dropTitle: 'Kéo thả PDF / TIFF / ảnh scan vào đây',
  dropHint: 'hoặc bấm để chọn file · tối đa 50 file',
  clearList: 'Xoá danh sách',
  remove: 'Bỏ',
  skipped: (n: number) => `Bỏ qua ${n} file không phải PDF/TIFF/ảnh`,
  fileCount: (n: number, size: string) => `${n} file · ${size}`,

  // ---- tuỳ chọn
  optionsTitle: 'Tuỳ chọn',
  pages: 'Trang',
  pagesPh: 'tất cả (vd: 1-3,5)',
  scale: 'Tỷ lệ 1 :',
  scalePh: 'tự đọc từ khung tên',
  dpi: 'DPI scan',
  thick: 'Nét đậm ≥ (mm)',
  ocr: 'OCR chữ',
  ocrAuto: 'Tự động (khi PDF không có lớp text)',
  ocrOn: 'Luôn bật',
  ocrOff: 'Tắt',
  fitArcs: 'Fit cung tròn / đường tròn',
  raster: 'Xử lý trang scan',
  autoRotate: 'Tự xoay bản vẽ theo hướng chữ',
  removeStamps: 'Bản scan: xoá dấu mộc (SPC, MassPro, chữ ký)',
  keepGlyphs: 'Giữ nét chữ gốc để đối chiếu OCR (file lớn hơn ~20 lần)',

  // ---- chạy
  run: 'Chuyển sang DXF',
  stop: 'Dừng',
  zip: 'Tải tất cả (zip)',
  needFile: 'Hãy kéo thả ít nhất một file',
  ready: 'Sẵn sàng',
  waiting: 'Đang chờ…',
  uploading: 'Đang tải lên…',
  uploadingN: (a: string, b: string) => `Đang tải lên ${a} / ${b}`,
  step1: 'Bước 1/2: tải file lên server',
  processing: 'Đang xử lý',
  queuedStage: 'Đang chờ tới lượt…',
  queuedMsg: (p: number | string) => `Đang chờ (vị trí ${p} trong hàng đợi)…`,
  runningMsg: (c: string, d: number, t: number) => `Đang xử lý ${c} — ${d}/${t} trang`,
  done: 'Hoàn tất',
  cancelled: 'Đã dừng',
  stopped: 'Đã dừng và xoá job',
  jobGone: 'Job không còn trên server (hết hạn hoặc đã xoá)',
  summary: (status: string, ok: number, err: number) => `${status}: ${ok} DXF${err ? `, ${err} trang lỗi` : ''}`,
  eta: (t: string) => ` · còn ~${t}`,
  sec: (s: number) => (s < 60 ? `${Math.round(s)} giây` : `${Math.floor(s / 60)} phút ${Math.round(s % 60)} giây`),
  errorPrefix: 'Lỗi: ',

  // ---- xem trước
  tabPdf: 'Bản gốc',
  tabDxf: 'DXF kết quả',
  viewerHint: 'Lăn chuột: zoom · kéo: di chuyển · bấm đúp: vừa khung',
  viewerEmpty: 'Chọn một dòng kết quả để xem trước',
  redrawEmpty: 'Bản vẽ do trợ lý tạo sẽ hiện ở đây',
  loadingPreview: 'Đang tải xem trước…',
  noPreview: 'Không xem trước được',
  localHint: (n: string) => `${n} — bấm "Chuyển sang DXF" để xử lý`,
  pageOf: (n: string, p: number) => `${n} — trang ${p}`,
  dxfInfo: (n: string, c: number, w: string, h: string, tr?: boolean) =>
    `${n} — ${c} đối tượng, khung ${w}×${h} mm${tr ? ' (rút gọn)' : ''}`,
  layers: 'Layer',
  fit: 'Vừa khung',

  // ---- bảng kết quả
  results: 'Kết quả',
  thFile: 'File',
  thPage: 'Trang',
  thKind: 'Loại',
  thScale: 'Tỷ lệ',
  thObj: 'Đối tượng',
  thTime: 'Thời gian',
  thDxf: 'DXF',
  noResults: 'Chưa có kết quả',
  processingRow: 'Đang xử lý…',
  skippedRow: '(bỏ qua)',
  rotated: (d: number) => `xoay ${d}°`,
  kinds: { vector: 'Vector', raster: 'Scan', template: 'Mẫu', error: 'Lỗi' } as Record<string, string>,
  learnBtn: 'Dạy bot',
  learnTitle: 'Đọc khung tên + bảng tham số để trợ lý vẽ lại được bản vẽ này',
  learning: 'Đang học…',
  learnFail: 'Không học được',
  learned: (n: number) => `Đã học ${n} mẫu`,
  learnMsg: (n: number, out: string, list: { title: string; rows: number; columns: string[] }[]) =>
    `Mình vừa học **${n}** bảng từ ${out}:\n` +
    list.map((t) => `• ${t.title}: ${t.rows} hàng, cột ${t.columns.join(', ')}`).join('\n') +
    '\nHãy kiểm tra bảng bằng “Có những size nào?” trước khi dùng.',

  // ---- trợ lý
  botName: (name: string) => `${name} · Trợ lý vẽ lại`,
  online: 'trực tuyến',
  replying: 'đang vẽ…',
  rulesBot: 'bot luật',
  aiBot: (m: string) => `AI ${m}`,
  aiTitle: 'Câu chat được hiểu bằng LLM cục bộ; kích thước, bảng và bản vẽ do pdf2cad tính',
  template: 'Mẫu bản vẽ',
  draft: 'nháp',
  chatPh: (ex: string) => `Nhập yêu cầu, vd: ${ex}`,
  send: 'Gửi',
  download: (n: string) => `Tải ${n}`,
  viewAgain: 'Xem lại',
  newChat: 'Bản vẽ mới',
  paramTable: 'Bảng tham số',
  paramTableEmpty: 'Mẫu này chưa có bảng tham số',
  heroLine: 'Gõ kích thước, mình vẽ lại bản vẽ đúng 1:1 cho bạn.',
  noTemplates: 'Chưa có mẫu nào. Chuyển một bản vẽ rồi bấm “Dạy bot”.',
  spin: 'Kéo để xoay',
}

export type Pdf2cadText = typeof vi

const en: Pdf2cadText = {
  title: 'PDF → CAD',
  subtitle: 'Convert drawing PDFs / scans to 2D DXF (mm, 1:1) · redraw from parametric templates',
  sectionAria: 'PDF → CAD features',
  tabConvert: 'Convert to DXF',
  tabRedraw: 'Redraw from template',
  mockChip: 'Sample data',
  mockTip: 'Backend not connected yet: conversion, the bot and DXF files are simulated in the browser.',
  health: (h) =>
    `v${h.version} · OCR ${h.ocr ? 'installed' : 'not installed'} · running ${h.running}, queued ${h.queued} · max ${h.max_upload_mb} MB`,
  noServer: 'Cannot connect to the pdf2cad server',
  authShort: 'Not authenticated',
  sessionExpired: 'Your sign-in has expired (or was made before tokens existed). Sign in again to use PDF → CAD.',
  forbidden: 'Your account is not allowed to use PDF → CAD.',
  relogin: 'Sign in again',

  dropTitle: 'Drag & drop PDF / TIFF / scanned images here',
  dropHint: 'or click to choose files · up to 50 files',
  clearList: 'Clear list',
  remove: 'Remove',
  skipped: (n) => `Skipped ${n} file(s) that are not PDF/TIFF/images`,
  fileCount: (n, size) => `${n} file(s) · ${size}`,

  optionsTitle: 'Options',
  pages: 'Pages',
  pagesPh: 'all (e.g. 1-3,5)',
  scale: 'Scale 1 :',
  scalePh: 'read from title block',
  dpi: 'Scan DPI',
  thick: 'Thick line ≥ (mm)',
  ocr: 'Text OCR',
  ocrAuto: 'Auto (when the PDF has no text layer)',
  ocrOn: 'Always on',
  ocrOff: 'Off',
  fitArcs: 'Fit arcs / circles',
  raster: 'Process scanned pages',
  autoRotate: 'Auto-rotate drawing by text direction',
  removeStamps: 'Scans: remove stamps (SPC, MassPro, signatures)',
  keepGlyphs: 'Keep original glyph outlines to check OCR (file ~20× larger)',

  run: 'Convert to DXF',
  stop: 'Stop',
  zip: 'Download all (zip)',
  needFile: 'Please drop at least one file',
  ready: 'Ready',
  waiting: 'Waiting…',
  uploading: 'Uploading…',
  uploadingN: (a, b) => `Uploading ${a} / ${b}`,
  step1: 'Step 1/2: uploading files to the server',
  processing: 'Processing',
  queuedStage: 'Waiting for its turn…',
  queuedMsg: (p) => `Waiting (position ${p} in queue)…`,
  runningMsg: (c, d, t) => `Processing ${c} — ${d}/${t} pages`,
  done: 'Done',
  cancelled: 'Stopped',
  stopped: 'Stopped and deleted the job',
  jobGone: 'The job is no longer on the server (expired or deleted)',
  summary: (status, ok, err) => `${status}: ${ok} DXF${err ? `, ${err} page(s) failed` : ''}`,
  eta: (t) => ` · ~${t} left`,
  sec: (s) => (s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)} min ${Math.round(s % 60)}s`),
  errorPrefix: 'Error: ',

  tabPdf: 'Original',
  tabDxf: 'Result DXF',
  viewerHint: 'Scroll: zoom · drag: pan · double-click: fit',
  viewerEmpty: 'Pick a result row to preview it',
  redrawEmpty: 'Drawings made by the assistant show up here',
  loadingPreview: 'Loading preview…',
  noPreview: 'Preview unavailable',
  localHint: (n) => `${n} — click "Convert to DXF" to process`,
  pageOf: (n, p) => `${n} — page ${p}`,
  dxfInfo: (n, c, w, h, tr) => `${n} — ${c} entities, extents ${w}×${h} mm${tr ? ' (simplified)' : ''}`,
  layers: 'Layers',
  fit: 'Fit',

  results: 'Results',
  thFile: 'File',
  thPage: 'Page',
  thKind: 'Type',
  thScale: 'Scale',
  thObj: 'Entities',
  thTime: 'Time',
  thDxf: 'DXF',
  noResults: 'No results yet',
  processingRow: 'Processing…',
  skippedRow: '(skipped)',
  rotated: (d) => `rotated ${d}°`,
  kinds: { vector: 'Vector', raster: 'Scan', template: 'Template', error: 'Error' },
  learnBtn: 'Teach bot',
  learnTitle: 'Read the title block + parameter table so the assistant can redraw this drawing',
  learning: 'Learning…',
  learnFail: 'Could not learn',
  learned: (n) => `Learned ${n} template(s)`,
  learnMsg: (n, out, list) =>
    `I just learned **${n}** table(s) from ${out}:\n` +
    list.map((t) => `• ${t.title}: ${t.rows} rows, columns ${t.columns.join(', ')}`).join('\n') +
    '\nCheck the table with “What sizes are available?” before using it.',

  botName: (name) => `${name} · Redraw assistant`,
  online: 'online',
  replying: 'drawing…',
  rulesBot: 'rule-based',
  aiBot: (m) => `AI ${m}`,
  aiTitle: 'Chat is understood by a local LLM; dimensions, tables and drawings are computed by pdf2cad',
  template: 'Drawing template',
  draft: 'draft',
  chatPh: (ex) => `Type a request, e.g. ${ex}`,
  send: 'Send',
  download: (n) => `Download ${n}`,
  viewAgain: 'View',
  newChat: 'New drawing',
  paramTable: 'Parameter table',
  paramTableEmpty: 'This template has no parameter table',
  heroLine: 'Type the dimensions and I will redraw the part at 1:1.',
  noTemplates: 'No templates yet. Convert a drawing, then click “Teach bot”.',
  spin: 'Drag to spin',
}

export const PDF2CAD_TEXT: Record<Language, Pdf2cadText> = { vi, en }

export function usePdf2cadText() {
  const { language } = useI18n()
  return { tx: PDF2CAD_TEXT[language], language }
}

// Thông báo server (tiếng Việt) → tiếng Anh
const SERVER_EN: Record<string, string> = {
  'Đọc nét vẽ vector': 'Reading vector strokes',
  'Nhận dạng chữ (OCR)': 'Recognizing text (OCR)',
  'Ghi file DXF': 'Writing DXF file',
  Xong: 'Done',
  'Đọc ảnh scan': 'Reading scanned image',
  'Tìm ký hiệu sửa đổi △': 'Finding revision symbols △',
  'Dò nét vẽ': 'Tracing strokes',
  'Tìm và xoá dấu mộc': 'Finding and removing stamps',
  'Đọc lại từng ô bảng': 'Re-reading table cells',
  'Tạo chữ sửa được': 'Creating editable text',
  'Tỷ lệ FREE (không theo tỷ lệ): hình vẽ chỉ để tham khảo, kích thước đúng là số ghi trên bản vẽ':
    'Scale FREE (not to scale): geometry is for reference only, the true dimensions are the numbers on the drawing',
  'Chưa có file': 'No file selected',
  'Không tìm thấy job (có thể đã hết hạn)': 'Job not found (it may have expired)',
  'Chưa có file DXF': 'No DXF file yet',
  'Không có trang': 'Page not found',
  'Không tìm thấy bảng tham số (hàng tiêu đề D/H/T/L...) trên bản vẽ này':
    'No parameter table (header row D/H/T/L...) was found on this drawing',
  'Không có mẫu này': 'Template not found',
  'Mất kết nối tới server': 'Lost connection to the server',
  'Phiên đăng nhập đã hết hạn, hãy đăng nhập lại': 'Your sign-in has expired, please sign in again',
  'Server pdf2cad trả lời quá lâu, hãy thử lại': 'The pdf2cad server took too long to answer, please try again',
  'Tài khoản không có quyền dùng PDF → CAD': 'Your account is not allowed to use PDF → CAD',
  'Không kết nối được server pdf2cad': 'Cannot connect to the pdf2cad server',
  'Chưa có mẫu nào': 'No templates yet',
  'khung tên': 'title block',
}

const SERVER_EN_RE: [RegExp, string][] = [
  [/^Tối đa (\d+) file mỗi lần$/, 'At most $1 files per upload'],
  [/^(.+): chỉ nhận PDF, TIFF, PNG, JPG, BMP$/, '$1: only PDF, TIFF, PNG, JPG, BMP are accepted'],
  [/^Tổng dung lượng vượt (\d+) MB$/, 'Total size exceeds $1 MB'],
  [/^(.+): file hỏng, có mật khẩu hoặc không đọc được$/, '$1: file is corrupted, password-protected or unreadable'],
]

export function translateServer(language: Language, s: string | null | undefined): string {
  if (!s) return ''
  if (language === 'vi') return s
  if (SERVER_EN[s]) return SERVER_EN[s]
  for (const [re, rep] of SERVER_EN_RE) if (re.test(s)) return s.replace(re, rep)
  return s
}

export const fmtMB = (b: number) => `${(b / 1048576).toFixed(b > 1048576 ? 1 : 2)} MB`

/** khoá 1 dòng kết quả (file + trang) */
export const reportKey = (r: Pdf2cadReport) => `${r.file}#${r.page}`
