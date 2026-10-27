import {
  API_BASE_URL,
  HSE_IMAGE_BASE_URL,
} from '../config/api'
import type {
  HseItem,
  HseResponse,
  HseSafeRange,
  HseUnassignedGroup,
} from '../types/machineMonitor'

// =========================================================
// MACHINE MONITOR – API backlog-be (/api/machine-monitor), chỉ đọc
// =========================================================

const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/api/machine-monitor`

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response

  try {
    res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' }, signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new Error(e instanceof Error ? e.message : 'mất kết nối server')
  }

  const body = await res.json().catch(() => null) as (T & { message?: string }) | null

  if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`)
  if (!body) throw new Error('Response rỗng hoặc không phải JSON.')

  return body
}

// area xuất hiện nhiều nhất (ưu tiên lỗi chưa đóng; không có thì xét mọi lỗi)
function topArea(items: HseItem[]): string | null {
  const open = items.filter((it) => it.status !== 'SAFE')
  const counts = new Map<string, number>()

  for (const it of open.length ? open : items) {
    const a = it.area?.trim()

    if (a) counts.set(a, (counts.get(a) ?? 0) + 1)
  }

  let best: string | null = null

  for (const [a, n] of counts) if (!best || n > counts.get(best)!) best = a

  return best
}

// BE: unassigned = [{ label, status, openCount, overdueCount, waitCount, safeCount, maxRisk, items[] }],
// không có key / description -> key = label (BE đảm bảo duy nhất), description tự tạo
function normalizeUnassigned(raw: unknown): HseUnassignedGroup[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((g): g is Partial<HseUnassignedGroup> => !!g && typeof g === 'object')
    .map((g, i) => {
      const label = String(g.label ?? '').trim() || `Nhóm ${i + 1}`
      const items = Array.isArray(g.items) ? g.items : []
      const open = (g.openCount ?? 0) + (g.waitCount ?? 0)
      const description = [
        topArea(items),
        open ? `${open} lỗi chưa đóng` : null,
        g.maxRisk != null ? `risk max ${g.maxRisk}` : null,
      ].filter(Boolean).join(' · ')

      return {
        ...g,
        key: label,
        label,
        description,
        status: g.status ?? 'OPEN',
        openCount: g.openCount ?? 0,
        overdueCount: g.overdueCount ?? 0,
        waitCount: g.waitCount ?? 0,
        safeCount: g.safeCount ?? 0,
        maxRisk: g.maxRisk ?? null,
        items,
      }
    })
}

// range: khoảng lịch sử an toàn (YYYY-MM-DD, gồm 2 đầu); null = không giới hạn đầu đó
export async function fetchHseMonitor(
  floorId: string,
  signal?: AbortSignal,
  range: HseSafeRange = { from: null, to: null },
): Promise<HseResponse> {
  const p = new URLSearchParams({ floorId })

  if (range.from) p.set('safeFrom', range.from)
  if (range.to) p.set('safeTo', range.to)

  const body = await getJson<HseResponse & { unassigned?: unknown }>(`${API_URL}/hse?${p}`, signal)

  return { ...body, machines: body.machines ?? {}, unassigned: normalizeUnassigned(body.unassigned) }
}

// Tên file có thể chứa dấu cách / ký tự JP -> encode từng đoạn, giữ '/'
export function hseImageUrl(name: string): string {
  const base = HSE_IMAGE_BASE_URL.endsWith('/') ? HSE_IMAGE_BASE_URL : `${HSE_IMAGE_BASE_URL}/`

  return base + name.split('/').map(encodeURIComponent).join('/')
}
