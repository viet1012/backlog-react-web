import { Box, Typography } from '@mui/material'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import factoryBackground from '../assets/login-factory-bg.png'
import { LoginBrand } from '../components/auth/LoginBrand'
import { LoginForm } from '../components/auth/LoginForm'
import { LoginHeroText } from '../components/auth/LoginHeroText'
import { RegisterForm } from '../components/auth/RegisterForm'
import {
  centerContainerSx,
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
    <Box sx={createPageBackgroundSx(factoryBackground)}>
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
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: { xs: 24, sm: 27 },
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                }}
              >
                {isLogin ? 'Production Control' : 'Create Account'}
              </Typography>
              <Typography sx={{ mt: 0.8, color: 'rgba(213, 230, 246, 0.62)', fontSize: 13.5 }}>
                {isLogin ? 'Sign in to continue' : 'Register to Production Control'}
              </Typography>
            </Box>

            {isLogin ? (
              <LoginForm
                employeeId={employeeId}
                password={password}
                remember={remember}
                showPassword={showPassword}
                loading={loading}
                error={error}
                onEmployeeIdChange={setEmployeeId}
                onPasswordChange={setPassword}
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
