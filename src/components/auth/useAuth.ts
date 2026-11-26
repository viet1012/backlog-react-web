import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from './authContext'

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }

  return value
}

/** true nếu user hiện tại có quyền `action` trên `feature` (hỗ trợ "*") */
export function usePerm(feature: string, action: string): boolean {
  return useAuth().can(feature, action)
}
