import {
  Box,
  Typography,
} from '@mui/material'
import { useRef } from 'react'

import type { MachineLocatorState } from '../../hooks/useMachineLocator'
import { FitBatchPanel } from './FitBatchPanel'
import { PanelButton } from './MachineInfo'
import { useI18n } from '../../i18n/useI18n'

interface MachineDataFooterProps {
  ml: MachineLocatorState
}

// Ghi chú nguồn dữ liệu + Xuất / Nhập (nút chỉ hiện với ADMIN)
export function MachineDataFooter({ ml }: MachineDataFooterProps) {
  const { t } = useI18n()

  const fileRef = useRef<HTMLInputElement>(null)

  const error = ml.status.k === 'err'
  const note = !ml.loaded
    ? t.locator.footer.loading
    : !ml.canWrite
      ? t.locator.footer.readOnly
      : ml.saving
        ? t.locator.footer.writing
        : error
          ? ml.status.t
          : t.locator.footer.saving

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
          color: ml.canWrite && error ? 'error.main' : ml.canWrite ? 'primary.main' : 'text.secondary',
          fontWeight: ml.canWrite ? 600 : 400,
        }}
      >
        {note}
      </Typography>

      {ml.canWrite && ml.editing && <FitBatchPanel ml={ml} />}

      {ml.canWrite && (
        <>
          <PanelButton onClick={ml.exportCsv}>{t.locator.footer.exportCsv}</PanelButton>
          <PanelButton onClick={ml.exportJson}>{t.locator.footer.exportJson}</PanelButton>
          <PanelButton onClick={ml.exportPng}>{t.locator.footer.layoutImage}</PanelButton>
          <PanelButton disabled={ml.saving} onClick={openImport}>{t.locator.footer.importJson}</PanelButton>

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
