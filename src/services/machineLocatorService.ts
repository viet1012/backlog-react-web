import type {
  LayoutData,
  MachineEdit,
  MachineEdits,
  MachineLayoutConfig,
} from '../types/machineLocator'

// =========================================================
// MACHINE STORE
// - dev  ('file') : ghi thẳng vào file JSON gốc qua Vite plugin (vite-plugins/machineLocatorDevStore.ts);
//                  file chính là dữ liệu gốc nên EDITS luôn rỗng.
// - build('local'): dữ liệu gốc đóng gói sẵn + EDITS trong localStorage.
// Khi có API backlog-be chỉ cần thay phần thân các hàm dưới,
// UI chỉ dùng loadMachineStore / setMachineEdit / deleteMachineEdit.
// =========================================================

export type MachineStoreMode = 'file' | 'local'

export const machineStoreMode: MachineStoreMode =
  import.meta.env.DEV ? 'file' : 'local'

export interface MachineStoreState {
  data: LayoutData
  edits: MachineEdits
}

export type MachineStoreErrorCode =
  | 'local_fail'
  | 'file_fail'

export class MachineStoreError extends Error {
  readonly code: MachineStoreErrorCode

  constructor(code: MachineStoreErrorCode, message?: string) {
    super(message ?? code)

    this.name = 'MachineStoreError'
    this.code = code
  }
}

// =========================================================
// LOCAL STORAGE
// =========================================================

const STORAGE_PREFIX = 'production-control:machine-locator'

function storageKey(layoutId: string) {
  return `${STORAGE_PREFIX}:${layoutId}:edits.v1`
}

function readEdits(layoutId: string): MachineEdits {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(layoutId)) || '{}')

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as MachineEdits
      : {}
  } catch {
    return {}
  }
}

function writeEdits(layoutId: string, edits: MachineEdits) {
  try {
    localStorage.setItem(storageKey(layoutId), JSON.stringify(edits))
  } catch {
    throw new MachineStoreError('local_fail')
  }
}

// =========================================================
// FILE (dev)
// =========================================================

function fileUrl(layoutId: string, code?: string) {
  const base = `/__machine-locator/${encodeURIComponent(layoutId)}`

  return code ? `${base}/machines/${encodeURIComponent(code)}` : base
}

async function fileRequest(
  url: string,
  init?: RequestInit,
): Promise<MachineStoreState> {
  let res: Response

  try {
    res = await fetch(url, { cache: 'no-store', ...init })
  } catch (e) {
    throw new MachineStoreError('file_fail', e instanceof Error ? e.message : 'mất kết nối dev server')
  }

  const body = await res.json().catch(() => null) as (LayoutData & { message?: string }) | null

  if (!res.ok || !body || !body.m) {
    throw new MachineStoreError('file_fail', body?.message || `HTTP ${res.status}`)
  }

  return { data: body, edits: {} }
}

// =========================================================
// API
// =========================================================

export async function loadMachineStore(
  layout: MachineLayoutConfig,
): Promise<MachineStoreState> {
  if (machineStoreMode === 'file') return fileRequest(fileUrl(layout.id))

  return { data: layout.data, edits: readEdits(layout.id) }
}

// Ghi chỉnh sửa của 1 máy; edit.deleted = xoá máy. Trả về trạng thái mới để UI cập nhật
export async function setMachineEdit(
  layout: MachineLayoutConfig,
  code: string,
  edit: MachineEdit,
): Promise<MachineStoreState> {
  if (machineStoreMode === 'file') {
    return edit.deleted
      ? fileRequest(fileUrl(layout.id, code), { method: 'DELETE' })
      : fileRequest(fileUrl(layout.id, code), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxes: edit.boxes, ...(edit.keepStatus ? { keepStatus: true } : {}) }),
      })
  }

  const edits = readEdits(layout.id)

  edits[code] = edit
  writeEdits(layout.id, edits)

  return { data: layout.data, edits }
}

// Bỏ chỉnh sửa của 1 máy (về dữ liệu gốc). Ở chế độ file không có EDITS nên chỉ đọc lại file
export async function deleteMachineEdit(
  layout: MachineLayoutConfig,
  code: string,
): Promise<MachineStoreState> {
  if (machineStoreMode === 'file') return fileRequest(fileUrl(layout.id))

  const edits = readEdits(layout.id)

  delete edits[code]
  writeEdits(layout.id, edits)

  return { data: layout.data, edits }
}

// =========================================================
// CHUYỂN EDITS CŨ TRONG TRÌNH DUYỆT -> FILE (dev)
// =========================================================

export function getBrowserEdits(layoutId: string): MachineEdits {
  return readEdits(layoutId)
}

export async function migrateBrowserEdits(
  layout: MachineLayoutConfig,
): Promise<{ state: MachineStoreState, count: number }> {
  const edits = readEdits(layout.id)
  let state = await loadMachineStore(layout)
  let count = 0

  for (const [code, edit] of Object.entries(edits)) {
    if (!edit.deleted && !(Array.isArray(edit.boxes) && edit.boxes.length)) continue

    state = await setMachineEdit(layout, code, edit)
    count++
  }

  try {
    localStorage.removeItem(storageKey(layout.id))
  } catch {
    // không xoá được key thì lần sau ghi lại cũng cho cùng kết quả
  }

  return { state, count }
}

export function machineStoreErrorMessage(error: unknown): string {
  if (error instanceof MachineStoreError && error.code === 'local_fail') {
    return 'Trình duyệt không cho lưu dữ liệu. Dùng Xuất JSON để giữ lại thay đổi.'
  }

  if (error instanceof MachineStoreError && error.code === 'file_fail') {
    return 'Không ghi được file: ' + error.message
  }

  return 'Không lưu được: '
    + ((error instanceof Error && error.message) || 'lỗi không rõ')
}
