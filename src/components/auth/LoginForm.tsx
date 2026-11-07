import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material'

import { keyframes } from '@mui/material/styles'

import {
  ArrowForwardRounded,
  ContactlessRounded,
  LockOutlined,
  PersonOutlineRounded,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'

import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

import { useI18n } from '../../i18n/useI18n'
import { AuthField } from './AuthField'
import {
  authCheckboxLabelSx,
  authCheckboxSx,
  authHintSx,
  authModeActionSx,
  authModeFooterSx,
  capsLockHintSx,
  loginAlertSx,
  loginButtonSx,
  loginFieldSx,
  passwordToggleFieldSx,
} from './loginStyles'

// Badge being read while the request runs
const scanPulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.88); }
`

// Rejected sign-in. Two keyframes (emotion would merge identical ones into
// one name), alternated so each new failure replays the shake.
const shakeSteps = `
  15% { transform: translateX(-8px); }
  30% { transform: translateX(7px); }
  45% { transform: translateX(-5px); }
  60% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
`
const shakes = [
  keyframes`0%, 100% { transform: translateX(0); } ${shakeSteps}`,
  keyframes`0%, 100% { transform: none; } ${shakeSteps}`,
]

interface LoginFormProps {
  employeeId: string
  password: string
  remember: boolean
  showPassword: boolean
  loading: boolean
  error: string
  /** Number of failed sign-ins so far */
  failCount: number

  onEmployeeIdChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (value: boolean) => void
  onTogglePassword: () => void
  onCreateAccount: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginForm({
  employeeId,
  password,
  remember,
  showPassword,
  loading,
  error,
  failCount,
  onEmployeeIdChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onCreateAccount,
  onSubmit,
}: LoginFormProps) {
  const { t } = useI18n()
  const canSubmit = employeeId.trim() !== '' && password !== ''
  const [capsLockOn, setCapsLockOn] = useState(false)

  function handlePasswordKey(event: KeyboardEvent) {
    setCapsLockOn(event.getModifierState('CapsLock'))
  }

  // Wrong password: select it, ready to be typed again
  useEffect(() => {
    if (failCount === 0) return

    const input = document.getElementById('login-password')
    if (input instanceof HTMLInputElement) {
      input.focus()
      input.select()
    }
  }, [failCount])

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        animation: failCount > 0 ? `${shakes[failCount % 2]} 420ms ease-out` : 'none',
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      {/* MSNV */}
      <AuthField
        id="login-employee-id"
        label={t.auth.employeeId}
        placeholder={t.auth.employeeIdPlaceholder}
        value={employeeId}
        onChange={(event) =>
          onEmployeeIdChange(event.target.value)
        }
        autoComplete="username"
        autoFocus
        required
        disabled={loading}
        sx={loginFieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlineRounded />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* PASSWORD */}
      <Box>
        <AuthField
          id="login-password"
          label={t.auth.password}
          placeholder={t.auth.passwordPlaceholder}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) =>
            onPasswordChange(event.target.value)
          }
          autoComplete="current-password"
          required
          disabled={loading}
          sx={passwordToggleFieldSx}
          onKeyDown={handlePasswordKey}
          onKeyUp={handlePasswordKey}
          onBlur={() => setCapsLockOn(false)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword
                        ? t.auth.hidePassword
                        : t.auth.showPassword
                    }
                    title={
                      showPassword
                        ? t.auth.hidePassword
                        : t.auth.showPassword
                    }
                    aria-pressed={showPassword}
                    edge="end"
                    disabled={loading}
                    onClick={onTogglePassword}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showPassword
                        ? <VisibilityOffOutlined />
                        : <VisibilityOutlined />}
                    </Box>
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {capsLockOn && (
          <Typography role="status" sx={capsLockHintSx}>
            {t.auth.capsLockOn}
          </Typography>
        )}
      </Box>

      {/* OPTIONS */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mt: -0.75,
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              disabled={loading}
              onChange={(event) =>
                onRememberChange(
                  event.target.checked,
                )
              }
              size="small"
              sx={authCheckboxSx}
            />
          }
          label={t.auth.rememberMe}
          sx={authCheckboxLabelSx}
        />
      </Box>

      {error && (
        <Alert
          severity="error"
          role="alert"
          sx={loginAlertSx}
        >
          {error}
        </Alert>
      )}

      {/* SIGN IN */}
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading || !canSubmit}
        endIcon={loading ? undefined : <ArrowForwardRounded />}
        sx={loginButtonSx}
      >
        {loading ? (
          <Box
            component="span"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
          >
            <ContactlessRounded
              sx={{
                fontSize: 18,
                animation: `${scanPulse} 0.9s ease-in-out infinite`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
            {t.auth.signingIn}
          </Box>
        ) : (
          t.auth.signIn
        )}
      </Button>

      <Typography sx={authHintSx}>
        {t.auth.sPatrolHint}
      </Typography>

      <Typography
        sx={authModeFooterSx}
      >
        {t.auth.noAccount}{' '}

        <Typography
          component="button"
          type="button"
          onClick={onCreateAccount}
          disabled={loading}
          sx={authModeActionSx}
        >
          {t.auth.createAccount}
        </Typography>
      </Typography>
    </Box>
  )
}
