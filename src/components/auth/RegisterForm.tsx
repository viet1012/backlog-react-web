import {
  Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Typography,
} from '@mui/material'
import {
  LockOutlined, PersonOutlineRounded, VisibilityOffOutlined, VisibilityOutlined,
} from '@mui/icons-material'
import type { FormEvent } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { AuthField } from './AuthField'
import {
  authModeActionSx,
  authModeFooterSx,
  loginAlertSx,
  loginButtonSx,
  loginFieldSx,
  passwordToggleFieldSx,
} from './loginStyles'

interface RegisterFormProps {
  employeeId: string
  password: string
  confirmPassword: string
  showPassword: boolean
  loading: boolean
  error: string
  onEmployeeIdChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSignIn: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function RegisterForm(props: RegisterFormProps) {
  const {
    employeeId, password, confirmPassword, showPassword, loading, error,
    onEmployeeIdChange, onPasswordChange, onConfirmPasswordChange,
    onTogglePassword, onSignIn, onSubmit,
  } = props
  const { t } = useI18n()
  const lockAdornment = (
    <InputAdornment position="start">
      <LockOutlined />
    </InputAdornment>
  )
  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label={showPassword ? t.auth.hidePasswords : t.auth.showPasswords}
        aria-pressed={showPassword}
        edge="end"
        disabled={loading}
        onClick={onTogglePassword}
      >
        {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && <Alert severity="error" sx={loginAlertSx}>{error}</Alert>}
      <AuthField
        id="register-employee-id" label={t.auth.employeeId} placeholder={t.auth.employeeIdPlaceholder}
        value={employeeId} autoComplete="username"
        onChange={(event) => onEmployeeIdChange(event.target.value)}
        autoFocus required disabled={loading} sx={loginFieldSx}
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
      <AuthField
        id="register-password" label={t.auth.password} placeholder={t.auth.passwordPlaceholder}
        type={showPassword ? 'text' : 'password'} value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        autoComplete="new-password" required disabled={loading} sx={passwordToggleFieldSx}
        slotProps={{ input: { startAdornment: lockAdornment, endAdornment: passwordAdornment } }}
      />
      <AuthField
        id="register-confirm-password" label={t.auth.confirmPassword} placeholder={t.auth.confirmPasswordPlaceholder}
        type={showPassword ? 'text' : 'password'} value={confirmPassword}
        onChange={(event) => onConfirmPasswordChange(event.target.value)}
        autoComplete="new-password" required disabled={loading} sx={passwordToggleFieldSx}
        slotProps={{ input: { startAdornment: lockAdornment, endAdornment: passwordAdornment } }}
      />
      <Button type="submit" variant="contained" size="large" disabled={loading} sx={loginButtonSx}>
        {loading ? <CircularProgress size={22} color="inherit" /> : t.auth.createAccountButton}
      </Button>
      <Typography sx={authModeFooterSx}>
        {t.auth.haveAccount}{' '}
        <Typography component="button" type="button" onClick={onSignIn} disabled={loading} sx={authModeActionSx}>
          {t.auth.signIn}
        </Typography>
      </Typography>
    </Box>
  )
}
