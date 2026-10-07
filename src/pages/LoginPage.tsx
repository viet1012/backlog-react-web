import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import dayBackground from '../assets/bg-day.jpg'
import factoryBackground from '../assets/login-factory-bg.png'
import { AuthCardHeader } from '../components/auth/AuthCardHeader'
import { LoginBrand } from '../components/auth/LoginBrand'
import { LoginForm } from '../components/auth/LoginForm'
import { LoginHeroText } from '../components/auth/LoginHeroText'
import { RegisterForm } from '../components/auth/RegisterForm'
import {
  authModeActionSx,
  BACKGROUND_FADE_MS,
  centerContainerSx,
  createAuthModeSwitchSx,
  createAuthThemeVars,
  createDayBackgroundLayerSx,
  createPageBackgroundSx,
  loginCardSx,
} from '../components/auth/loginStyles'
import {
  AuthApiError,
  getDefaultAuthRoute,
  isAuthenticated,
  login,
  register,
} from '../services/authService'
import { useIsDaytime } from '../hooks/useIsDaytime'

type AuthMode = 'login' | 'register'

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [registerEmployeeId, setRegisterEmployeeId] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isDaytime = useIsDaytime()

  // Bật fade màu cho toàn trang trong lúc chuyển ngày/đêm (khớp với fade background)
  const [prevIsDaytime, setPrevIsDaytime] = useState(isDaytime)
  const [modeSwitching, setModeSwitching] = useState(false)
  if (prevIsDaytime !== isDaytime) {
    setPrevIsDaytime(isDaytime)
    setModeSwitching(true)
  }

  useEffect(() => {
    if (!modeSwitching) return
    const timer = window.setTimeout(() => setModeSwitching(false), BACKGROUND_FADE_MS)
    return () => window.clearTimeout(timer)
  }, [modeSwitching])

  // Preload cả 2 ảnh để lúc chuyển ngày/đêm không bị trễ
  useEffect(() => {
    for (const src of [dayBackground, factoryBackground]) {
      const image = new Image()
      image.src = src
    }
  }, [])

  if (isAuthenticated()) {
    return <Navigate to={getDefaultAuthRoute()} replace />
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const session = await login(employeeId.trim(), password, remember)
      navigate(getDefaultAuthRoute(session), { replace: true })
    } catch (requestError) {
      setError(
        requestError instanceof AuthApiError && requestError.status === 401
          ? 'Invalid Employee ID or password.'
          : requestError instanceof Error
          ? requestError.message
          : 'Invalid Employee ID or password.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmployeeId = registerEmployeeId.trim()

    if (!trimmedEmployeeId) {
      setError('Employee ID (MSNV) is required.')
      return
    }
    if (!registerPassword) {
      setError('Password is required.')
      return
    }
    if (registerPassword !== confirmPassword) {
      setError('Confirm Password does not match Password.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await register(trimmedEmployeeId, registerPassword)
      setEmployeeId(trimmedEmployeeId)
      setMode('login')
      setRegisterPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to create account.',
      )
    } finally {
      setLoading(false)
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
  }

  const isLogin = mode === 'login'

  return (
    <Box
      data-mode-switching={modeSwitching}
      style={createAuthThemeVars(isDaytime)}
      sx={[
        createPageBackgroundSx(factoryBackground, { nightOverlayVisible: !isDaytime }),
        createAuthModeSwitchSx(),
      ]}
    >
      <Box aria-hidden sx={createDayBackgroundLayerSx(dayBackground, isDaytime)} />
      <LoginBrand />
      <LoginHeroText />

      <Box sx={centerContainerSx}>
        <Box component="section" sx={loginCardSx}>
          <Box
            key={mode}
            sx={{
              animation: 'authModeEnter 220ms ease-out',
              '@keyframes authModeEnter': {
                from: { opacity: 0, transform: 'translateY(5px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            {isLogin ? (
              <AuthCardHeader
                title="Production Control"
                subtitle="Sign in with your S-Patrol account"
              />
            ) : (
              <AuthCardHeader
                title="Create Account"
                subtitle="Register to Production Control"
                hint={(
                  <>
                    Already have an S-Patrol account? No need to register —{' '}
                    <Typography
                      component="button"
                      type="button"
                      onClick={() => changeMode('login')}
                      disabled={loading}
                      sx={authModeActionSx}
                    >
                      sign in directly
                    </Typography>
                    .
                  </>
                )}
              />
            )}

            {isLogin ? (
              <LoginForm
                employeeId={employeeId}
                password={password}
                remember={remember}
                showPassword={showPassword}
                loading={loading}
                error={error}
                onEmployeeIdChange={(value) => {
                  setEmployeeId(value)
                  setError('')
                }}
                onPasswordChange={(value) => {
                  setPassword(value)
                  setError('')
                }}
                onRememberChange={setRemember}
                onTogglePassword={() => setShowPassword((value) => !value)}
                onCreateAccount={() => changeMode('register')}
                onSubmit={handleLogin}
              />
            ) : (
              <RegisterForm
                employeeId={registerEmployeeId}
                password={registerPassword}
                confirmPassword={confirmPassword}
                showPassword={showRegisterPassword}
                loading={loading}
                error={error}
                onEmployeeIdChange={setRegisterEmployeeId}
                onPasswordChange={setRegisterPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onTogglePassword={() => setShowRegisterPassword((value) => !value)}
                onSignIn={() => changeMode('login')}
                onSubmit={handleRegister}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
