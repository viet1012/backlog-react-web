import { API_BASE_URL } from '../config/api'
import { getMessages } from '../i18n/i18nContext'
import { clearQueryCache } from '../utils/queryCache'

const AUTH_STORAGE_KEY = 'production_control_auth'

const AUTH_API_URL =
  `${API_BASE_URL.replace(/\/$/, '')}/api/production-control/auth`

export type UserRole =
  | 'ADMIN'
  | 'PC'
  | 'PRO'
  | 'USER'

// Backend dùng chung tài khoản S-Patrol (HSE_Patrol_Account):
// - accountId luôn null => định danh user bằng employeeId
// - status luôn 'ACTIVE' (không còn LOCKED / not active)
// - name, fac, dept, section, line, group: null khi MSNV không có trong HR
// - roles tính lại từ HR mỗi lần login, luôn có ít nhất 1 role
export interface AuthSession {
  authenticated: true
  accountId: number | null
  employeeId: string
  name: string | null
  fac: string | null
  dept: string | null
  section: string | null
  line: string | null
  group: string | null
  status: string
  roles: UserRole[]
  // Token đăng nhập do BE ký (Authorization: Bearer) cho API cần danh tính thật (vd /api/pdf2cad).
  // Phiên đăng nhập từ trước khi BE cấp token: không có → các API đó yêu cầu đăng nhập lại.
  token?: string | null
  // ISO-8601, hết hạn thì coi như không có token
  tokenExpiresAt?: string | null
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

  const data = await response
    .json()
    .catch(() => null) as
    | (T & { message?: string })
    | null

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
// SESSION
// =========================================================

function readSession(
  storage: Storage,
): AuthSession | null {
  try {
    const value =
      storage.getItem(
        AUTH_STORAGE_KEY,
      )

    if (!value) {
      return null
    }

    const session =
      JSON.parse(value) as Partial<AuthSession>

    if (
      session.authenticated !== true
      || typeof session.employeeId !== 'string'
      || !Array.isArray(session.roles)
    ) {
      return null
    }

    return session as AuthSession
  } catch {
    return null
  }
}

function saveSession(
  session: AuthSession,
  remember: boolean,
): void {
  localStorage.removeItem(
    AUTH_STORAGE_KEY,
  )

  sessionStorage.removeItem(
    AUTH_STORAGE_KEY,
  )

  const storage =
    remember
      ? localStorage
      : sessionStorage

  storage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(session),
  )
}

// =========================================================
// LOGIN
// =========================================================

export async function login(
  employeeId: string,
  password: string,
  remember: boolean,
): Promise<AuthSession> {
  const response =
    await postAuth<
      Omit<AuthSession, 'authenticated'>
    >(
      'login',
      {
        employeeId,
        password,
      },
    )

  const session: AuthSession = {
    authenticated: true,
    ...response,
  }

  saveSession(
    session,
    remember,
  )

  return session
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
// AUTH
// =========================================================

export function getAuthSession():
  AuthSession | null {
  return (
    readSession(localStorage)
    ?? readSession(sessionStorage)
  )
}

export function isAuthenticated():
  boolean {
  return Boolean(
    getAuthSession(),
  )
}

export function getRoles():
  UserRole[] {
  return (
    getAuthSession()?.roles
    ?? []
  )
}

// =========================================================
// ROLE
// =========================================================

export function hasAnyRole(
  requiredRoles: UserRole[],
): boolean {
  const roles = getRoles()

  // ADMIN có toàn quyền
  if (
    roles.includes('ADMIN')
  ) {
    return true
  }

  return requiredRoles.some(
    (role) =>
      roles.includes(role),
  )
}

// =========================================================
// DEFAULT ROUTE
// =========================================================

export function getDefaultAuthRoute(
  session: AuthSession | null =
    getAuthSession(),
): string {
  // Mọi tài khoản vào trang chủ trước (route /user-home mở cho mọi role,
  // nếu không RoleRoute sẽ chuyển hướng vòng lặp)
  return session
    ? '/user-home'
    : '/login'
}

// =========================================================
// USER INFO
// =========================================================

export function getAuthenticatedUsername():
  string | null {
  const session =
    getAuthSession()

  return (
    session?.name
    || session?.employeeId
    || null
  )
}

export function getCurrentEmployeeId():
  string | null {
  return (
    getAuthSession()?.employeeId.trim()
    || null
  )
}

/** Token đăng nhập còn hạn; null → cần đăng nhập lại để gọi API yêu cầu token */
export function getAuthToken():
  string | null {
  const session =
    getAuthSession()

  if (!session?.token) {
    return null
  }

  const expiresAt =
    session.tokenExpiresAt
      ? Date.parse(session.tokenExpiresAt)
      : Number.NaN

  if (
    Number.isFinite(expiresAt)
    && expiresAt <= Date.now()
  ) {
    return null
  }

  return session.token
}

// =========================================================
// LOGOUT
// =========================================================

export function logout(): void {
  // dữ liệu đã tải của phiên trước không được hiện cho người đăng nhập sau
  clearQueryCache()

  localStorage.removeItem(
    AUTH_STORAGE_KEY,
  )

  sessionStorage.removeItem(
    AUTH_STORAGE_KEY,
  )
}