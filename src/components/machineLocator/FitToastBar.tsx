import {
  Alert,
  Button,
  Snackbar,
} from '@mui/material'

import type { MachineLocatorState } from '../../hooks/useMachineLocator'

interface FitToastBarProps {
  ml: MachineLocatorState
}

// Kết quả ôm khung: "Đã ôm theo máy · Hoàn tác", cảnh báo khung đổi nhiều, không nhận ra hình máy
export function FitToastBar({ ml }: FitToastBarProps) {
  const t = ml.fitToast

  return (
    <Snackbar
      key={t?.id}
      open={!!t}
      autoHideDuration={t?.kind === 'warning' ? 6000 : 4000}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') ml.closeFitToast()
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={t?.kind ?? 'info'}
        variant="filled"
        onClose={ml.closeFitToast}
        sx={{ alignItems: 'center', fontSize: 13 }}
        action={t?.undoId !== undefined
          ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => ml.undo(t.undoId)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Hoàn tác
            </Button>
          )
          : undefined}
      >
        {t?.text}
      </Alert>
    </Snackbar>
  )
}
