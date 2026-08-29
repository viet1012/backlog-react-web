import {
  Alert,
  Snackbar,
} from '@mui/material'

interface FacConfirmEditErrorSnackbarProps {
  message: string
  onClose: () => void
}

export function FacConfirmEditErrorSnackbar({
  message,
  onClose,
}: FacConfirmEditErrorSnackbarProps) {
  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Alert
        severity="warning"
        variant="filled"
        onClose={onClose}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}
