import fs from 'node:fs/promises'
import path from 'node:path'
import type {
  IncomingMessage,
  ServerResponse,
} from 'node:http'
import type { Plugin } from 'vite'

import {
  machineLayoutFiles,
  machineLayoutInit,
} from '../src/config/machineLocatorFiles.ts'

// =========================================================
// MACHINE LOCATOR – LƯU THẲNG VÀO FILE JSON KHI CHẠY DEV
//   GET    /__machine-locator/:layoutId
//   PUT    /__machine-locator/:layoutId/machines/:code   body {boxes:[{x,y,w,h}]}
//   DELETE /__machine-locator/:layoutId/machines/:code
// Chỉ đăng ký trong dev server (apply: 'serve'), không có trong bản build.
// =========================================================

const PREFIX = '/__machine-locator/'
const CODE_RE = /^[AL]-\d{2,5}$/
const MAX_BODY = 1024 * 1024

interface RawMachine {
  b: number[][]
  p?: (number[][][] | null)[]
  u?: boolean
  src?: string
  r?: boolean
  [key: string]: unknown
}

interface LayoutFile {
  m: Record<string, RawMachine>
  [key: string]: unknown
}

class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const round1 = (v: number) => Math.round(v * 10) / 10

function resolveFiles(root: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(machineLayoutFiles).map(([id, file]) => [id, path.resolve(root, file)]),
  )
}

// Giữ format hiện tại: mỗi máy một dòng
function formatLayout(data: LayoutFile): string {
  const head = Object.entries(data)
    .filter(([k]) => k !== 'm')
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
  const lines = Object.entries(data.m)
    .map(([c, v]) => `    ${JSON.stringify(c)}: ${JSON.stringify(v)}`)

  return `{\n${head.join(',\n')},\n  "m": {\n${lines.join(',\n')}\n  }\n}\n`
}

// Layout mới chưa có file dữ liệu: tạo file với m = {} từ machineLayoutInit
async function ensureLayoutFile(id: string, file: string): Promise<void> {
  try {
    await fs.access(file)
    return
  } catch {
    // chưa có file
  }

  const init = machineLayoutInit[id]

  if (!init) return

  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, formatLayout({ ...init, m: {} }), { encoding: 'utf8', flag: 'wx' })
    .catch((e: NodeJS.ErrnoException) => {
      if (e.code !== 'EEXIST') throw e
    })
}

async function readLayout(file: string): Promise<LayoutFile> {
  const data = JSON.parse(await fs.readFile(file, 'utf8')) as LayoutFile

  if (!data || typeof data !== 'object' || !data.m || typeof data.m !== 'object') {
    throw new HttpError(500, `${path.basename(file)} không đúng format {crop, page, ppp, m}.`)
  }

  return data
}

async function renameWithRetry(from: string, to: string) {
  // Windows: file có thể đang bị editor / antivirus giữ trong chốc lát
  for (let i = 0; ; i++) {
    try {
      await fs.rename(from, to)
      return
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code
      if (i >= 4 || (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES')) throw e
      await new Promise((r) => setTimeout(r, 50 * (i + 1)))
    }
  }
}

type Outline = number[][][] | null

// p của 1 khung: null hoặc mảng đa giác, mỗi đa giác >= 3 điểm [x, y] hữu hạn
function parseOutline(value: unknown, i: number): Outline {
  if (value === undefined || value === null) return null

  const ok = Array.isArray(value) && value.length > 0 && value.every((poly) =>
    Array.isArray(poly) && poly.length >= 3 && poly.every((pt) =>
      Array.isArray(pt) && pt.length === 2 && pt.every((v) => typeof v === 'number' && Number.isFinite(v))))

  if (!ok) throw new HttpError(400, `Đường bao (p) của khung #${i + 1} không hợp lệ.`)

  return value as number[][][]
}

function parseBoxes(body: unknown): { b: number[][], p: Outline[] } {
  const boxes = (body as { boxes?: unknown } | null)?.boxes

  if (!Array.isArray(boxes) || boxes.length === 0) {
    throw new HttpError(400, 'Cần boxes là mảng khung {x,y,w,h} không rỗng.')
  }

  const b = boxes.map((box, i) => {
    const v = [box?.x, box?.y, box?.w, box?.h].map(Number)

    if (!v.every(Number.isFinite) || v[2] <= 0 || v[3] <= 0) {
      throw new HttpError(400, `Khung #${i + 1} không hợp lệ (x, y là số; w, h > 0).`)
    }

    return v.map(round1)
  })

  return { b, p: boxes.map((box, i) => parseOutline(box?.p, i)) }
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []

    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Body quá lớn.'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null)
      } catch {
        reject(new HttpError(400, 'Body không phải JSON hợp lệ.'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

export function machineLocatorDevStore(): Plugin {
  return {
    name: 'machine-locator-dev-store',
    apply: 'serve',

    // Không theo dõi file dữ liệu: lưu xong không reload / HMR làm mất trạng thái trang
    config(config) {
      const files = Object.values(resolveFiles(config.root ?? process.cwd()))

      return {
        server: {
          watch: {
            ignored: files.map((f) => f.replace(/\\/g, '/')),
          },
        },
      }
    },

    configureServer(server) {
      const files = resolveFiles(server.config.root)
      const backedUp = new Set<string>()
      let queue: Promise<unknown> = Promise.resolve()

      server.watcher.unwatch(Object.values(files))

      // Tạo sẵn file rỗng cho layout mới trước khi app import JSON tĩnh
      for (const [id, file] of Object.entries(files)) {
        ensureLayoutFile(id, file).catch((e) => {
          server.config.logger.error(`[machine-locator] Không tạo được ${file}: ${e instanceof Error ? e.message : e}`)
        })
      }

      // Ghi tuần tự để 2 request liên tiếp không đè nhau
      function serialized<T>(task: () => Promise<T>): Promise<T> {
        const run = queue.then(task, task)
        queue = run.catch(() => undefined)
        return run
      }

      async function writeLayout(file: string, data: LayoutFile) {
        if (!backedUp.has(file)) {
          await fs.copyFile(file, `${file}.bak`)
          backedUp.add(file)
        }

        const tmp = `${file}.${process.pid}.tmp`

        await fs.writeFile(tmp, formatLayout(data), 'utf8')
        await renameWithRetry(tmp, file)
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        if (!url.startsWith(PREFIX)) {
          next()
          return
        }

        try {
          const parts = url.slice(PREFIX.length).split('/').filter(Boolean).map(decodeURIComponent)
          const file = files[parts[0]]

          if (!file) throw new HttpError(404, `Không có layout "${parts[0] ?? ''}".`)

          await ensureLayoutFile(parts[0], file)

          if (parts.length === 1) {
            if (req.method !== 'GET') throw new HttpError(405, 'Chỉ hỗ trợ GET.')

            sendJson(res, 200, await fs.readFile(file, 'utf8'))
            return
          }

          if (parts.length !== 3 || parts[1] !== 'machines') throw new HttpError(404, 'Không có endpoint này.')

          const code = parts[2]

          if (!CODE_RE.test(code)) throw new HttpError(400, 'Mã cần dạng A-1234 hoặc L-123.')

          if (req.method === 'PUT') {
            const { b, p } = parseBoxes(await readBody(req))

            const data = await serialized(async () => {
              const d = await readLayout(file)
              const prev = d.m[code]
              const next: RawMachine = { ...prev, b, u: false, src: 'manual' }

              delete next.r
              // p song song với b; không khung nào có đường bao thì bỏ hẳn trường p
              if (p.some(Boolean)) next.p = p
              else delete next.p
              d.m[code] = next
              await writeLayout(file, d)

              return d
            })

            sendJson(res, 200, data)
            return
          }

          if (req.method === 'DELETE') {
            const data = await serialized(async () => {
              const d = await readLayout(file)

              if (d.m[code]) {
                delete d.m[code]
                await writeLayout(file, d)
              }

              return d
            })

            sendJson(res, 200, data)
            return
          }

          throw new HttpError(405, 'Chỉ hỗ trợ PUT / DELETE.')
        } catch (e) {
          const status = e instanceof HttpError ? e.status : 500

          sendJson(res, status, { message: e instanceof Error ? e.message : String(e) })
        }
      })
    },
  }
}
