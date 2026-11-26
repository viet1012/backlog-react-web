import { API_BASE_URL } from '../config/api'
import { getMessages } from '../i18n/i18nContext'
import { clearQueryCache } from '../utils/queryCache'
import {
  clearToken,
  getCurrentUser,
  getToken,
  saveToken,
  setCurrentUser,
  type AuthUser,
  type Perms,
} from './authStore'

export {
  can,
  getAuthenticatedUsername,
  getCurrentEmployeeId,
  getCurrentUser,
  getToken,
} from './authStore'
export type { AuthUser, Perms } from './authStore'

const AUTH_API_URL =
  `${API_BASE_URL.replace(/\/$/, '')}/api/production-control/auth`

// Response login cũ + token. Chỉ token được giữ lại; quyền lấy từ /me.
interface LoginResponse {
  token: string
  expiresAt?: string | null
}

export interface RegisterResponse {
  accountId: number | null
  employeeId: string
  status: string
  message: string
}

export class AuthApiError extends Error {
  readonly status?: number

  constructor(
    message: string,
    status?: number,
  ) {
    super(message)

    this.name = 'AuthApiError'
    this.status = status
  }
}

// =========================================================
// API
// =========================================================

async function readJson<T>(response: Response): Promise<(T & { message?: string }) | null> {
  return await response
    .json()
    .catch(() => null) as (T & { message?: string }) | null
}

async function postAuth<T>(
  path: string,
  body: object,
): Promise<T> {
  const response = await fetch(
    `${AUTH_API_URL}/${path}`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(body),
    },
  )

  const data = await readJson<T>(response)

  if (!response.ok) {
    throw new AuthApiError(
      data?.message
      || getMessages().misc.authFailed(response.status),
      response.status,
    )
  }

  if (!data) {
    throw new AuthApiError(
      getMessages().misc.authInvalidResponse,
    )
  }

  return data
}

// =========================================================
// LOGIN (chỉ lưu token)
// =========================================================

export async function login(
  employeeId: string,
  password: string,
  remember: boolean,
): Promise<void> {
  const response =
    await postAuth<LoginResponse>(
      'login',
      {
        employeeId,
        password,
      },
    )

  if (typeof response.token !== 'string' || !response.token) {
    throw new AuthApiError(
      getMessages().misc.authInvalidResponse,
    )
  }

  // Không tự logout theo expiresAt: BE tự gia hạn, hết hạn thật thì API trả 401
  saveToken(
    response.token,
    remember,
  )
}

// =========================================================
// REGISTER
// =========================================================

export function register(
  employeeId: string,
  password: string,
): Promise<RegisterResponse> {
  return postAuth<RegisterResponse>(
    'register',
    {
      employeeId,
      password,
    },
  )
}

// =========================================================
// ME
// =========================================================

function normalizePerms(value: unknown): Perms {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const perms: Perms = {}
  for (const [feature, actions] of Object.entries(value)) {
    if (Array.isArray(actions)) {
      perms[feature] = actions.filter((action): action is string => typeof action === 'string')
    }
  }
  return perms
}

/**
 * GET /auth/me với token hiện tại. 401 -> AuthApiError(status 401), người gọi tự xóa token.
 */
export async function fetchMe(signal?: AbortSignal): Promise<AuthUser> {
  const token = getToken()

  if (!token) {
    throw new AuthApiError(getMessages().misc.authFailed(401), 401)
  }

  const response = await fetch(`${AUTH_API_URL}/me`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  })

  const data = await readJson<Partial<AuthUser>>(response)

  if (!response.ok) {
    throw new AuthApiError(
      data?.message || getMessages().misc.authFailed(response.status),
      response.status,
    )
  }

  if (!data || typeof data.employeeId !== 'string') {
    throw new AuthApiError(getMessages().misc.authInvalidResponse)
  }

  // Chuỗi rỗng / sai kiểu coi như không có
  const text = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null

  return {
    employeeId: data.employeeId,
    name: text(data.name),
    fac: text(data.fac),
    dept: text(data.dept),
    section: text(data.section),
    line: text(data.line),
    group: text(data.group),
    roles: Array.isArray(data.roles) ? data.roles.filter((role): role is string => typeof role === 'string') : [],
    perms: normalizePerms(data.perms),
  }
}

// =========================================================
// AUTH
// =========================================================

export function hasToken(): boolean {
  return Boolean(getToken())
}

export function isAuthenticated(): boolean {
  return Boolean(getCurrentUser())
}

// =========================================================
// DEFAULT ROUTE
// =========================================================

export function getDefaultAuthRoute(): string {
  // Mọi tài khoản vào trang chủ trước (route /user-home mở cho mọi người đã đăng nhập,
  // nếu không PermRoute sẽ chuyển hướng vòng lặp)
  return hasToken()
    ? '/user-home'
    : '/login'
}

/** /login?returnUrl=<đường dẫn nội bộ> */
export function loginPathWithReturn(returnUrl: string): string {
  return `/login?${new URLSearchParams({ returnUrl })}`
}

// =========================================================
// LOGOUT
// =========================================================

export function logout(): void {
  const token = getToken()

  // Báo BE hủy token; không chờ để thoát ngay (keepalive: vẫn gửi khi trang chuyển đi)
  if (token) {
    fetch(`${AUTH_API_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
    }).catch(() => {
      // Mạng lỗi: token phía BE tự hết hạn
    })
  }

  // dữ liệu đã tải của phiên trước không được hiện cho người đăng nhập sau
  clearQueryCache()
  clearToken()
  setCurrentUser(null)
}
