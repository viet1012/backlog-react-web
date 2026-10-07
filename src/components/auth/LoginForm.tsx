import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material'

import {
  ArrowForwardRounded,
  LockOutlined,
  PersonOutlineRounded,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'

import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

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

interface LoginFormProps {
  employeeId: string
  password: string
  remember: boolean
  showPassword: boolean
  loading: boolean
  error: string

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
  onEmployeeIdChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onCreateAccount,
  onSubmit,
}: LoginFormProps) {
  const canSubmit = employeeId.trim() !== '' && password !== ''
  const [capsLockOn, setCapsLockOn] = useState(false)

  function handlePasswordKey(event: KeyboardEvent) {
    setCapsLockOn(event.getModifierState('CapsLock'))
  }

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* MSNV */}
      <AuthField
        id="login-employee-id"
        label="Employee ID (MSNV)"
        placeholder="e.g. 22847"
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
          label="Password"
          placeholder="Enter your password"
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
                        ? 'Hide password'
                        : 'Show password'
                    }
                    title={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
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
            Caps Lock is on
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
          label="Remember me"
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
            <CircularProgress
              size={16}
              color="inherit"
            />
            Signing in...
          </Box>
        ) : (
          'Sign In'
        )}
      </Button>

      <Typography sx={authHintSx}>
        Already using S-Patrol? Sign in with the same Employee ID and password.
      </Typography>

      <Typography
        sx={authModeFooterSx}
      >
        Don&apos;t have an account?{' '}

        <Typography
          component="button"
          type="button"
          onClick={onCreateAccount}
          disabled={loading}
          sx={authModeActionSx}
        >
          Create account
        </Typography>
      </Typography>
    </Box>
  )
}
