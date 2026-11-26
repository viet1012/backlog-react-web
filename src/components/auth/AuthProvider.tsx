import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import { Box, Button, CircularProgress, Typography } from '@mui/material'

import { useI18n } from '../../i18n/useI18n'
import { handleUnauthorized } from '../../services/apiClient'
import {
  AuthApiError,
  fetchMe,
  hasToken,
  login,
  logout,
} from '../../services/authService'
import {
  canWith,
  clearToken,
  getCurrentUser,
  setCurrentUser,
  subscribeAuth,
  type AuthUser,
} from '../../services/authStore'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

/*
 * Nạp quyền từ BE:
 * - Khởi động: có token -> GET /me; trong lúc chờ hiện loading, chưa render route.
 * - 401 ở /me: token hỏng -> xóa, coi như chưa đăng nhập (ProtectedRoute đưa về /login).
 * - Lỗi khác (mạng / BE): màn hình lỗi + Thử lại, không xóa token.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const user = useSyncExternalStore(subscribeAuth, getCurrentUser)
  const [status, setStatus] = useState<AuthStatus>(() => (hasToken() ? 'loading' : 'ready'))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const requestRef = useRef(0)

  const reload = useCallback(async () => {
    const requestId = ++requestRef.current

    if (!hasToken()) {
      setCurrentUser(null)
      setStatus('ready')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      const me = await fetchMe()
      if (requestId !== requestRef.current) return
      setCurrentUser(me)
      setStatus('ready')
    } catch (error) {
      if (requestId !== requestRef.current) return

      if (error instanceof AuthApiError && error.status === 401) {
        handleUnauthorized()
        setStatus('ready')
        return
      }

      setErrorMessage(error instanceof Error ? error.message : String(error))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const signIn = useCallback(async (employeeId: string, password: string, remember: boolean): Promise<AuthUser> => {
    // Không đổi status sang loading: trang login vẫn hiện (giữ form + hiệu ứng)
    requestRef.current++
    await login(employeeId, password, remember)

    try {
      const me = await fetchMe()
      setCurrentUser(me)
      setStatus('ready')
      return me
    } catch (error) {
      clearToken()
      setCurrentUser(null)
      throw error
    }
  }, [])

  const signOut = useCallback(() => {
    requestRef.current++
    logout()
    setStatus('ready')
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    can: (feature, action) => canWith(user?.perms, feature, action),
    signIn,
    signOut,
    reload,
  }), [user, status, signIn, signOut, reload])

  return (
    <AuthContext.Provider value={value}>
      {status === 'ready'
        ? children
        : (
          <Box
            role={status === 'loading' ? 'status' : 'alert'}
            sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              px: 2,
              bgcolor: 'background.default',
              color: 'text.primary',
              textAlign: 'center',
            }}
          >
            {status === 'loading' ? (
              <>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary">
                  {t.auth.loadingSession}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {t.auth.sessionLoadFailed}
                </Typography>
                {errorMessage && (
                  <Typography variant="body2" color="text.secondary">
                    {errorMessage}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={() => void reload()}>
                    {t.common.retry}
                  </Button>
                  <Button variant="text" color="inherit" onClick={signOut}>
                    {t.sidebar.signOut}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
    </AuthContext.Provider>
  )
}
