import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  InputBase,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { TABULAR_NUMS } from './costChartConfig'
import { useI18n } from '../../i18n/useI18n'

// giá trị rỗng của ô được lọc bằng key '' (hiện "(Trống)")
export const BLANK_VALUE = ''

// render tối đa bấy nhiêu dòng (danh sách dài → gõ để tìm)
const MAX_VISIBLE = 300

export interface FilterOption {
  value: string
  count: number
}

interface CostTxColumnFilterProps {
  anchorEl: HTMLElement | null
  // tên cột (tiêu đề popover)
  label: string
  options: FilterOption[]
  // null = không lọc (tất cả)
  selected: ReadonlySet<string> | null
  loading: boolean
  // lỗi tải danh sách giá trị (BE /facets)
  error?: string | null
  // BE cắt bớt danh sách (quá limit) → tổng số giá trị, nhắc gõ để thu hẹp; null = đủ
  truncatedTotal?: number | null
  // hiển thị giá trị (vd ngày ISO → "05/11/2026 (Thu)"); mặc định giữ nguyên
  formatValue?: (value: string) => string
  onApply: (selected: Set<string> | null) => void
  onClose: () => void
}

function fold(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}

// Dropdown lọc kiểu Excel: tìm giá trị · chọn tất cả · checkbox từng giá trị (kèm số dòng)
export function CostTxColumnFilter({
  anchorEl,
  label,
  options,
  selected,
  loading,
  error = null,
  truncatedTotal = null,
  formatValue,
  onApply,
  onClose,
}: CostTxColumnFilterProps) {
  const { t } = useI18n()
  const labels = t.costDetail.tx.filter
  const display = (value: string) => (value === BLANK_VALUE ? labels.blank : formatValue ? formatValue(value) : value)

  // nháp: chỉ áp dụng khi bấm "Áp dụng"
  const [draft, setDraft] = useState<Set<string>>(
    () => new Set(selected ?? options.map((o) => o.value)),
  )
  const [query, setQuery] = useState('')

  // options đến sau (đang tải toàn bộ) → chưa lọc thì coi như chọn hết
  const [prevOptions, setPrevOptions] = useState(options)
  if (prevOptions !== options) {
    setPrevOptions(options)
    if (selected === null) setDraft(new Set(options.map((o) => o.value)))
  }

  const visible = useMemo(() => {
    const q = fold(query.trim())
    return q
      ? options.filter((o) => fold(display(o.value)).includes(q))
      : options
    // display chỉ phụ thuộc formatValue / labels
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [options, query, formatValue, labels.blank])

  const allVisibleChecked = visible.length > 0 && visible.every((o) => draft.has(o.value))
  const someVisibleChecked = visible.some((o) => draft.has(o.value))

  function toggleAllVisible() {
    setDraft((prev) => {
      const next = new Set(prev)
      for (const o of visible) {
        if (allVisibleChecked) next.delete(o.value)
        else next.add(o.value)
      }
      return next
    })
  }

  function toggle(value: string) {
    setDraft((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function apply() {
    // đang gõ tìm → chỉ giữ các giá trị khớp (giống Excel)
    const chosen = query.trim()
      ? new Set(visible.filter((o) => draft.has(o.value)).map((o) => o.value))
      : draft
    // chọn đủ mọi giá trị = không lọc
    onApply(chosen.size === options.length ? null : chosen)
  }

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { width: 300, mt: 0.5, display: 'flex', flexDirection: 'column', maxHeight: 440 } } }}
    >
      <Box sx={{ px: 1.25, pt: 1, pb: 0.75 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 800, mb: 0.75 }}>{labels.title(label)}</Typography>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', gap: 0.5, height: 30, px: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
        >
          <SearchRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
          <InputBase
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') apply()
            }}
            placeholder={labels.search}
            sx={{ flex: 1, fontSize: 12.5 }}
          />
        </Stack>
      </Box>

      {error ? (
        <Typography sx={{ fontSize: 12.5, color: 'error.main', px: 1.5, py: 2 }}>{error}</Typography>
      ) : loading && options.length === 0 ? (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 1.5, py: 2 }}>
          <CircularProgress size={16} />
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{labels.loading}</Typography>
        </Stack>
      ) : (
        <>
          <Box
            component="label"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 0.5,
              borderTop: 1,
              borderBottom: 1,
              borderColor: 'divider',
              cursor: 'pointer',
            }}
          >
            <Checkbox
              size="small"
              checked={allVisibleChecked}
              indeterminate={!allVisibleChecked && someVisibleChecked}
              onChange={toggleAllVisible}
              sx={{ p: 0.5 }}
            />
            <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
              {query.trim() ? labels.selectAllResults : labels.selectAll}
            </Typography>
            {loading && <CircularProgress size={12} sx={{ ml: 'auto', mr: 1 }} />}
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', py: 0.25 }}>
            {visible.slice(0, MAX_VISIBLE).map((o) => (
              <Box
                key={o.value}
                component="label"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 0.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Checkbox size="small" checked={draft.has(o.value)} onChange={() => toggle(o.value)} sx={{ p: 0.5 }} />
                <Typography
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 12.5,
                    fontStyle: o.value === BLANK_VALUE ? 'italic' : 'normal',
                    color: o.value === BLANK_VALUE ? 'text.secondary' : 'text.primary',
                  }}
                  noWrap
                  title={display(o.value)}
                >
                  {display(o.value)}
                </Typography>
                <Typography sx={{ ...TABULAR_NUMS, fontSize: 11.5, color: 'text.disabled', px: 0.75 }}>
                  {o.count.toLocaleString('en-US')}
                </Typography>
              </Box>
            ))}

            {visible.length === 0 && (
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', px: 1.5, py: 1.5 }}>{labels.noMatch}</Typography>
            )}
            {(visible.length > MAX_VISIBLE || truncatedTotal != null) && (
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', px: 1.5, py: 0.75 }}>
                {labels.tooMany(Math.min(MAX_VISIBLE, visible.length), truncatedTotal ?? visible.length)}
              </Typography>
            )}
          </Box>
        </>
      )}

      <Stack direction="row" sx={{ gap: 1, px: 1.25, py: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button
          size="small"
          disabled={selected === null}
          onClick={() => onApply(null)}
          sx={{ textTransform: 'none', mr: 'auto' }}
        >
          {labels.clear}
        </Button>
        <Button size="small" onClick={onClose} sx={{ textTransform: 'none' }}>
          {labels.cancel}
        </Button>
        <Button
          size="small"
          variant="contained"
          disableElevation
          disabled={draft.size === 0 || options.length === 0}
          onClick={apply}
          sx={{ textTransform: 'none' }}
        >
          {labels.apply}
        </Button>
      </Stack>
    </Popover>
  )
}
