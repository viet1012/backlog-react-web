import { API_BASE_URL } from '../config/api'
import type {
  FloorDto,
  LayoutData,
  MachineBulkOp,
  MachineEdit,
  MachineLayoutConfig,
} from '../types/machineLocator'
import { getCurrentEmployeeId } from './authService'

// =========================================================
// MACHINE STORE – API backlog-be (/api/machine-locator)
// Mỗi lệnh ghi gửi ifVersion = version floor đang giữ; server trả 409 khi
// floor đã bị người khác sửa. Lệnh ghi trả về cả floor (kèm version mới).
// =========================================================

const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/api/machine-locator`

export interface MachineStoreState {
  data: LayoutData
  version: number
}

export type MachineStoreErrorCode =
  | 'conflict'
  | 'auth'
  | 'api_fail'

export class MachineStoreError extends Error {
  readonly code: MachineStoreErrorCode
  readonly status?: number

  constructor(code: MachineStoreErrorCode, message?: string, status?: number) {
    super(message ?? code)

    this.name = 'MachineStoreError'
    this.code = code
    this.status = status
  }
}

// =========================================================
// HTTP
// =========================================================

function floorUrl(floorId: string, path = '') {
  return `${API_URL}/floors/${encodeURIComponent(floorId)}${path}`
}

function machineUrl(floorId: string, code: string, path = '') {
  return floorUrl(floorId, `/machines/${encodeURIComponent(code)}${path}`)
}

async function request<T>(
  url: string,
  init: RequestInit = {},
  write = false,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (init.body) headers['Content-Type'] = 'application/json'

  if (write) {
    const employeeId = getCurrentEmployeeId()

    if (!employeeId) throw new MachineStoreError('auth', 'Chưa đăng nhập.')

    headers['X-Employee-Id'] = employeeId
  }

  let res: Response

  try {
    res = await fetch(url, { cache: 'no-store', ...init, headers })
  } catch (e) {
    throw new MachineStoreError('api_fail', e instanceof Error ? e.message : 'mất kết nối server')
  }

  const body = await res.json().catch(() => null) as (T & { message?: string }) | null

  if (!res.ok) {
    throw new MachineStoreError(
      res.status === 409 ? 'conflict' : res.status === 401 || res.status === 403 ? 'auth' : 'api_fail',
      body?.message || `HTTP ${res.status}`,
      res.status,
    )
  }

  if (!body) throw new MachineStoreError('api_fail', 'Response rỗng hoặc không phải JSON.')

  return body
}

// Ảnh layout nằm trong public/assets: imageUrl tương đối thì gắn BASE_URL của app
function resolveImageUrl(url: string): string {
  return /^(https?:)?\/\//.test(url)
    ? url
    : `${import.meta.env.BASE_URL}${url.replace(/^\/+/, '')}`
}

function toLayoutConfig(f: FloorDto): MachineLayoutConfig {
  const image = resolveImageUrl(f.imageUrl)
  const title = f.drawingTitle || f.name

  return {
    id: f.id,
    name: f.name,
    drawingTitle: title,
    image,
    imageAlt: `Layout ${title}`,
    exportMeta: {
      factory: f.exportMeta?.factory ?? f.name,
      floor: f.exportMeta?.floor ?? '',
      sourcePdf: f.exportMeta?.sourcePdf ?? '',
      imageFile: f.exportMeta?.imageFile ?? (image.split('/').pop() || `${f.id}.png`),
      filePrefix: f.exportMeta?.filePrefix ?? f.id,
    },
  }
}

function toState(f: FloorDto): MachineStoreState {
  if (!f.m || !f.crop || !f.page || !f.ppp || typeof f.version !== 'number') {
    throw new MachineStoreError('api_fail', `Dữ liệu floor ${f.id ?? ''} thiếu crop / page / ppp / version / m.`)
  }

  return { data: { crop: f.crop, page: f.page, ppp: f.ppp, m: f.m }, version: f.version }
}

function write(
  url: string,
  method: 'PUT' | 'POST' | 'DELETE',
  body?: object,
): Promise<MachineStoreState> {
  return request<FloorDto>(url, { method, body: body && JSON.stringify(body) }, true).then(toState)
}

// =========================================================
// API
// =========================================================

// Danh sách tab layout (thứ tự theo server)
export async function listFloors(): Promise<MachineLayoutConfig[]> {
  const floors = await request<FloorDto[]>(`${API_URL}/floors`)

  if (!Array.isArray(floors)) throw new MachineStoreError('api_fail', 'Danh sách floor không hợp lệ.')

  return floors.map(toLayoutConfig)
}

export async function loadMachineStore(
  layout: MachineLayoutConfig,
): Promise<MachineStoreState> {
  return toState(await request<FloorDto>(floorUrl(layout.id)))
}

// Ghi khung của 1 máy (tạo mới nếu chưa có)
export function setMachineEdit(
  layout: MachineLayoutConfig,
  code: string,
  edit: MachineEdit,
  version: number,
): Promise<MachineStoreState> {
  return write(machineUrl(layout.id, code), 'PUT', {
    boxes: edit.boxes,
    ...(edit.keepStatus ? { keepStatus: true } : {}),
    ifVersion: version,
  })
}

export function removeMachine(
  layout: MachineLayoutConfig,
  code: string,
  version: number,
): Promise<MachineStoreState> {
  return write(`${machineUrl(layout.id, code)}?ifVersion=${version}`, 'DELETE')
}

export function renameMachine(
  layout: MachineLayoutConfig,
  code: string,
  to: string,
  version: number,
): Promise<MachineStoreState> {
  return write(machineUrl(layout.id, code, '/rename'), 'POST', { to, ifVersion: version })
}

// "Đúng rồi": bỏ cờ cần soát, giữ nguyên khung
export function confirmMachine(
  layout: MachineLayoutConfig,
  code: string,
  version: number,
): Promise<MachineStoreState> {
  return write(machineUrl(layout.id, code, '/confirm'), 'POST', { ifVersion: version })
}

// Về khung tự động (CAD) do server giữ
export function revertMachine(
  layout: MachineLayoutConfig,
  code: string,
  version: number,
): Promise<MachineStoreState> {
  return write(machineUrl(layout.id, code, '/revert'), 'POST', { ifVersion: version })
}

// Nhiều thao tác trong 1 lần ghi (ôm hàng loạt, nhập JSON)
export function bulkMachineEdits(
  layout: MachineLayoutConfig,
  ops: MachineBulkOp[],
  version: number,
  keepStatus = false,
): Promise<MachineStoreState> {
  return write(floorUrl(layout.id, '/bulk'), 'POST', {
    ops,
    ...(keepStatus ? { keepStatus: true } : {}),
    ifVersion: version,
  })
}

export function isStoreConflict(error: unknown): boolean {
  return error instanceof MachineStoreError && error.code === 'conflict'
}

export function machineStoreErrorMessage(error: unknown): string {
  if (isStoreConflict(error)) {
    return 'Dữ liệu đã bị người khác sửa. Đã tải lại dữ liệu mới nhất – kiểm tra rồi lưu lại.'
  }

  if (error instanceof MachineStoreError && error.code === 'auth') {
    return 'Không có quyền ghi: ' + error.message
  }

  return 'Không lưu được: '
    + ((error instanceof Error && error.message) || 'lỗi không rõ')
}
