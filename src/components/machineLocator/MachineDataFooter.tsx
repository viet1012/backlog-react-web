import {
  Box,
  Typography,
} from '@mui/material'
import { useRef } from 'react'

import type { MachineLocatorState } from '../../hooks/useMachineLocator'
import { PanelButton } from './MachineInfo'

interface MachineDataFooterProps {
  ml: MachineLocatorState
}

// Ghi chú nguồn dữ liệu + Xuất / Nhập (nút chỉ hiện với ADMIN)
export function MachineDataFooter({ ml }: MachineDataFooterProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const note = !ml.loaded
    ? 'Đang tải dữ liệu chỉnh sửa…'
    : !ml.canWrite
      ? 'Bạn đang xem ở chế độ chỉ đọc.'
      : ml.storeMode === 'file'
        ? `Đang lưu vào file ${ml.dataFileName} (chế độ dev).`
        : 'Đang lưu trong trình duyệt. Dùng Xuất JSON để sao lưu, Nhập JSON để nạp lại.'

  function openImport() {
    if (!ml.canStartImport() || !fileRef.current) return

    fileRef.current.value = ''
    fileRef.current.click()
  }

  return (
    <Box
      sx={{
        px: 1.75,
        py: 1.25,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.6,
        alignItems: 'center',
      }}
    >
      <Typography
        sx={{
          width: '100%',
          fontSize: 11.5,
          color: ml.canWrite && ml.storeMode === 'file' ? 'primary.main' : 'text.secondary',
          fontWeight: ml.canWrite && ml.storeMode === 'file' ? 600 : 400,
        }}
      >
        {note}
      </Typography>

      {ml.canWrite && ml.browserEditCount > 0 && (
        <Box
          sx={{
            width: '100%',
            mb: 0.5,
            p: 1,
            fontSize: 12,
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'warning.main',
            borderRadius: '8px',
          }}
        >
          Trình duyệt còn {ml.browserEditCount} chỉnh sửa cũ (lưu trong localStorage) chưa có trong file.

          <PanelButton
            appearance="action"
            onClick={() => void ml.migrateBrowserData()}
            sx={{ mt: 0.75, display: 'flex' }}
          >
            Ghi các chỉnh sửa trong trình duyệt vào file
          </PanelButton>
        </Box>
      )}

      {ml.canWrite && (
        <>
          <PanelButton onClick={ml.exportCsv}>Xuất CSV</PanelButton>
          <PanelButton onClick={ml.exportJson}>Xuất JSON</PanelButton>
          <PanelButton onClick={ml.exportPng}>Ảnh layout</PanelButton>
          <PanelButton onClick={openImport}>Nhập JSON</PanelButton>

          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]

              if (f) void ml.importJson(f)
            }}
          />
        </>
      )}
    </Box>
  )
}
