// Gộp kết quả soát khung (CSV) vào JSON layout của Machine Locator.
// Thêm cho mỗi máy: "src" (manual/cad/old) và "r": true nếu confidence = review.
//
// Chạy từ thư mục gốc backlog-web:
//   node scripts/machine-locator/merge-review.mjs [json] [csv]
import fs from 'node:fs'

const jsonPath = process.argv[2] ?? 'src/data/machineLocator/factoryB-f1.json'
const csvPath = process.argv[3] ?? 'src/data/machineLocator/factoryB-f1-review.csv'

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }

  row.push(cell)
  if (row.some((v) => v !== '')) rows.push(row)

  return rows
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const [header, ...rows] = parseCsv(fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, ''))
const col = (name) => {
  const i = header.indexOf(name)
  if (i < 0) throw new Error(`CSV thiếu cột ${name}`)
  return i
}
const iCode = col('machine_code')
const iSrc = col('source')
const iConf = col('confidence')

const review = new Map(rows.map((r) => [r[iCode].trim(), r]))
const missing = []
let nReview = 0

for (const [code, m] of Object.entries(data.m)) {
  const r = review.get(code)

  delete m.src
  delete m.r

  if (!r) {
    missing.push(code)
    continue
  }

  m.src = r[iSrc].trim()
  if (r[iConf].trim() === 'review') {
    m.r = true
    nReview++
  }
}

const extra = [...review.keys()].filter((c) => !data.m[c])

// Một máy một dòng, giống các file layout khác
const lines = Object.entries(data.m).map(([c, v]) => `    ${JSON.stringify(c)}: ${JSON.stringify(v)}`)
const out = `{\n  "crop": ${JSON.stringify(data.crop)},\n  "page": ${JSON.stringify(data.page)},\n  "ppp": ${data.ppp},\n  "m": {\n${lines.join(',\n')}\n  }\n}\n`

JSON.parse(out)
fs.writeFileSync(jsonPath, out)

console.log(`${Object.keys(data.m).length} máy, ${nReview} cần soát`)
if (missing.length) console.log(`Không có trong CSV: ${missing.join(', ')}`)
if (extra.length) console.log(`Có trong CSV nhưng không có trong JSON: ${extra.join(', ')}`)
