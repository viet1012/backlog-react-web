// =========================================================
// cleanLatex – đổi LaTeX trong câu trả lời của assistant thành text đọc được
// trước khi đưa vào ReactMarkdown. Không động vào code block ```…```.
// =========================================================

/** Lệnh LaTeX dạng \chữ – điều kiện để coi $…$ là công thức (tránh "$5 và $10") */
const HAS_COMMAND = /\\[a-zA-Z]+/

/** \text{X} … → X */
const TEXT_COMMAND = /\\(?:text|textbf|textit|textrm|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g

/** Ký hiệu → Unicode. Lookahead chặn khớp nhầm (\le trong \left, \ne trong \neg…) */
const SYMBOLS: [RegExp, string][] = [
  [/\\times(?![a-zA-Z])/g, '×'],
  [/\\cdot(?![a-zA-Z])/g, '·'],
  [/\\div(?![a-zA-Z])/g, '÷'],
  [/\\pm(?![a-zA-Z])/g, '±'],
  [/\\leq?(?![a-zA-Z])/g, '≤'],
  [/\\geq?(?![a-zA-Z])/g, '≥'],
  [/\\neq?(?![a-zA-Z])/g, '≠'],
  [/\\approx(?![a-zA-Z])/g, '≈'],
  [/\\%/g, '%'],
]

/** "1 từ" → không cần bọc ngoặc khi làm tử/mẫu */
const SINGLE_WORD = /^[\p{L}\p{N}_.,%×·]+$/u

// ---------------------------------------------------------
// \frac{A}{B}
// ---------------------------------------------------------

/** Đọc 1 nhóm {…} (cân ngoặc) hoặc 1 ký tự / 1 lệnh bắt đầu tại i. */
function readGroup(s: string, start: number): { content: string; end: number } | null {
  let i = start
  while (s[i] === ' ') i += 1
  if (i >= s.length) return null

  if (s[i] === '{') {
    let depth = 0
    for (let j = i; j < s.length; j += 1) {
      if (s[j] === '{') depth += 1
      else if (s[j] === '}') {
        depth -= 1
        if (depth === 0) return { content: s.slice(i + 1, j), end: j + 1 }
      }
    }
    return null // thiếu ngoặc đóng
  }

  const command = /^\\[a-zA-Z]+/.exec(s.slice(i))
  if (command) return { content: command[0], end: i + command[0].length }
  return { content: s[i], end: i + 1 } // \frac12
}

function wrapPart(part: string): string {
  const value = part.trim()
  return SINGLE_WORD.test(value) ? value : `(${value})`
}

/** \frac{A}{B} → (A) / (B); xử lý đệ quy nên hỗ trợ lồng nhau. */
function convertFrac(s: string): string {
  const fracRe = /\\[dt]?frac(?![a-zA-Z])/g
  let out = ''
  let last = 0
  let match: RegExpExecArray | null

  while ((match = fracRe.exec(s)) !== null) {
    const num = readGroup(s, match.index + match[0].length)
    const den = num && readGroup(s, num.end)
    if (!num || !den) continue // không parse được → giữ nguyên

    out += `${s.slice(last, match.index)}${wrapPart(convertFrac(num.content))} / ${wrapPart(convertFrac(den.content))}`
    last = den.end
    fracRe.lastIndex = den.end
  }

  return out + s.slice(last)
}

// ---------------------------------------------------------
// Chuyển lệnh
// ---------------------------------------------------------

function replaceTextCommands(s: string): string {
  let prev: string
  let next = s
  do {
    prev = next
    next = prev.replace(TEXT_COMMAND, '$1')
  } while (next !== prev)
  return next
}

function replaceSymbols(s: string): string {
  return SYMBOLS.reduce((acc, [re, symbol]) => acc.replace(re, symbol), s)
}

/** Dùng cho text thường (ngoài công thức): chỉ đổi các lệnh đã biết, giữ nguyên khoảng trắng/markdown. */
function convertLooseCommands(s: string): string {
  return replaceSymbols(convertFrac(replaceTextCommands(s)))
}

/** Dùng cho nội dung bên trong công thức. */
function convertMath(expr: string): string {
  let s = replaceTextCommands(expr)
  s = convertFrac(s)
  s = replaceSymbols(s)
  s = s
    .replace(/\\(?:left|right)(?![a-zA-Z])/g, '')
    .replace(/\\(?:quad|qquad)(?![a-zA-Z])/g, ' ')
    .replace(/\\[,;!: ]/g, ' ')
    .replace(/\\\\/g, ' ')
    // x^{2} → x^2, bỏ ngoặc nhóm còn sót
    .replace(/[{}]/g, '')
  return s.replace(/\s+/g, ' ').trim()
}

/** Khối công thức → dòng riêng, in nghiêng. Escape * và _ để không vỡ emphasis. */
function toBlock(expr: string): string {
  const text = convertMath(expr)
  if (!text) return ''
  return `\n\n*${text.replace(/([*_])/g, '\\$1')}*\n\n`
}

/** Công thức inline đứng một mình trên 1 dòng → coi như khối. */
function isAloneOnLine(source: string, offset: number, length: number): boolean {
  const lineStart = source.lastIndexOf('\n', offset - 1) + 1
  const lineEndIdx = source.indexOf('\n', offset + length)
  const lineEnd = lineEndIdx === -1 ? source.length : lineEndIdx
  return source.slice(lineStart, offset).trim() === ''
    && source.slice(offset + length, lineEnd).trim() === ''
}

function cleanSegment(text: string): string {
  let s = text

  // Khối: \[ … \] và $$ … $$ (có thể nhiều dòng)
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_m, inner: string) => toBlock(inner))
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (match, inner: string) =>
    HAS_COMMAND.test(inner) ? toBlock(inner) : match)

  // Inline: \( … \) và $ … $ (trên 1 dòng; bỏ qua \$ đã escape)
  const inline = (match: string, inner: string, offset: number, source: string) =>
    isAloneOnLine(source, offset, match.length) ? toBlock(inner) : convertMath(inner)

  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (match, inner: string, offset: number, source: string) =>
    inline(match, inner, offset, source))
  s = s.replace(/(?<![\\$])\$(?!\$)([^\n$]+?)(?<!\\)\$(?!\$)/g,
    (match, inner: string, offset: number, source: string) =>
      HAS_COMMAND.test(inner) ? inline(match, inner, offset, source) : match)

  // Lệnh rơi ngoài dấu bao ("Actual \times 100")
  s = convertLooseCommands(s)

  // khối công thức chèn \n\n → gộp dòng trống thừa
  return s.replace(/\n{3,}/g, '\n\n')
}

/**
 * Làm sạch LaTeX trong markdown của assistant.
 * Code block ```…``` (kể cả chưa đóng) giữ nguyên.
 */
export function cleanLatex(markdown: string): string {
  if (!markdown.includes('\\') && !markdown.includes('$')) return markdown

  return markdown
    .split(/(```[\s\S]*?(?:```|$))/)
    .map((part, index) => (index % 2 === 1 ? part : cleanSegment(part)))
    .join('')
    .trim()
}
