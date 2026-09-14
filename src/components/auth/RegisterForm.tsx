import {
  Alert, Box, Button, CircularProgress, IconButton, InputAdornment, TextField, Typography,
} from '@mui/material'
import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material'
import type { FormEvent } from 'react'
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
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {error && <Alert severity="error" sx={loginAlertSx}>{error}</Alert>}
      <TextField
        label="Employee ID (MSNV)" value={employeeId} autoComplete="username"
        onChange={(event) => onEmployeeIdChange(event.target.value)}
        autoFocus fullWidth required disabled={loading} sx={loginFieldSx}
      />
      <TextField
        label="Password" type={showPassword ? 'text' : 'password'} value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        autoComplete="new-password" fullWidth required disabled={loading} sx={passwordToggleFieldSx}
        slotProps={{ input: { endAdornment: passwordAdornment } }}
      />
      <TextField
        label="Confirm Password" type={showPassword ? 'text' : 'password'} value={confirmPassword}
        onChange={(event) => onConfirmPasswordChange(event.target.value)}
        autoComplete="new-password" fullWidth required disabled={loading} sx={passwordToggleFieldSx}
        slotProps={{ input: { endAdornment: passwordAdornment } }}
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
