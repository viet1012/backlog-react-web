import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import {
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useStableCallback } from '../../hooks/useStableCallback'
import type { AiLogFilters, AiLogSource } from '../../types/assistantLogs'
import { MAX_RANGE_DAYS } from './aiLogsUtils'
import { useI18n } from '../../i18n/useI18n'

interface AiLogsFilterBarProps {
  value: AiLogFilters
  onChange: (next: AiLogFilters) => void
  onReset: () => void
}

const TEXT_DEBOUNCE_MS = 400

const dateSlotProps = {
  textField: { size: 'small' as const, sx: { width: 150 } },
}

// Ô text gõ tự do → chỉ đẩy lên sau khi ngừng gõ
function useDebouncedField(
  external: string,
  commit: (value: string) => void,
) {
  const [draft, setDraft] = useState(external)
  // luôn gọi bản commit mới nhất (bộ lọc khác có thể đổi trong lúc chờ debounce)
  const latestCommit = useStableCallback(commit)

  // bộ lọc bị đặt lại từ ngoài → đồng bộ ô nhập
  const [prevExternal, setPrevExternal] = useState(external)
  if (prevExternal !== external) {
    setPrevExternal(external)
    setDraft(external)
  }

  useEffect(() => {
    if (draft === external) return
    const timer = window.setTimeout(() => latestCommit(draft), TEXT_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [draft, external, latestCommit])

  return [draft, setDraft] as const
}

export function AiLogsFilterBar({ value, onChange, onReset }: AiLogsFilterBarProps) {
  const { t } = useI18n()
  const labels = t.aiLogs.filters

  const [user, setUser] = useDebouncedField(value.userId, (userId) => onChange({ ...value, userId }))
  const [q, setQ] = useDebouncedField(value.q, (q) => onChange({ ...value, q }))
  const [slower, setSlower] = useDebouncedField(
    value.slowerThanSec == null ? '' : String(value.slowerThanSec),
    (raw) => {
      const n = Number(raw)
      onChange({ ...value, slowerThanSec: raw.trim() === '' || !Number.isFinite(n) || n <= 0 ? null : n })
    },
  )

  const from = dayjs(value.from)
  const to = dayjs(value.to)

  function setDate(key: 'from' | 'to', next: Dayjs | null) {
    if (!next || !next.isValid()) return
    const date = next.format('YYYY-MM-DD')
    // giữ from ≤ to và khoảng ≤ MAX_RANGE_DAYS (BE trả 400 nếu vượt): lệch thì kéo đầu kia theo
    const span = MAX_RANGE_DAYS - 1
    if (key === 'from') {
      const maxTo = next.add(span, 'day').format('YYYY-MM-DD')
      const to = date > value.to ? date : value.to > maxTo ? maxTo : value.to
      onChange({ ...value, from: date, to })
    } else {
      const minFrom = next.subtract(span, 'day').format('YYYY-MM-DD')
      const from = date < value.from ? date : value.from < minFrom ? minFrom : value.from
      onChange({ ...value, to: date, from })
    }
  }

  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', py: 0.5 }}
    >
      <DatePicker
        label={labels.from}
        value={from}
        onChange={(v) => setDate('from', v)}
        format="DD/MM/YYYY"
        maxDate={dayjs()}
        slotProps={dateSlotProps}
      />

      <DatePicker
        label={labels.to}
        value={to}
        onChange={(v) => setDate('to', v)}
        format="DD/MM/YYYY"
        maxDate={dayjs()}
        slotProps={dateSlotProps}
      />

      <TextField
        size="small"
        label={labels.user}
        placeholder={labels.userPlaceholder}
        value={user}
        onChange={(e) => setUser(e.target.value)}
        sx={{ width: 130 }}
      />

      <TextField
        size="small"
        label={labels.search}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ width: 240 }}
        slotProps={{
          // BE: q ≤ 200 ký tự
          htmlInput: { maxLength: 200 },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        select
        size="small"
        label={labels.status}
        value={value.ok}
        onChange={(e) => onChange({ ...value, ok: e.target.value as AiLogFilters['ok'] })}
        sx={{ width: 120 }}
      >
        <MenuItem value="">{labels.all}</MenuItem>
        <MenuItem value="true">{labels.ok}</MenuItem>
        <MenuItem value="false">{labels.error}</MenuItem>
      </TextField>

      <TextField
        select
        size="small"
        label={labels.source}
        value={value.source}
        onChange={(e) => onChange({ ...value, source: e.target.value as '' | AiLogSource })}
        sx={{ width: 110 }}
      >
        <MenuItem value="">{labels.all}</MenuItem>
        <MenuItem value="chat">{labels.chat}</MenuItem>
        <MenuItem value="eval">{labels.eval}</MenuItem>
      </TextField>

      <TextField
        size="small"
        type="number"
        label={labels.slowerThan}
        value={slower}
        onChange={(e) => setSlower(e.target.value)}
        sx={{ width: 140 }}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
      />

      <Button
        size="small"
        startIcon={<RestartAltRoundedIcon />}
        onClick={onReset}
        sx={{ textTransform: 'none' }}
      >
        {labels.reset}
      </Button>
    </Stack>
  )
}
