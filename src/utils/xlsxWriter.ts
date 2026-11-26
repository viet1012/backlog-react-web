// =========================================================
// GHI FILE .XLSX TỐI GIẢN NGAY TRÊN TRÌNH DUYỆT (không thêm thư viện)
// zip STORE (không nén) + SpreadsheetML; chuỗi ghi kiểu inlineStr.
// Hỗ trợ: style (font / nền / viền / định dạng số / căn lề), merge,
// cố định dòng-cột (freeze), độ rộng cột.
// =========================================================

export interface XlsxStyle {
  bold?: boolean
  italic?: boolean
  fontSize?: number
  // RRGGBB
  color?: string
  // RRGGBB
  fill?: string
  // mã định dạng số của Excel, vd '#,##0.00'
  numFmt?: string
  align?: 'left' | 'center' | 'right'
  vAlign?: 'top' | 'center' | 'bottom'
  wrap?: boolean
  border?: boolean
}

export type XlsxValue = string | number | null

export interface XlsxCell {
  v: XlsxValue
  s?: XlsxStyle
}

export type XlsxRow = (XlsxCell | XlsxValue)[]

export interface XlsxSheet {
  name: string
  rows: XlsxRow[]
  // độ rộng cột (đơn vị ký tự), theo thứ tự cột
  colWidths?: number[]
  // vùng gộp, vd 'A1:A2'
  merges?: string[]
  // số dòng / cột cố định khi cuộn
  freeze?: { rows?: number; cols?: number }
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const NS_PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships'
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'

// =========================================================
// ĐỊA CHỈ Ô / NGÀY
// =========================================================

// 0 → A, 25 → Z, 26 → AA
export function xlsxColumn(index: number): string {
  let n = index + 1
  let name = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

// (0, 0) → A1
export function xlsxRef(row: number, col: number): string {
  return `${xlsxColumn(col)}${row + 1}`
}

export function xlsxRange(row1: number, col1: number, row2: number, col2: number): string {
  return `${xlsxRef(row1, col1)}:${xlsxRef(row2, col2)}`
}

// YYYY-MM-DD → số ngày của Excel (hệ 1900); dùng kèm numFmt ngày
export function xlsxDateSerial(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!match) return null
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  // 25569 = số ngày từ 1899-12-30 tới 1970-01-01
  return utc / 86_400_000 + 25_569
}

// =========================================================
// XML
// =========================================================

function xmlEscape(text: string): string {
  // bỏ ký tự điều khiển XML không cho phép (giữ tab / xuống dòng)
  let cleaned = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) continue
    cleaned += ch
  }

  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// =========================================================
// STYLE
// =========================================================

function createPool(initial: string[]) {
  const items = [...initial]
  const index = new Map(items.map((item, i) => [item, i]))

  return {
    items,
    add(xml: string): number {
      const found = index.get(xml)
      if (found !== undefined) return found
      items.push(xml)
      index.set(xml, items.length - 1)
      return items.length - 1
    },
  }
}

const THIN_BORDER_COLOR = 'FFD0D7DE'

function createStyleBook() {
  const fonts = createPool(['<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>'])
  const fills = createPool([
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
  ])
  const side = (name: string) => `<${name} style="thin"><color rgb="${THIN_BORDER_COLOR}"/></${name}>`
  const borders = createPool([
    '<border><left/><right/><top/><bottom/><diagonal/></border>',
    `<border>${side('left')}${side('right')}${side('top')}${side('bottom')}<diagonal/></border>`,
  ])
  const numFmts = new Map<string, number>()
  const xfs = createPool(['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'])
  // cùng 1 object style → khỏi dựng lại XML
  const cache = new Map<XlsxStyle, number>()

  function numFmtId(code: string): number {
    const found = numFmts.get(code)
    if (found !== undefined) return found
    // mã tự định nghĩa bắt đầu từ 164
    const id = 164 + numFmts.size
    numFmts.set(code, id)
    return id
  }

  function index(style: XlsxStyle | undefined): number {
    if (!style) return 0
    const cached = cache.get(style)
    if (cached !== undefined) return cached

    const hasFont = style.bold || style.italic || style.color || style.fontSize
    const fontId = hasFont
      ? fonts.add(
        `<font>${style.bold ? '<b/>' : ''}${style.italic ? '<i/>' : ''}<sz val="${style.fontSize ?? 11}"/>`
          + `${style.color ? `<color rgb="FF${style.color}"/>` : ''}<name val="Calibri"/><family val="2"/></font>`,
      )
      : 0
    const fillId = style.fill
      ? fills.add(`<fill><patternFill patternType="solid"><fgColor rgb="FF${style.fill}"/><bgColor indexed="64"/></patternFill></fill>`)
      : 0
    const borderId = style.border ? 1 : 0
    const fmtId = style.numFmt ? numFmtId(style.numFmt) : 0

    const alignAttrs = [
      style.align ? ` horizontal="${style.align}"` : '',
      style.vAlign ? ` vertical="${style.vAlign}"` : '',
      style.wrap ? ' wrapText="1"' : '',
    ].join('')

    const attrs = [
      `numFmtId="${fmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0"`,
      fmtId ? ' applyNumberFormat="1"' : '',
      fontId ? ' applyFont="1"' : '',
      fillId ? ' applyFill="1"' : '',
      borderId ? ' applyBorder="1"' : '',
      alignAttrs ? ' applyAlignment="1"' : '',
    ].join('')

    const xf = alignAttrs ? `<xf ${attrs}><alignment${alignAttrs}/></xf>` : `<xf ${attrs}/>`
    const id = xfs.add(xf)
    cache.set(style, id)
    return id
  }

  function toXml(): string {
    const fmtXml = numFmts.size > 0
      ? `<numFmts count="${numFmts.size}">${[...numFmts]
        .map(([code, id]) => `<numFmt numFmtId="${id}" formatCode="${xmlEscape(code)}"/>`)
        .join('')}</numFmts>`
      : ''

    return XML_HEAD
      + `<styleSheet xmlns="${NS_MAIN}">`
      + fmtXml
      + `<fonts count="${fonts.items.length}">${fonts.items.join('')}</fonts>`
      + `<fills count="${fills.items.length}">${fills.items.join('')}</fills>`
      + `<borders count="${borders.items.length}">${borders.items.join('')}</borders>`
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + `<cellXfs count="${xfs.items.length}">${xfs.items.join('')}</cellXfs>`
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
      + '</styleSheet>'
  }

  return { index, toXml }
}

type StyleBook = ReturnType<typeof createStyleBook>

// =========================================================
// SHEET / WORKBOOK
// =========================================================

function toCell(raw: XlsxCell | XlsxValue): XlsxCell {
  return raw !== null && typeof raw === 'object' ? raw : { v: raw }
}

function cellXml(raw: XlsxCell | XlsxValue, ref: string, styles: StyleBook): string {
  const cell = toCell(raw)
  const styleId = styles.index(cell.s)
  const s = styleId ? ` s="${styleId}"` : ''

  if (cell.v === null || cell.v === '' || (typeof cell.v === 'number' && !Number.isFinite(cell.v))) {
    // ô trống vẫn giữ style (viền / nền của vùng merge)
    return styleId ? `<c r="${ref}"${s}/>` : ''
  }

  if (typeof cell.v === 'number') return `<c r="${ref}"${s}><v>${cell.v}</v></c>`

  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell.v)}</t></is></c>`
}

function sheetXml(sheet: XlsxSheet, styles: StyleBook): string {
  const freezeRows = sheet.freeze?.rows ?? 0
  const freezeCols = sheet.freeze?.cols ?? 0

  let view = '<sheetView workbookViewId="0"/>'
  if (freezeRows > 0 || freezeCols > 0) {
    const pane = freezeRows > 0 && freezeCols > 0 ? 'bottomRight' : freezeRows > 0 ? 'bottomLeft' : 'topRight'
    view = '<sheetView workbookViewId="0">'
      + `<pane${freezeCols > 0 ? ` xSplit="${freezeCols}"` : ''}${freezeRows > 0 ? ` ySplit="${freezeRows}"` : ''}`
      + ` topLeftCell="${xlsxRef(freezeRows, freezeCols)}" activePane="${pane}" state="frozen"/>`
      + `<selection pane="${pane}"/></sheetView>`
  }

  const cols = sheet.colWidths && sheet.colWidths.length > 0
    ? `<cols>${sheet.colWidths
      .map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`)
      .join('')}</cols>`
    : ''

  const rows = sheet.rows
    .map((row, r) => `<row r="${r + 1}">${row.map((cell, c) => cellXml(cell, xlsxRef(r, c), styles)).join('')}</row>`)
    .join('')

  const merges = sheet.merges && sheet.merges.length > 0
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`
    : ''

  return XML_HEAD
    + `<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">`
    + `<sheetViews>${view}</sheetViews>`
    + '<sheetFormatPr defaultRowHeight="15"/>'
    + cols
    + `<sheetData>${rows}</sheetData>`
    + merges
    + '</worksheet>'
}

// Tên sheet: ≤ 31 ký tự, không chứa [ ] : * ? / \, không trùng
function sheetNames(sheets: XlsxSheet[]): string[] {
  const used = new Set<string>()

  return sheets.map((sheet, i) => {
    const base = sheet.name.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || `Sheet${i + 1}`
    let name = base
    let n = 2
    while (used.has(name.toLowerCase())) {
      const suffix = ` (${n++})`
      name = base.slice(0, 31 - suffix.length) + suffix
    }
    used.add(name.toLowerCase())
    return name
  })
}

export function buildXlsx(sheets: XlsxSheet[]): Blob {
  const styles = createStyleBook()
  const names = sheetNames(sheets)

  // sheet phải dựng trước styles.xml (style được đăng ký khi ghi ô)
  const sheetFiles = sheets.map((sheet, i) => ({
    path: `xl/worksheets/sheet${i + 1}.xml`,
    content: sheetXml(sheet, styles),
  }))

  const contentTypes = XML_HEAD
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + sheetFiles
      .map((f) => `<Override PartName="/${f.path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
      .join('')
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + '</Types>'

  const rootRels = XML_HEAD
    + `<Relationships xmlns="${NS_PKG_REL}">`
    + `<Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/>`
    + '</Relationships>'

  const workbook = XML_HEAD
    + `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">`
    + '<bookViews><workbookView/></bookViews>'
    + `<sheets>${names
      .map((name, i) => `<sheet name="${xmlEscape(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('')}</sheets>`
    + '</workbook>'

  const workbookRels = XML_HEAD
    + `<Relationships xmlns="${NS_PKG_REL}">`
    + sheetFiles
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS_REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join('')
    + `<Relationship Id="rId${sheetFiles.length + 1}" Type="${NS_REL}/styles" Target="styles.xml"/>`
    + '</Relationships>'

  const bytes = zipStore([
    { path: '[Content_Types].xml', content: contentTypes },
    { path: '_rels/.rels', content: rootRels },
    { path: 'xl/workbook.xml', content: workbook },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRels },
    { path: 'xl/styles.xml', content: styles.toXml() },
    ...sheetFiles,
  ])

  return new Blob([bytes], { type: XLSX_MIME })
}

// =========================================================
// ZIP (STORE – không nén)
// =========================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date: Date): { time: number; day: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    day: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  }
}

/** zip không nén (store) – dùng cho xlsx và các file text tải về cùng lúc (vd DXF mẫu của pdf2cad) */
export function zipStore(files: { path: string; content: string }[]): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  const { time, day } = dosDateTime(new Date())

  const entries = files.map((file) => {
    const name = encoder.encode(file.path)
    const data = encoder.encode(file.content)
    return { name, data, crc: crc32(data), offset: 0 }
  })

  const localSize = entries.reduce((sum, e) => sum + 30 + e.name.length + e.data.length, 0)
  const centralSize = entries.reduce((sum, e) => sum + 46 + e.name.length, 0)
  const out = new Uint8Array(new ArrayBuffer(localSize + centralSize + 22))
  const view = new DataView(out.buffer)
  let pos = 0

  const u16 = (value: number) => {
    view.setUint16(pos, value, true)
    pos += 2
  }
  const u32 = (value: number) => {
    view.setUint32(pos, value >>> 0, true)
    pos += 4
  }
  const bytes = (value: Uint8Array) => {
    out.set(value, pos)
    pos += value.length
  }

  // cờ 0x0800 = tên file UTF-8
  for (const e of entries) {
    e.offset = pos
    u32(0x04034b50)
    u16(20)
    u16(0x0800)
    u16(0)
    u16(time)
    u16(day)
    u32(e.crc)
    u32(e.data.length)
    u32(e.data.length)
    u16(e.name.length)
    u16(0)
    bytes(e.name)
    bytes(e.data)
  }

  const centralStart = pos
  for (const e of entries) {
    u32(0x02014b50)
    u16(20)
    u16(20)
    u16(0x0800)
    u16(0)
    u16(time)
    u16(day)
    u32(e.crc)
    u32(e.data.length)
    u32(e.data.length)
    u16(e.name.length)
    u16(0)
    u16(0)
    u16(0)
    u16(0)
    u32(0)
    u32(e.offset)
    bytes(e.name)
  }

  u32(0x06054b50)
  u16(0)
  u16(0)
  u16(entries.length)
  u16(entries.length)
  u32(pos - centralStart)
  u32(centralStart)
  u16(0)

  return out
}

// =========================================================
// TẢI FILE
// =========================================================

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // thu hồi sau khi trình duyệt đã nhận file
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
