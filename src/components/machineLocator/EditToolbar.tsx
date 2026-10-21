import { Box } from '@mui/material'

import type { MachineLocatorState } from '../../hooks/useMachineLocator'
import { PanelButton } from './MachineInfo'

interface EditToolbarProps {
  ml: MachineLocatorState
}

// Nút "+ Máy mới" / "Chỉnh sửa" ở đầu panel (chỉ ADMIN)
export function EditToolbar({ ml }: EditToolbarProps) {
  if (!ml.canWrite) return null

  return (
    <Box sx={{ display: 'flex', gap: 0.6, flexShrink: 0 }}>
      <PanelButton onClick={() => ml.startNew()}>
        + Máy mới
      </PanelButton>

      <PanelButton
        aria-pressed={ml.editing}
        appearance={ml.editing ? 'action' : 'default'}
        onClick={() => ml.setEditing(!ml.editing)}
      >
        {ml.editing ? 'Xong' : 'Chỉnh sửa'}
      </PanelButton>
    </Box>
  )
}
