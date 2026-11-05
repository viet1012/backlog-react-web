import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { useI18n } from '../../i18n/useI18n'


interface FacConfirmUnsavedChangesDialogProps {
  open: boolean

  // Số ô đã sửa nhưng chưa lưu
  changeCount: number

  saving: boolean

  onSave: () => void
  onDiscard: () => void
  onStay: () => void
}


// =========================================================
// ĐỔI CÔNG ĐOẠN KHI CÒN THAY ĐỔI CHƯA LƯU
//
// Lưu ngay  -> lưu rồi đổi công đoạn
// Bỏ thay đổi -> hủy thay đổi rồi đổi công đoạn
// Ở lại     -> giữ nguyên công đoạn hiện tại
// =========================================================

export function FacConfirmUnsavedChangesDialog({
  open,
  changeCount,
  saving,
  onSave,
  onDiscard,
  onStay,
}: FacConfirmUnsavedChangesDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      onClose={() => {
        if (!saving) {
          onStay()
        }
      }}
    >
      <DialogTitle
        sx={{
          fontSize: 16,
          fontWeight: 800,
        }}
      >
        {t.facConfirm.unsaved.title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            fontSize: 13.5,
          }}
        >
          {t.facConfirm.unsaved.body(changeCount)}
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          pb: 1.5,
        }}
      >
        <Button
          color="inherit"
          disabled={saving}
          onClick={onStay}
        >
          {t.facConfirm.unsaved.stay}
        </Button>

        <Button
          color="error"
          disabled={saving}
          onClick={onDiscard}
        >
          {t.facConfirm.unsaved.discard}
        </Button>

        <Button
          variant="contained"
          loading={saving}
          onClick={onSave}
        >
          {t.facConfirm.unsaved.saveNow}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
