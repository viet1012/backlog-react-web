import { createContext } from 'react'

import type { AuthUser } from '../../services/authStore'

export type AuthStatus =
  | 'loading' // có token, đang gọi /me
  | 'ready'   // đã có user, hoặc không có token
  | 'error'   // /me lỗi (không phải 401): mạng / BE

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  /** Quyền theo /me; feature hoặc action "*" = mọi giá trị */
  can: (feature: string, action: string) => boolean
  /** Login + tải /me. Lỗi ném AuthApiError (status 429, 400...) */
  signIn: (employeeId: string, password: string, remember: boolean) => Promise<AuthUser>
  signOut: () => void
  /** Gọi lại /me (vd. sau khi lỗi mạng) */
  reload: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
