import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'


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
        Còn thay đổi chưa lưu
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            fontSize: 13.5,
          }}
        >
          Có {changeCount} ô đã sửa nhưng chưa lưu.
          Lưu trước khi đổi công đoạn?
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
          Ở lại
        </Button>

        <Button
          color="error"
          disabled={saving}
          onClick={onDiscard}
        >
          Bỏ thay đổi
        </Button>

        <Button
          variant="contained"
          loading={saving}
          onClick={onSave}
        >
          Lưu ngay
        </Button>
      </DialogActions>
    </Dialog>
  )
}
