import {
  Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Typography,
} from '@mui/material'
import {
  LockOutlined, PersonOutlineRounded, VisibilityOffOutlined, VisibilityOutlined,
} from '@mui/icons-material'
import type { FormEvent } from 'react'
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
  const lockAdornment = (
    <InputAdornment position="start">
      <LockOutlined />
    </InputAdornment>
  )
  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
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
        id="register-employee-id" label="Employee ID (MSNV)" placeholder="e.g. 22847"
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
        id="register-password" label="Password" placeholder="Enter your password"
        type={showPassword ? 'text' : 'password'} value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        autoComplete="new-password" required disabled={loading} sx={passwordToggleFieldSx}
        slotProps={{ input: { startAdornment: lockAdornment, endAdornment: passwordAdornment } }}
      />
      <AuthField
        id="register-confirm-password" label="Confirm Password" placeholder="Re-enter your password"
        type={showPassword ? 'text' : 'password'} value={confirmPassword}
        onChange={(event) => onConfirmPasswordChange(event.target.value)}
        autoComplete="new-password" required disabled={loading} sx={passwordToggleFieldSx}
        slotProps={{ input: { startAdornment: lockAdornment, endAdornment: passwordAdornment } }}
      />
      <Button type="submit" variant="contained" size="large" disabled={loading} sx={loginButtonSx}>
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
      </Button>
      <Typography sx={authModeFooterSx}>
        Already have an account?{' '}
        <Typography component="button" type="button" onClick={onSignIn} disabled={loading} sx={authModeActionSx}>
          Sign In
        </Typography>
      </Typography>
    </Box>
  )
}
