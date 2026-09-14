import { API_BASE_URL } from '../config/api'

const AUTH_STORAGE_KEY = 'production_control_auth'

const AUTH_API_URL =
  `${API_BASE_URL.replace(/\/$/, '')}/api/production-control/auth`

export type UserRole =
  | 'ADMIN'
  | 'PC'
  | 'PRO'
  | 'USER'

export interface AuthSession {
  authenticated: true
  accountId: number
  employeeId: string
  name: string | null
  fac: string | null
  dept: string | null
  section: string | null
  line: string | null
  group: string | null
  status: string
  roles: UserRole[]
}

export interface RegisterResponse {
  accountId: number
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
      || `Authentication failed (${response.status}).`,
      response.status,
    )
  }

  if (!data) {
    throw new AuthApiError(
      'Invalid authentication response.',
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
  if (!session) {
    return '/login'
  }

  const hasProductionRole =
    session.roles.some(
      (role) =>
        role === 'ADMIN'
        || role === 'PC'
        || role === 'PRO',
    )

  return hasProductionRole
    ? '/odbf'
    : '/user-home'
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

// =========================================================
// LOGOUT
// =========================================================

export function logout(): void {
  localStorage.removeItem(
    AUTH_STORAGE_KEY,
  )

  sessionStorage.removeItem(
    AUTH_STORAGE_KEY,
  )
}