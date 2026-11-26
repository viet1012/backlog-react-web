import { PDF2CAD_API_BASE_URL } from '../config/api'
import type { Pdf2cadJob, Pdf2cadOptions } from '../types/pdf2cad'
import { downloadBlob } from '../utils/xlsxWriter'
import { getCurrentEmployeeId, getToken } from './authService'
import { Pdf2cadError, type Pdf2cadApi } from './pdf2cadApi'
import { pdf2cadMockApi } from './pdf2cadMock'

export { Pdf2cadError } from './pdf2cadApi'
export type { Pdf2cadApi } from './pdf2cadApi'

// =========================================================
// pdf2cad – mặc định qua proxy backlog-be: <API_BASE_URL>/api/pdf2cad/...
// (backlog-be chuyển tiếp sang <pdf2cad.base-url>/api/...):
//   POST /jobs · GET|DELETE /jobs/{id} · /files/{name} · /zip
//   /preview/{name} · /pdf/{idx}/{page}.png · POST /learn/{name}
//   GET /templates · POST /bot · GET /health
// Mọi request gửi "Authorization: Bearer <token đăng nhập>" (BE xác thực token + kiểm tra role;
// 401 = phải đăng nhập lại). Vì cần header nên file tải về và ảnh trang gốc đều lấy bằng
// fetch → blob, không dùng link trực tiếp.
// VITE_PDF2CAD_API_BASE=mock → dữ liệu mẫu (pdf2cadMock).
// =========================================================

const BASE = PDF2CAD_API_BASE_URL.replace(/\/$/, '')

export const PDF2CAD_IS_MOCK = !BASE || BASE === 'mock'

function url(path: string) {
  return `${BASE}${path}`
}

// Token: dùng khi BE bật pdf2cad.auth-required. X-Employee-Id: lúc BE tạm tắt xác thực,
// chỉ để BE ghi nhật ký + biết job của ai (không phải bằng chứng danh tính).
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = getToken()
  const employeeId = getCurrentEmployeeId()
  if (token) headers.Authorization = `Bearer ${token}`
  if (employeeId) headers['X-Employee-Id'] = employeeId
  return headers
}

/** lỗi pdf2cad: {"detail"}; lỗi Spring khác: {"message"} */
function errorDetail(body: unknown, status: number) {
  const b = body as { detail?: unknown; message?: unknown } | null
  if (typeof b?.detail === 'string') return b.detail
  if (typeof b?.message === 'string') return b.message
  return `HTTP ${status}`
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url(path), {
      cache: 'no-store',
      ...init,
      headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
    })
  } catch {
    throw new Pdf2cadError('Mất kết nối tới server')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Pdf2cadError(errorDetail(body, response.status), response.status)
  }
  return response
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init)
  return (await response.json().catch(() => null)) as T
}

/** tên file từ Content-Disposition (nếu BE cho đọc header), không có thì dùng tên dự phòng */
function fileNameOf(response: Response, fallback: string) {
  const cd = response.headers.get('Content-Disposition') ?? ''
  const star = /filename\*=UTF-8''([^;]+)/i.exec(cd)
  if (star) return decodeURIComponent(star[1])
  const plain = /filename="?([^";]+)"?/i.exec(cd)
  return plain ? plain[1] : fallback
}

async function download(path: string, fallbackName: string) {
  const response = await send(path)
  downloadBlob(await response.blob(), fileNameOf(response, fallbackName))
}

const jobPath = (id: string) => `/jobs/${encodeURIComponent(id)}`

const httpApi: Pdf2cadApi = {
  health: () => request('/health'),

  createJob(files: File[], options: Pdf2cadOptions, onUpload) {
    const form = new FormData()
    files.forEach((f) => form.append('files', f, f.name))
    form.append('pages', options.pages)
    if (options.scale) form.append('scale', options.scale)
    form.append('dpi', String(options.dpi))
    form.append('thick', String(options.thick))
    form.append('ocr', options.ocr)
    form.append('fit_arcs', String(options.fitArcs))
    form.append('raster', String(options.raster))
    form.append('auto_rotate', String(options.autoRotate))
    form.append('remove_stamps', String(options.removeStamps))
    form.append('keep_glyphs', String(options.keepGlyphs))

    // XHR để có tiến độ tải lên
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url('/jobs'))
      for (const [name, value] of Object.entries(authHeaders())) xhr.setRequestHeader(name, value)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onUpload?.(e.loaded, e.total)
      }
      xhr.onload = () => {
        let data: { id?: string } | null = null
        try {
          data = JSON.parse(xhr.responseText)
        } catch {
          // giữ null
        }
        if (xhr.status === 201 && data?.id) resolve(data.id)
        else reject(new Pdf2cadError(xhr.status === 413 ? 'Tổng dung lượng vượt 200 MB' : errorDetail(data, xhr.status), xhr.status))
      }
      xhr.onerror = () => reject(new Pdf2cadError('Mất kết nối tới server'))
      xhr.send(form)
    })
  },

  async getJob(id) {
    try {
      return await request<Pdf2cadJob>(jobPath(id))
    } catch (error) {
      if (error instanceof Pdf2cadError && error.status === 404) return null
      throw error
    }
  },

  async cancelJob(id) {
    await send(jobPath(id), { method: 'DELETE' })
  },

  downloadFile: (jobId, name) => download(`${jobPath(jobId)}/files/${encodeURIComponent(name)}`, name),

  downloadZip: (jobId) => download(`${jobPath(jobId)}/zip`, `pdf2cad_${jobId.slice(0, 8)}.zip`),

  preview: (jobId, name) => request(`${jobPath(jobId)}/preview/${encodeURIComponent(name)}`),

  async pageImageUrl(jobId, fileIdx, page) {
    const response = await send(`${jobPath(jobId)}/pdf/${fileIdx}/${page}.png?dpi=110`)
    return URL.createObjectURL(await response.blob())
  },

  learn: (jobId, name) => request(`${jobPath(jobId)}/learn/${encodeURIComponent(name)}`, { method: 'POST' }),

  templates: () => request('/templates'),

  bot: (body) =>
    request('/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
}

export const pdf2cadApi: Pdf2cadApi = PDF2CAD_IS_MOCK ? pdf2cadMockApi : httpApi
