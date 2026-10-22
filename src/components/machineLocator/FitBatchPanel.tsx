import {
  Box,
  LinearProgress,
  Typography,
} from '@mui/material'

import type { MachineLocatorState } from '../../hooks/useMachineLocator'
import type { FitStatus } from '../../types/machineLocator'
import { PanelButton } from './MachineInfo'
import {
  codeFontFamily,
  mapColors,
} from './machineLocatorColors'

interface FitBatchPanelProps {
  ml: MachineLocatorState
}

const STATUS_LABEL: Record<FitStatus, string> = {
  fit: 'đã ôm',
  review: 'cần soát',
  miss: 'không nhận ra',
}

const STATUS_COLOR: Record<FitStatus, string> = {
  fit: 'success.main',
  review: mapColors.review,
  miss: 'text.secondary',
}

// Ôm hàng loạt các khung chưa có đường bao (ADMIN, khi đang sửa): tiến độ + bảng kết quả.
// Kết quả nằm trong bản nháp, chỉ ghi khi bấm "Lưu kết quả"
export function FitBatchPanel({ ml }: FitBatchPanelProps) {
  const { batch } = ml

  if (!batch) {
    return (
      <PanelButton
        disabled={!ml.unfittedCount || ml.fitterState === 'error' || !!ml.draft?.dirty}
        title={ml.fitterState === 'error' ? 'Không tải được ảnh layout' : undefined}
        onClick={() => void ml.runFitBatch()}
        sx={{ width: '100%' }}
      >
        Ôm các khung chưa có đường bao ({ml.unfittedCount})
      </PanelButton>
    )
  }

  const pct = batch.total ? (batch.done / batch.total) * 100 : 0

  return (
    <Box
      sx={{
        width: '100%',
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        fontSize: 12,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
          {batch.running ? 'Đang ôm khung…' : 'Kết quả ôm hàng loạt'}
        </Typography>

        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {batch.done}/{batch.total}
        </Typography>
      </Box>

      {batch.running && (
        <LinearProgress variant="determinate" value={pct} sx={{ mb: 0.75, borderRadius: 1 }} />
      )}

      {batch.rows.length > 0 && (
        <Box
          role="table"
          aria-label="Kết quả ôm khung"
          sx={{
            maxHeight: 180,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '6px',
          }}
        >
          <Box role="row" sx={rowSx(false)}>
            <span role="columnheader">Mã</span>
            <span role="columnheader">Dời/đổi (pt)</span>
            <span role="columnheader">Trạng thái</span>
          </Box>

          {batch.rows.map((r) => (
            <Box
              key={`${r.code}-${r.i}`}
              role="row"
              tabIndex={0}
              title="Zoom tới máy"
              onClick={() => ml.focusMachine(r.code)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') ml.focusMachine(r.code)
              }}
              sx={rowSx(true)}
            >
              <Box component="span" role="cell" sx={{ fontFamily: codeFontFamily, fontWeight: 600 }}>
                {r.code}{r.n > 1 ? ` (${r.i + 1})` : ''}
              </Box>
              <Box component="span" role="cell" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.shift === null ? '–' : r.shift.toFixed(1)}
              </Box>
              <Box component="span" role="cell" sx={{ color: STATUS_COLOR[r.status], fontWeight: 600 }}>
                {STATUS_LABEL[r.status]}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.75 }}>
        {batch.running
          ? (
            <PanelButton onClick={ml.stopFitBatch}>
              Dừng
            </PanelButton>
          )
          : (
            <>
              <PanelButton
                appearance="action"
                disabled={!ml.pendingFitCount}
                onClick={() => void ml.saveFitBatch()}
              >
                Lưu kết quả ({ml.pendingFitCount} máy)
              </PanelButton>

              <PanelButton onClick={ml.discardFitBatch}>
                {ml.pendingFitCount ? 'Bỏ kết quả' : 'Đóng'}
              </PanelButton>
            </>
          )}
      </Box>
    </Box>
  )
}

function rowSx(body: boolean) {
  return {
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr 1.1fr',
    gap: 0.75,
    px: 0.75,
    py: 0.35,
    fontSize: 12,
    borderTop: body ? '1px solid' : 0,
    borderColor: 'divider',
    ...(body
      ? {
        cursor: 'pointer',
        '&:hover, &:focus-visible': { bgcolor: 'action.hover', outline: 'none' },
      }
      : {
        position: 'sticky',
        top: 0,
        bgcolor: 'background.paper',
        color: 'text.secondary',
        fontWeight: 600,
      }),
  } as const
}
