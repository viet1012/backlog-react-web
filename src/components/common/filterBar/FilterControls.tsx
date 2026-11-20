import type { ReactNode } from 'react'
import { Box, IconButton, InputAdornment, MenuItem, TextField, Typography, type SxProps, type Theme } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import dayjs from 'dayjs'

import { useDebouncedField } from '../../../hooks/useDebouncedField'
import { useI18n } from '../../../i18n/useI18n'

/*
 * Ô lọc dùng chung cho FilterBar. Cùng cỡ (small), cùng kiểu ngày (YYYY-MM-DD,
 * input date của trình duyệt), cùng mục "Tất cả" cho ô chọn.
 * `tour`: gắn data-tour cho hướng dẫn từng bước.
 */

type Width = number | string | { xs?: number | string, sm?: number | string }

const widthSx = (width: Width | undefined, shrink = false): SxProps<Theme> => ({
  width: typeof width === 'object' ? { xs: '100%', ...width } : { xs: '100%', sm: width ?? 'auto' },
  // ô tìm được co lại khi thanh chật (giống bố cục cũ), ô khác giữ nguyên cỡ
  flexShrink: shrink ? 1 : 0,
  minWidth: shrink ? 140 : undefined,
})

// icon lịch của input date. Chế độ tối: trình duyệt tự vẽ icon sáng nhờ
// color-scheme: dark (CssBaseline enableColorScheme), không cần invert
const dateInputSx: SxProps<Theme> = (theme) => ({
  '& input::-webkit-calendar-picker-indicator': {
    opacity: theme.palette.mode === 'dark' ? 0.8 : 1,
    cursor: 'pointer',
  },
})

// =========================================================
// TEXT / SEARCH
// =========================================================

interface FilterTextProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  /** Chỉ gọi onChange sau khi ngừng gõ (ms) */
  debounceMs?: number
  type?: 'text' | 'number'
  width?: Width
  maxLength?: number
  disabled?: boolean
  tour?: string
  /** Icon kính lúp + nút xóa nhanh */
  search?: boolean
}

export function FilterText({
  value,
  onChange,
  label,
  placeholder,
  debounceMs = 0,
  type = 'text',
  width,
  maxLength,
  disabled,
  tour,
  search = false,
}: FilterTextProps) {
  const [draft, setDraft] = useDebouncedField(value, onChange, debounceMs)

  return (
    <TextField
      data-tour={tour}
      size="small"
      type={type}
      label={label}
      placeholder={placeholder}
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      slotProps={{
        htmlInput: { maxLength, ...(type === 'number' ? { min: 0, step: 1 } : {}) },
        input: search
          ? {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 19 }} />
              </InputAdornment>
            ),
            endAdornment: draft
              ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label={label ?? placeholder}
                    onClick={() => {
                      setDraft('')
                      // xóa nhanh: không chờ debounce
                      if (debounceMs > 0) onChange('')
                    }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </InputAdornment>
              )
              : null,
          }
          : undefined,
      }}
      sx={widthSx(width, search)}
    />
  )
}

export function FilterSearch(props: Omit<FilterTextProps, 'search' | 'type'>) {
  return <FilterText {...props} search width={props.width ?? { sm: 260 }} />
}

// =========================================================
// SELECT
// =========================================================

export interface FilterOption<T extends string> {
  value: T
  label: ReactNode
}

interface FilterSelectProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: readonly (T | FilterOption<T>)[]
  /** Thêm mục "Tất cả" với giá trị '' */
  allOption?: boolean
  /** Nhãn của giá trị rỗng trong options (vd "(Blank)") */
  blankLabel?: string
  width?: Width
  disabled?: boolean
  tour?: string
}

export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  allOption = false,
  blankLabel,
  width,
  disabled,
  tour,
}: FilterSelectProps<T>) {
  const { t } = useI18n()

  return (
    <TextField
      data-tour={tour}
      select
      size="small"
      label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as T)}
      sx={widthSx(width ?? { sm: 135 })}
    >
      {allOption && <MenuItem value="">{t.common.all}</MenuItem>}

      {options.map((option) => {
        const item = typeof option === 'string' ? { value: option, label: option } : option

        return (
          <MenuItem key={item.value || '__blank'} value={item.value}>
            {item.value === '' && blankLabel ? blankLabel : item.label}
          </MenuItem>
        )
      })}
    </TextField>
  )
}

// =========================================================
// DATE
// =========================================================

interface FilterDateProps {
  label: string
  /** YYYY-MM-DD, '' = trống */
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  width?: Width
  disabled?: boolean
  tour?: string
}

export function FilterDate({ label, value, onChange, min, max, width, disabled, tour }: FilterDateProps) {
  return (
    <TextField
      data-tour={tour}
      type="date"
      size="small"
      label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { min, max },
      }}
      sx={[widthSx(width ?? { sm: 150 }), dateInputSx] as SxProps<Theme>}
    />
  )
}

interface FilterDateRangeProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  fromLabel?: string
  toLabel?: string
  /** Khoảng tối đa (số ngày, tính cả 2 đầu): lệch thì kéo đầu kia theo */
  maxDays?: number
  max?: string
  disabled?: boolean
}

/** Từ ngày → Đến ngày; luôn giữ from ≤ to (và khoảng ≤ maxDays) */
export function FilterDateRange({
  from,
  to,
  onChange,
  fromLabel,
  toLabel,
  maxDays,
  max,
  disabled,
}: FilterDateRangeProps) {
  const { t } = useI18n()

  function change(key: 'from' | 'to', value: string) {
    if (!value || !dayjs(value).isValid()) return

    const span = maxDays ? maxDays - 1 : null

    if (key === 'from') {
      let nextTo = to && value > to ? value : to
      if (span != null && nextTo) {
        const maxTo = dayjs(value).add(span, 'day').format('YYYY-MM-DD')
        if (nextTo > maxTo) nextTo = maxTo
      }
      onChange(value, nextTo)
    } else {
      let nextFrom = from && value < from ? value : from
      if (span != null && nextFrom) {
        const minFrom = dayjs(value).subtract(span, 'day').format('YYYY-MM-DD')
        if (nextFrom < minFrom) nextFrom = minFrom
      }
      onChange(nextFrom, value)
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
      <FilterDate
        label={fromLabel ?? t.common.dateFrom}
        value={from}
        max={max}
        disabled={disabled}
        onChange={(value) => change('from', value)}
      />
      <Typography color="text.secondary" sx={{ fontSize: 12 }} aria-hidden>→</Typography>
      <FilterDate
        label={toLabel ?? t.common.dateTo}
        value={to}
        max={max}
        disabled={disabled}
        onChange={(value) => change('to', value)}
      />
    </Box>
  )
}
