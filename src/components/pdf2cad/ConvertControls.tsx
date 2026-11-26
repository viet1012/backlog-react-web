import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useRef } from 'react'
import type { Pdf2cadOcrMode, Pdf2cadOptions } from '../../types/pdf2cad'
import { Pdf2cadCard } from './Pdf2cadCard'
import { fmtMB, usePdf2cadText } from './pdf2cadText'

// ---------------------------------------------------------
// Chọn file (kéo thả cả vùng tab, hoặc bấm để chọn)
// ---------------------------------------------------------

export function FileDropCard({
  files,
  hot,
  onAdd,
  onRemove,
  onClear,
  onPreview,
}: {
  files: File[]
  /** đang kéo file vào vùng tab */
  hot: boolean
  onAdd: (list: FileList) => void
  onRemove: (index: number) => void
  onClear: () => void
  onPreview: (file: File) => void
}) {
  const { tx } = usePdf2cadText()
  const inputRef = useRef<HTMLInputElement>(null)
  const total = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <Pdf2cadCard>
      <Box
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 2.5,
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: '10px',
          border: `2px dashed ${hot ? theme.palette.primary.main : theme.palette.divider}`,
          bgcolor: hot ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          color: 'text.secondary',
          transition: 'border-color 120ms, background-color 120ms',
          '&:hover, &:focus-visible': { borderColor: 'primary.main', outline: 'none' },
        })}
      >
        <UploadFileOutlinedIcon sx={{ fontSize: 30, color: 'primary.main' }} />
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'text.primary' }}>{tx.dropTitle}</Typography>
        <Typography sx={{ fontSize: 12 }}>{tx.dropHint}</Typography>
      </Box>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.tif,.tiff,.png,.jpg,.jpeg,.bmp,application/pdf,image/tiff,image/png,image/jpeg"
        onChange={(e) => {
          if (e.target.files) onAdd(e.target.files)
          e.target.value = ''
        }}
      />

      {files.length > 0 && (
        <>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 1, p: 0, maxHeight: 180, overflow: 'auto' }}>
            {files.map((f, i) => (
              <Box
                component="li"
                key={`${f.name}-${f.size}`}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  py: 0.25,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                })}
              >
                <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography
                  noWrap
                  title={f.name}
                  onClick={() => onPreview(f)}
                  sx={{ flex: 1, minWidth: 0, fontSize: 12.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                >
                  {f.name}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>{fmtMB(f.size)}</Typography>
                <Tooltip title={tx.remove}>
                  <IconButton size="small" onClick={() => onRemove(i)} aria-label={`${tx.remove} ${f.name}`}>
                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Stack direction="row" sx={{ alignItems: 'center', mt: 0.75 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{tx.fileCount(files.length, fmtMB(total))}</Typography>
            <Button size="small" onClick={onClear} sx={{ ml: 'auto', textTransform: 'none' }}>
              {tx.clearList}
            </Button>
          </Stack>
        </>
      )}
    </Pdf2cadCard>
  )
}

// ---------------------------------------------------------
// Tuỳ chọn chuyển đổi
// ---------------------------------------------------------

const fieldSx = { '& .MuiInputBase-input': { fontSize: 12.5 }, '& .MuiInputLabel-root': { fontSize: 12.5 } }

export function OptionsCard({
  options,
  onChange,
  disabled,
}: {
  options: Pdf2cadOptions
  onChange: (next: Pdf2cadOptions) => void
  disabled: boolean
}) {
  const { tx } = usePdf2cadText()
  const set = <K extends keyof Pdf2cadOptions>(key: K, value: Pdf2cadOptions[K]) => onChange({ ...options, [key]: value })

  const checks: [keyof Pdf2cadOptions, string][] = [
    ['fitArcs', tx.fitArcs],
    ['raster', tx.raster],
    ['autoRotate', tx.autoRotate],
    ['removeStamps', tx.removeStamps],
    ['keepGlyphs', tx.keepGlyphs],
  ]

  return (
    <Pdf2cadCard title={tx.optionsTitle}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.5 }}>
        <TextField
          size="small"
          label={tx.pages}
          placeholder={tx.pagesPh}
          value={options.pages}
          disabled={disabled}
          onChange={(e) => set('pages', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        />
        <TextField
          size="small"
          label={tx.scale}
          placeholder={tx.scalePh}
          type="number"
          value={options.scale}
          disabled={disabled}
          onChange={(e) => set('scale', e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 0.001, step: 'any' } }}
          sx={fieldSx}
        />
        <TextField
          size="small"
          label={tx.dpi}
          type="number"
          value={options.dpi}
          disabled={disabled}
          onChange={(e) => set('dpi', Number(e.target.value) || 300)}
          slotProps={{ htmlInput: { min: 72, max: 1200, step: 50 } }}
          sx={fieldSx}
        />
        <TextField
          size="small"
          label={tx.thick}
          type="number"
          value={options.thick}
          disabled={disabled}
          onChange={(e) => set('thick', Number(e.target.value) || 0.5)}
          slotProps={{ htmlInput: { min: 0.01, step: 0.05 } }}
          sx={fieldSx}
        />
        <TextField
          select
          size="small"
          label={tx.ocr}
          value={options.ocr}
          disabled={disabled}
          onChange={(e) => set('ocr', e.target.value as Pdf2cadOcrMode)}
          sx={{ ...fieldSx, gridColumn: '1 / -1' }}
        >
          <MenuItem value="auto" sx={{ fontSize: 13 }}>{tx.ocrAuto}</MenuItem>
          <MenuItem value="on" sx={{ fontSize: 13 }}>{tx.ocrOn}</MenuItem>
          <MenuItem value="off" sx={{ fontSize: 13 }}>{tx.ocrOff}</MenuItem>
        </TextField>
      </Box>

      <Stack sx={{ mt: 0.75 }}>
        {checks.map(([key, label]) => (
          <FormControlLabel
            key={key}
            disabled={disabled}
            control={
              <Checkbox
                size="small"
                checked={Boolean(options[key])}
                onChange={(e) => set(key, e.target.checked as never)}
                sx={{ py: 0.25 }}
              />
            }
            label={label}
            sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: 12.5 } }}
          />
        ))}
      </Stack>
    </Pdf2cadCard>
  )
}

// ---------------------------------------------------------
// Chạy + tiến độ
// ---------------------------------------------------------

export type ProgressTone = 'normal' | 'ok' | 'warn' | 'err'

export function RunCard({
  canRun,
  indeterminate,
  percent,
  message,
  tone,
  stage,
  canStop,
  canZip,
  onRun,
  onStop,
  onZip,
}: {
  canRun: boolean
  indeterminate: boolean
  percent: number
  message: string
  tone: ProgressTone
  stage: string
  canStop: boolean
  canZip: boolean
  onRun: () => void
  onStop: () => void
  onZip: () => void
}) {
  const { tx } = usePdf2cadText()
  const p = Math.max(0, Math.min(100, percent))
  const color = tone === 'ok' ? 'success.main' : tone === 'warn' ? 'warning.main' : tone === 'err' ? 'error.main' : 'text.secondary'

  return (
    <>
      <Button
        variant="contained"
        size="large"
        startIcon={<PlayArrowRoundedIcon />}
        disabled={!canRun}
        onClick={onRun}
        sx={{ textTransform: 'none', fontWeight: 800, fontSize: 14.5, borderRadius: '10px', flexShrink: 0 }}
      >
        {tx.run}
      </Button>

      <Pdf2cadCard>
        <Box sx={{ position: 'relative' }}>
          <LinearProgress
            variant={indeterminate ? 'indeterminate' : 'determinate'}
            value={p}
            color={tone === 'ok' ? 'success' : tone === 'err' ? 'error' : 'primary'}
            sx={{ height: 20, borderRadius: 10, '& .MuiLinearProgress-bar': { borderRadius: 10 } }}
          />
          <Typography
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontSize: 11.5,
              fontWeight: 800,
              color: p > 52 ? '#fff' : 'text.primary',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {indeterminate ? tx.waiting : `${p > 0 && p < 10 ? p.toFixed(1) : Math.floor(p)}%`}
          </Typography>
        </Box>
        <Typography role="status" sx={{ mt: 0.75, fontSize: 12.5, color, minHeight: 18 }}>
          {message}
        </Typography>
        <Typography noWrap title={stage} sx={{ fontSize: 12, color: 'text.secondary', minHeight: 16 }}>
          {stage}
        </Typography>
        <Stack direction="row" sx={{ gap: 1, mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<StopRoundedIcon />}
            disabled={!canStop}
            onClick={onStop}
            sx={{ flex: 1, textTransform: 'none' }}
          >
            {tx.stop}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            disabled={!canZip}
            onClick={onZip}
            sx={{ flex: 1.4, textTransform: 'none' }}
          >
            {tx.zip}
          </Button>
        </Stack>
      </Pdf2cadCard>
    </>
  )
}
