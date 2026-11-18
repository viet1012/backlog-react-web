import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { getAuthenticatedUsername } from '../../services/authService'
import { EVN_IMPORT_MAX_BYTES, importEvnDaily } from '../../services/utilityEvnService'
import { uiTokens } from '../../theme/uiTokens'
import type { EvnImportResult } from '../../types/utilityEvn'
import { clearQueryCache } from '../../utils/queryCache'
import { AppButton } from '../common/AppButton'
import { EvnCalibrationSection } from './EvnCalibrationSection'
import { EvnImportResultView } from './EvnImportResultView'
import { EvnSection } from './EvnSection'
import { TABULAR_NUMS } from './evnCompareUi'

interface EvnImportPanelProps {
  // import thật (dryRun=false) thành công → màn So sánh tải lại số
  onImported?: (result: EvnImportResult) => void
  // tính hiệu chỉnh tổn thất xong (≥ 1 scope) → màn So sánh tải lại số
  onCalibrated?: () => void
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

type Busy = 'check' | 'import' | null

function count(value: number) {
  return value.toLocaleString('en-US')
}

// Tab "Import Excel" của màn So sánh EVN.
// Bước 1: chọn file (+ tùy chọn sheet / tháng) → "Kiểm tra" (dryRun=true)
// Bước 2: "Import vào DB" (dryRun=false) với đúng file + tham số vừa kiểm tra.
// Bước B: sau import thật → "Tính hiệu chỉnh tổn thất" (EvnCalibrationSection).
// File chỉ nằm trong state (bộ nhớ), không lưu localStorage, không log nội dung.
export function EvnImportPanel({ onImported, onCalibrated }: EvnImportPanelProps) {
  const { t } = useI18n()
  const labels = t.utilityEvnImport

  const [importedBy] = useState(() => getAuthenticatedUsername())

  const [file, setFile] = useState<File | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [sheet, setSheet] = useState('')
  const [month, setMonth] = useState('')
  // tên sheet của lần kiểm tra gần nhất (cùng file) → gợi ý cho ô Sheet
  const [knownSheets, setKnownSheets] = useState<string[]>([])

  // kết quả dry-run hợp lệ với file + tham số hiện tại; đổi file / tham số → null
  const [checked, setChecked] = useState<EvnImportResult | null>(null)
  const [imported, setImported] = useState<EvnImportResult | null>(null)
  // mỗi lượt gọi API thành công +1 → dựng lại phần kết quả (bộ lọc về mặc định)
  const [runId, setRunId] = useState(0)

  // request đang chạy của phần import; calibrating = khối hiệu chỉnh đang gọi API
  const [request, setRequest] = useState<Busy>(null)
  const [calibrating, setCalibrating] = useState(false)
  const busy = request ?? (calibrating ? 'calibrate' : null)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const fileInput = useRef<HTMLInputElement>(null)
  // chặn 2 request cùng lúc (kể cả bấm 2 lần trước khi kịp render lại)
  const inFlight = useRef(false)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const sheetParam = sheet.trim()
  // tháng chỉ có nghĩa khi có sheet
  const monthParam = sheetParam ? month : ''
  const monthInvalid = monthParam !== '' && !MONTH_PATTERN.test(monthParam)

  const canCheck = Boolean(file) && !busy && !monthInvalid
  const writable = checked ? checked.inserted + checked.updated : 0
  // writable = 0 vẫn cho import: DB không đổi nhưng cần response thật (dryRun=false)
  // để mở bước Hiệu chỉnh tổn thất khi dữ liệu EVN đã có sẵn trong DB
  const canImport = Boolean(file) && !busy && checked !== null

  function resetResults() {
    setChecked(null)
    setImported(null)
    setError(null)
  }

  function pickFile(next: File | undefined) {
    if (!next || busy) return

    if (!next.name.toLowerCase().endsWith('.xlsx')) {
      setError(labels.errors.badExtension)
      return
    }

    if (next.size > EVN_IMPORT_MAX_BYTES) {
      setError(labels.errors.tooLarge)
      return
    }

    setFile(next)
    setKnownSheets([])
    resetResults()
  }

  function changeSheet(value: string) {
    if (value === sheet) return
    setSheet(value)
    resetResults()
  }

  function changeMonth(value: string) {
    if (value === month) return
    setMonth(value)
    resetResults()
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setDragOver(false)
    pickFile(event.dataTransfer.files[0])
  }

  async function run(dryRun: boolean) {
    if (!file || inFlight.current) return
    inFlight.current = true

    const ctrl = new AbortController()
    controller.current = ctrl

    setRequest(dryRun ? 'check' : 'import')
    setError(null)
    if (dryRun) {
      setChecked(null)
      setImported(null)
    }

    try {
      const result = await importEvnDaily(
        file,
        {
          dryRun,
          importedBy: importedBy ?? undefined,
          sheet: sheetParam || undefined,
          month: monthParam || undefined,
        },
        ctrl.signal,
      )

      if (ctrl.signal.aborted) return

      setRunId((n) => n + 1)
      if (dryRun) {
        setChecked(result)
        if (!sheetParam) setKnownSheets(result.sheets.map((s) => s.sheet))
      } else {
        // đã ghi → phải kiểm tra lại trước khi import tiếp
        setChecked(null)
        setImported(result)
        // các kỳ khác của màn So sánh tải lại số mới ở lần xem sau
        clearQueryCache('utility-evn:')
        onImported?.(result)
      }
    } catch (err) {
      if (ctrl.signal.aborted) return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      inFlight.current = false
      if (!ctrl.signal.aborted) setRequest(null)
    }
  }

  function confirmImport() {
    setConfirmOpen(false)
    void run(false)
  }

  function handleCalibrated() {
    // BE đã xóa cache; FE bỏ cache các kỳ đã xem + màn So sánh tải lại kỳ đang xem
    clearQueryCache('utility-evn:')
    onCalibrated?.()
  }

  const shown = imported ?? checked

  let importHint: string | null = null
  if (!busy && file) {
    if (!checked && !imported) importHint = labels.needCheck
    else if (checked && writable === 0) importHint = labels.nothingToImport
  }

  const dropZone = (
    <Box
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-disabled={Boolean(busy)}
      onClick={() => !busy && fileInput.current?.click()}
      onKeyDown={(event) => {
        if (!busy && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          fileInput.current?.click()
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!busy) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      sx={(theme) => ({
        px: 2,
        py: 2.5,
        border: '1.5px dashed',
        borderColor: dragOver ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        bgcolor: dragOver ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
        cursor: busy ? 'default' : 'pointer',
        opacity: busy ? 0.6 : 1,
        textAlign: 'center',
        transition: 'border-color 120ms, background-color 120ms',
        '&:hover': busy ? undefined : { borderColor: 'primary.main' },
        '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      })}
    >
      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={(event) => {
          pickFile(event.target.files?.[0])
          // chọn lại đúng file cũ vẫn kích hoạt onChange
          event.target.value = ''
        }}
      />

      {file ? (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', gap: 1, minWidth: 0 }}>
          <DescriptionOutlinedIcon fontSize="small" color="primary" />
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, minWidth: 0 }} noWrap>
            {file.name}
          </Typography>
          <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary', flexShrink: 0 }}>
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'primary.main', flexShrink: 0 }}>
            · {labels.drop.change}
          </Typography>
        </Stack>
      ) : (
        <Stack sx={{ alignItems: 'center', gap: 0.5 }}>
          <UploadFileOutlinedIcon color="action" />
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{labels.drop.title}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{labels.drop.hint}</Typography>
        </Stack>
      )}
    </Box>
  )

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: uiTokens.page.gap }}>
        <EvnSection
          title={labels.stepFile}
          extra={importedBy && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
              {labels.importedBy(importedBy)}
            </Typography>
          )}
        >
          <Stack sx={{ gap: 1.25 }}>
            {dropZone}

            <Box>
              <Button
                size="small"
                color="inherit"
                onClick={() => setAdvancedOpen((v) => !v)}
                endIcon={advancedOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                sx={{ textTransform: 'none', color: 'text.secondary', px: 0.5 }}
              >
                {labels.advanced}
                {!advancedOpen && sheetParam && (
                  <Box component="span" sx={{ ml: 0.75, color: 'primary.main', fontWeight: 700 }}>
                    · {labels.advancedActive(sheetParam)}
                    {monthParam && ` · ${monthParam}`}
                  </Box>
                )}
              </Button>

              <Collapse in={advancedOpen}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  sx={{ gap: 1.5, pt: 1, alignItems: { sm: 'flex-start' } }}
                >
                  <Autocomplete
                    freeSolo
                    options={knownSheets}
                    inputValue={sheet}
                    onInputChange={(_, value) => changeSheet(value)}
                    disabled={Boolean(busy)}
                    sx={{ width: { xs: '100%', sm: 260 } }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label={labels.sheet}
                        helperText={labels.sheetHint}
                      />
                    )}
                  />

                  <TextField
                    type="month"
                    size="small"
                    label={labels.month}
                    value={month}
                    onChange={(event) => changeMonth(event.target.value)}
                    disabled={Boolean(busy) || !sheetParam}
                    error={monthInvalid}
                    helperText={monthInvalid ? labels.errors.badMonth : labels.monthHint}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: { xs: '100%', sm: 220 } }}
                  />
                </Stack>
              </Collapse>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <AppButton
                appearance="action"
                icon={<FactCheckOutlinedIcon fontSize="small" />}
                loading={busy === 'check'}
                disabled={!canCheck}
                onClick={() => void run(true)}
              >
                {labels.check}
              </AppButton>

              <AppButton
                appearance="success"
                icon={<CloudUploadOutlinedIcon fontSize="small" />}
                loading={busy === 'import'}
                disabled={!canImport}
                onClick={() => setConfirmOpen(true)}
              >
                {labels.import}
              </AppButton>

              {request && (
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {request === 'check' ? labels.checking : labels.importing}
                  </Typography>
                </Stack>
              )}

              {importHint && (
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{importHint}</Typography>
              )}
            </Stack>
          </Stack>
        </EvnSection>

        {shown && !request && (
          <EvnImportResultView key={runId} result={shown}>
            {/* Bước B: chỉ sau import thật; key=runId → mỗi lần import mới mở lại nút tính */}
            {!shown.dryRun && (
              <EvnCalibrationSection
                calibration={shown.calibration}
                dataChanged={shown.inserted + shown.updated > 0}
                createdBy={importedBy}
                locked={Boolean(request)}
                onBusyChange={setCalibrating}
                onCalibrated={handleCalibrated}
              />
            )}
          </EvnImportResultView>
        )}
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 800 }}>{labels.confirm.title}</DialogTitle>
        {checked && file && (
          <DialogContent dividers>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1, wordBreak: 'break-all' }}>
              {labels.confirm.file(file.name)}
              {sheetParam && ` · ${labels.advancedActive(sheetParam)}`}
              {monthParam && ` · ${monthParam}`}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 14, '& li': { py: 0.25 } }}>
              <li>
                <Box component="strong" sx={{ color: 'success.main' }}>{labels.confirm.insert(count(checked.inserted))}</Box>
              </li>
              <li>
                <Box component="strong" sx={{ color: 'info.main' }}>{labels.confirm.update(count(checked.updated))}</Box>
              </li>
              <li>
                <Box component="strong" sx={{ color: checked.rejected > 0 ? 'error.main' : 'text.secondary' }}>
                  {labels.confirm.rejected(count(checked.rejected))}
                </Box>
              </li>
            </Box>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 1 }}>{labels.confirm.note}</Typography>
            {writable === 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>{labels.confirm.noChange}</Alert>
            )}
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <AppButton onClick={() => setConfirmOpen(false)}>{labels.confirm.cancel}</AppButton>
          <AppButton appearance="success" disabled={!canImport} onClick={confirmImport}>
            {labels.confirm.ok}
          </AppButton>
        </DialogActions>
      </Dialog>
    </>
  )
}
