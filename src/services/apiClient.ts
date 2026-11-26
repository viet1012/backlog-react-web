import { notify } from '../components/common/notify/notifyStore'
import { API_BASE_URL } from '../config/api'
import { getMessages } from '../i18n/i18nContext'
import { clearQueryCache } from '../utils/queryCache'
import { clearToken, getToken, setCurrentUser } from './authStore'

/*
 * fetch dùng chung cho mọi request tới backlog-be (/api/**):
 * - gắn Authorization: Bearer <token>
 * - 401: xóa token + user -> ProtectedRoute đưa về /login?returnUrl=<trang đang mở>
 * - 403: toast "Bạn không có quyền thực hiện thao tác này" (gộp 1 toast khi nhiều request cùng bị chặn)
 *
 * URL ngoài backlog-be (BE utility, ảnh tĩnh...) đi qua nguyên vẹn, không gắn token.
 * Các API /auth/login, /auth/register, /auth/me, /auth/logout tự gọi fetch trong authService
 * vì 401 ở đó có nghĩa khác (sai mật khẩu, token hết hạn lúc khởi động).
 */

const API_BASE = API_BASE_URL.replace(/\/+$/, '')

export interface ApiFetchInit extends RequestInit {
  /** Không hiện toast khi 403 (request nền, tự xử lý) */
  silentForbidden?: boolean
}

export function isBackendApiUrl(url: string): boolean {
  const path = url.startsWith(API_BASE) ? url.slice(API_BASE.length) : url

  return /^\/+api\//.test(path)
}

/** Header Authorization cho request tự dựng (vd. EventSource / tải file thủ công) */
export function authHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function handleUnauthorized(): void {
  clearToken()
  clearQueryCache()
  setCurrentUser(null)
}

function notifyForbidden() {
  notify.error(getMessages().auth.forbidden, { key: 'api-forbidden' })
}

export async function apiFetch(
  url: string,
  init: ApiFetchInit = {},
): Promise<Response> {
  const { silentForbidden, ...requestInit } = init
  const backend = isBackendApiUrl(url)

  if (!backend) {
    return fetch(url, requestInit)
  }

  const headers = new Headers(requestInit.headers)
  const token = getToken()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, { ...requestInit, headers })

  if (response.status === 401) {
    handleUnauthorized()
  } else if (response.status === 403 && !silentForbidden) {
    notifyForbidden()
  }

  return response
}
