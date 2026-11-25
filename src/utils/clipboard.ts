// Sao chép bảng ra clipboard: text/plain = TSV (dán vào Excel tách đúng cột),
// text/html = <table> (dán vào Outlook / Teams / Word giữ dạng bảng).

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// tab / xuống dòng trong ô sẽ làm lệch cột khi dán vào Excel
function tsvCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, ' ')
}

export function tableToTsv(rows: string[][]): string {
  return rows.map((row) => row.map(tsvCell).join('\t')).join('\r\n')
}

export function tableToHtml(header: string[], body: string[][], footer: string[][] = []): string {
  const cell = (tag: 'th' | 'td', value: string, bold = false) =>
    `<${tag} style="border:1px solid #bfbfbf;padding:2px 6px;${bold ? 'font-weight:bold;' : ''}">${escapeHtml(value)}</${tag}>`
  const tr = (cells: string) => `<tr>${cells}</tr>`

  return [
    '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px">',
    `<thead>${tr(header.map((h) => cell('th', h, true)).join(''))}</thead>`,
    `<tbody>${body.map((row) => tr(row.map((v) => cell('td', v)).join(''))).join('')}</tbody>`,
    footer.length > 0 ? `<tfoot>${footer.map((row) => tr(row.map((v) => cell('td', v, true)).join(''))).join('')}</tfoot>` : '',
    '</table>',
  ].join('')
}

// Trang chạy qua http (không phải secure context) không có navigator.clipboard
// → dùng execCommand('copy') qua textarea ẩn (chỉ chép được text/plain)
function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

/** Chép bảng (TSV + HTML khi trình duyệt cho phép). Trả về false nếu bị chặn. */
export async function copyTable(header: string[], body: string[][], footer: string[][] = []): Promise<boolean> {
  const text = tableToTsv([header, ...body, ...footer])

  if (navigator.clipboard && window.isSecureContext) {
    try {
      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'text/html': new Blob([tableToHtml(header, body, footer)], { type: 'text/html' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(text)
      }
      return true
    } catch {
      // bị chặn quyền → thử cách cũ
    }
  }

  return legacyCopy(text)
}
