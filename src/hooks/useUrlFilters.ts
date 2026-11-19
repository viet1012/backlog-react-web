import { useEffect, useEffectEvent, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { notify } from '../components/common/notify'
import { getMessages } from '../i18n/i18nContext'

/**
 * Bộ lọc ⇄ URL (?div=PR&expD=2026-11-19…): gửi link cho đồng nghiệp là mở đúng
 * màn hình đang xem, F5 không mất bộ lọc.
 *
 * State của trang vẫn là nguồn chính (trang được giữ sống khi chuyển trang,
 * xem KeepAliveOutlet); URL chỉ phản chiếu state:
 *
 *   - Mở trang / F5:  đọc URL một lần bằng readUrlParams() để khởi tạo state.
 *   - State đổi:      ghi lại URL (replace, không thêm lịch sử; gom 200 ms).
 *   - Quay lại trang bằng sidebar (URL trống): ghi state hiện tại lên URL.
 *   - URL đổi từ ngoài và có tham số của trang (link chia sẻ, thẻ ở Trang chủ):
 *     gọi onUrlChange(next) để trang áp bộ lọc mới.
 *
 * Chỉ chạy khi trang đang hiện (effect bị dọn khi trang bị ẩn) và đúng `path`.
 * Tham số lạ (không khai báo) trên URL được giữ nguyên.
 */

export interface UrlParam<V> {
  /** Tên trên URL */
  key: string
  /** undefined = giá trị không hợp lệ, bỏ qua */
  parse: (raw: string) => V | undefined
  format: (value: V) => string
  /**
   * Giá trị "không lọc": bằng giá trị này thì không ghi lên URL, và link không
   * có tham số này thì nhận giá trị này. Không khai báo = luôn ghi lên URL;
   * link thiếu tham số thì giữ giá trị hiện tại (vd Division nhớ theo người dùng).
   */
  empty?: V
}

export type UrlParams<T> = { [K in keyof T]: UrlParam<T[K]> }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/

/** Mẫu tham số hay dùng */
export const urlParam = {
  text: (key: string, empty = ''): UrlParam<string> => ({
    key,
    parse: (raw) => raw.slice(0, 200),
    format: (value) => value.trim(),
    empty,
  }),

  oneOf: <T extends string>(key: string, values: readonly T[], empty?: T): UrlParam<T> => ({
    key,
    parse: (raw) => values.find((value) => value.toLowerCase() === raw.toLowerCase()),
    format: (value) => value,
    empty,
  }),

  /** YYYY-MM-DD */
  date: (key: string, empty?: string): UrlParam<string> => ({
    key,
    parse: (raw) => (DATE_RE.test(raw) && !Number.isNaN(Date.parse(raw)) ? raw : undefined),
    format: (value) => value,
    empty,
  }),

  /** YYYY-MM */
  month: (key: string, empty?: string): UrlParam<string> => ({
    key,
    parse: (raw) => (MONTH_RE.test(raw) ? raw : undefined),
    format: (value) => value,
    empty,
  }),

  /** Danh sách cách nhau bởi dấu phẩy, chỉ nhận giá trị trong `values` */
  list: <T extends string>(key: string, values: readonly T[], empty: T[]): UrlParam<T[]> => ({
    key,
    parse: (raw) => {
      const list = values.filter((value) => raw.split(',').includes(value))
      return list.length > 0 ? list : undefined
    },
    // giữ thứ tự của `values` => cùng lựa chọn luôn ra cùng URL
    format: (list) => values.filter((value) => list.includes(value)).join(','),
    empty,
  }),

  /** Số dương; null = không lọc */
  positiveNumber: (key: string): UrlParam<number | null> => ({
    key,
    parse: (raw) => {
      const n = Number(raw)
      return Number.isFinite(n) && n > 0 ? n : undefined
    },
    format: (value) => (value == null ? '' : String(value)),
    empty: null,
  }),
}

function normalizePath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

function parseParams<T>(params: UrlParams<T>, search: string): Partial<T> {
  const query = new URLSearchParams(search)
  const result: Partial<T> = {}

  for (const name of Object.keys(params) as (keyof T)[]) {
    const param = params[name]
    const raw = query.get(param.key)
    if (raw == null) continue

    const value = param.parse(raw)
    if (value !== undefined) result[name] = value
  }

  return result
}

/** Tham số có trên URL nhưng giá trị sai (vd ?expD=2026-13-45, ?div=XX) */
function invalidParamKeys<T>(params: UrlParams<T>, search: string): string[] {
  const query = new URLSearchParams(search)

  return (Object.keys(params) as (keyof T)[])
    .map((name) => params[name])
    .filter((param) => {
      const raw = query.get(param.key)
      return raw != null && raw !== '' && param.parse(raw) === undefined
    })
    .map((param) => `${param.key}=${query.get(param.key)}`)
}

// Báo một lần: link có bộ lọc sai nên đã bỏ qua (trang dùng giá trị mặc định)
function warnInvalidParams<T>(params: UrlParams<T>, search: string) {
  const invalid = invalidParamKeys(params, search)
  if (invalid.length === 0) return

  notify.warning(getMessages().common.invalidLinkFilters, {
    detail: invalid.join(', '),
    key: 'url-invalid-filters',
  })
}

function hasAnyParam<T>(params: UrlParams<T>, search: string): boolean {
  const query = new URLSearchParams(search)
  return (Object.keys(params) as (keyof T)[]).some((name) => query.has(params[name].key))
}

function isEmptyValue<V>(param: UrlParam<V>, value: V): boolean {
  return param.empty !== undefined && param.format(value) === param.format(param.empty)
}

/** Query string mong muốn: tham số của trang theo `values`, tham số lạ giữ nguyên */
export function buildSearch<T>(params: UrlParams<T>, values: T, currentSearch: string): string {
  const query = new URLSearchParams(currentSearch)

  for (const name of Object.keys(params) as (keyof T)[]) {
    const param = params[name]
    const value = values[name]
    const text = isEmptyValue(param, value) ? '' : param.format(value)

    if (text) query.set(param.key, text)
    else query.delete(param.key)
  }

  // dấu phẩy để nguyên cho link dễ đọc (?classify=Sale,Stock)
  const text = query.toString().replace(/%2C/gi, ',')
  return text ? `?${text}` : ''
}

/**
 * Đọc bộ lọc từ URL lúc khởi tạo state (chỉ khi URL đang là trang `path`).
 * Chỉ trả về các tham số có trên URL và hợp lệ; còn lại trang tự lấy mặc định.
 */
export function readUrlParams<T>(path: string, params: UrlParams<T>): Partial<T> {
  if (normalizePath(window.location.pathname) !== path) return {}
  return parseParams(params, window.location.search)
}

const WRITE_DELAY_MS = 200

interface UseUrlFiltersOptions<T> {
  /** Route của trang, vd '/fac-confirm' */
  path: string
  params: UrlParams<T>
  /** Bộ lọc hiện tại của trang */
  values: T
  /** URL đổi từ ngoài (link chia sẻ…): áp bộ lọc mới vào state của trang */
  onUrlChange: (next: T) => void
}

export function useUrlFilters<T>({ path, params, values, onUrlChange }: UseUrlFiltersOptions<T>) {
  const location = useLocation()
  const navigate = useNavigate()

  // Query string trang ghi gần nhất (hoặc đã đọc lúc mở trang) – khác giá trị này
  // nghĩa là URL vừa đổi từ ngoài
  const lastSeen = useRef<string | null>(null)

  const active = normalizePath(location.pathname) === path
  const wanted = active ? buildSearch(params, values, location.search) : ''

  const applyFromUrl = useEffectEvent((search: string): boolean => {
    if (!hasAnyParam(params, search)) return false

    const parsed = parseParams(params, search)
    const next = { ...values }
    let changed = false

    for (const name of Object.keys(params) as (keyof T)[]) {
      const param = params[name]
      const value = parsed[name] !== undefined
        ? parsed[name] as T[keyof T]
        : param.empty !== undefined ? param.empty : values[name]

      if (param.format(value) !== param.format(values[name])) {
        next[name] = value
        changed = true
      }
    }

    if (changed) onUrlChange(next)
    return changed
  })

  useEffect(() => {
    if (!active) return

    const current = location.search

    // Lần đầu: state đã khởi tạo từ chính URL này
    if (lastSeen.current === null) {
      lastSeen.current = current
      warnInvalidParams(params, current)
    } else if (current !== lastSeen.current) {
      lastSeen.current = current
      warnInvalidParams(params, current)
      // State sẽ đổi theo URL → effect chạy lại với `wanted` mới rồi mới ghi
      if (applyFromUrl(current)) return
    }

    if (wanted === current) return

    const timer = window.setTimeout(() => {
      lastSeen.current = wanted
      navigate({ search: wanted, hash: location.hash }, { replace: true })
    }, WRITE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [active, location.search, location.hash, wanted, navigate, params])
}
