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
import { useI18n } from '../../i18n/useI18n'

interface FitBatchPanelProps {
  ml: MachineLocatorState
}

const STATUS_LABEL_KEY = {
  fit: 'statusFit',
  review: 'statusReview',
  miss: 'statusMiss',
} as const satisfies Record<FitStatus, string>

const STATUS_COLOR: Record<FitStatus, string> = {
  fit: 'success.main',
  review: mapColors.review,
  miss: 'text.secondary',
}

// Ôm hàng loạt các khung chưa có đường bao (ADMIN, khi đang sửa): tiến độ + bảng kết quả.
// Kết quả nằm trong bản nháp, chỉ ghi khi bấm "Lưu kết quả"
export function FitBatchPanel({ ml }: FitBatchPanelProps) {
  const { t } = useI18n()

  const { batch } = ml

  if (!batch) {
    return (
      <PanelButton
        disabled={!ml.unfittedCount || ml.fitterState === 'error' || !!ml.draft?.dirty}
        title={ml.fitterState === 'error' ? t.locator.batch.layoutImageFailed : undefined}
        onClick={() => void ml.runFitBatch()}
        sx={{ width: '100%' }}
      >
        {t.locator.batch.fitUnfitted(ml.unfittedCount)}
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
          {batch.running ? t.locator.batch.running : t.locator.batch.results}
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
          aria-label={t.locator.batch.resultsAria}
          sx={{
            maxHeight: 180,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '6px',
          }}
        >
          <Box role="row" sx={rowSx(false)}>
            <span role="columnheader">{t.locator.batch.colCode}</span>
            <span role="columnheader">{t.locator.batch.colScore}</span>
            <span role="columnheader">{t.locator.batch.colShift}</span>
            <span role="columnheader">{t.locator.batch.colStatus}</span>
          </Box>

          {batch.rows.map((r, k) => (
            <Box
              key={`${r.code}-${r.i}`}
              role="row"
              tabIndex={0}
              aria-current={batch.reviewIdx === k}
              title={t.locator.batch.zoomRow}
              onClick={() => (batch.running ? ml.focusMachine(r.code) : ml.reviewFitBatch(k))}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.preventDefault()
                  ml.reviewFitBatch(k)
                }
              }}
              sx={[rowSx(true), batch.reviewIdx === k && { bgcolor: 'action.selected' }]}
            >
              <Box component="span" role="cell" sx={{ fontFamily: codeFontFamily, fontWeight: 600 }}>
                {r.code}{r.n > 1 ? ` (${r.i + 1})` : ''}
              </Box>
              <Box component="span" role="cell" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {r.score ?? '–'}
              </Box>
              <Box component="span" role="cell" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.shift === null ? '–' : r.shift.toFixed(1)}
              </Box>
              <Box
                component="span"
                role="cell"
                sx={{ color: r.decision ? 'text.secondary' : STATUS_COLOR[r.status], fontWeight: 600 }}
              >
                {r.decision === 'accept' ? t.locator.batch.accepted : r.decision === 'skip' ? t.locator.batch.skipped : t.locator.batch[STATUS_LABEL_KEY[r.status]]}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.75 }}>
        {batch.running
          ? (
            <PanelButton onClick={ml.stopFitBatch}>
              {t.locator.batch.stop}
            </PanelButton>
          )
          : (
            <>
              {batch.rows.length > 0 && (
                batch.reviewIdx === null
                  ? (
                    <PanelButton onClick={() => ml.reviewFitBatch(0)} title={t.locator.batch.reviewHint}>
                      {t.locator.batch.reviewInOrder}
                    </PanelButton>
                  )
                  : (
                    <>
                      <PanelButton appearance="success" onClick={() => ml.decideFitReview('accept')}>
                        {t.locator.batch.accept}
                      </PanelButton>
                      <PanelButton onClick={() => ml.decideFitReview('skip')}>
                        {t.locator.batch.skip}
                      </PanelButton>
                    </>
                  )
              )}

              <PanelButton
                appearance="action"
                disabled={!ml.pendingFitCount}
                onClick={() => void ml.saveFitBatch()}
              >
                {t.locator.batch.saveResults(ml.pendingFitCount)}
              </PanelButton>

              <PanelButton onClick={ml.discardFitBatch}>
                {ml.pendingFitCount ? t.locator.batch.discardResults : t.common.close}
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
    gridTemplateColumns: '1.3fr 0.8fr 1fr 1.1fr',
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
