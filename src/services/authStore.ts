/*
 * Trạng thái đăng nhập phía FE:
 * - token: do backlog-be cấp khi login, lưu localStorage ("Ghi nhớ") hoặc sessionStorage.
 * - user: kết quả GET /auth/me (employeeId, name, roles, perms), chỉ giữ trong bộ nhớ.
 *   Quyền luôn lấy từ BE, không lưu xuống storage.
 *
 * Không import service nào khác để apiClient / authService / AuthContext cùng dùng được
 * mà không bị vòng import.
 */

const TOKEN_KEY = 'production_control_token'

// Bản cũ lưu cả roles ở FE: thấy thì xóa
const LEGACY_SESSION_KEY = 'production_control_auth'

/** feature -> actions; feature hoặc action là "*" nghĩa là mọi giá trị */
export type Perms = Record<string, string[]>

export interface AuthUser {
  employeeId: string
  name: string | null
  /** Chỉ để hiển thị; kiểm quyền dùng perms (can / usePerm) */
  roles: string[]
  perms: Perms
  // Thông tin HR từ /me (chỉ để hiển thị); BE chưa trả / không có thì null
  fac: string | null
  dept: string | null
  section: string | null
  line: string | null
  group: string | null
}

// =========================================================
// TOKEN
// =========================================================

function removeLegacySession() {
  try {
    if (localStorage.getItem(LEGACY_SESSION_KEY) !== null) localStorage.removeItem(LEGACY_SESSION_KEY)
    if (sessionStorage.getItem(LEGACY_SESSION_KEY) !== null) sessionStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    // storage bị chặn: bỏ qua
  }
}

export function getToken(): string | null {
  removeLegacySession()

  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token: string, remember: boolean): void {
  clearToken()

  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    // storage bị chặn: không lưu được token, request sau sẽ bị 401 và quay về /login
  }
}

export function clearToken(): void {
  removeLegacySession()

  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // bỏ qua
  }
}

// =========================================================
// CURRENT USER (/me)
// =========================================================

let currentUser: AuthUser | null = null
const listeners = new Set<() => void>()

export function getCurrentUser(): AuthUser | null {
  return currentUser
}

export function setCurrentUser(user: AuthUser | null): void {
  if (user === currentUser) return
  currentUser = user
  for (const listener of listeners) listener()
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// =========================================================
// PERMISSION
// =========================================================

export function canWith(
  perms: Perms | null | undefined,
  feature: string,
  action: string,
): boolean {
  if (!perms) return false

  for (const key of [feature, '*']) {
    const actions = perms[key]
    if (actions && (actions.includes(action) || actions.includes('*'))) return true
  }

  return false
}

/** Kiểm quyền theo user hiện tại (dùng được ngoài React) */
export function can(feature: string, action: string): boolean {
  return canWith(currentUser?.perms, feature, action)
}

// =========================================================
// USER INFO (ngoài React: khóa lưu cài đặt theo người dùng...)
// =========================================================

export function getCurrentEmployeeId(): string | null {
  return currentUser?.employeeId.trim() || null
}

export function getAuthenticatedUsername(): string | null {
  return currentUser?.name || currentUser?.employeeId || null
}
