import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Box,
  ButtonBase,
  Popover,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'

import { uiTokens } from '../../theme/uiTokens'
import { AppButton } from '../common/AppButton'
import {
  RANGE_PRESETS,
  rangeLabel,
  resolveRange,
  type MonitorRange,
} from './monitorRange'

// =========================================================
// NÚT KHOẢNG NGÀY: "📅 01/10 – 27/10/2026 ⌄" -> popover: preset (áp dụng ngay) | Từ / Đến tuỳ chọn
// =========================================================

const ISO = 'YYYY-MM-DD'
const POPOVER_W = 360

export function HistoryRangeButton({
  value,
  onChange,
  ariaLabel,
}: {
  value: MonitorRange
  onChange: (r: MonitorRange) => void
  ariaLabel: string
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  // bản nháp Từ / Đến (chỉ áp dụng khi bấm "Áp dụng")
  const [from, setFrom] = useState<Dayjs | null>(null)
  const [to, setTo] = useState<Dayjs | null>(null)

  function open(el: HTMLElement) {
    const r = resolveRange(value)

    setFrom(r.from ? dayjs(r.from) : null)
    setTo(r.to ? dayjs(r.to) : null)
    setAnchor(el)
  }

  const fromOk = !from || from.isValid()
  const toOk = !to || to.isValid()
  // chặn Đến < Từ
  const orderOk = !from || !to || !to.isBefore(from, 'day')
  const canApply = fromOk && toOk && orderOk && !!(from || to)

  return (
    <>
      <ButtonBase
        onClick={(e) => open(e.currentTarget)}
        aria-label={`${ariaLabel}: ${rangeLabel(value)}`}
        aria-haspopup="dialog"
        sx={{
          flex: '1 1 auto',
          minWidth: 0,
          height: 32,
          px: 1,
          gap: 0.75,
          justifyContent: 'flex-start',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          bgcolor: 'background.paper',
          '&:hover': { borderColor: 'text.secondary' },
        }}
      >
        <CalendarMonthOutlinedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
        <Typography noWrap sx={{ flex: 1, minWidth: 0, textAlign: 'left', fontSize: 12.5, fontWeight: 600 }}>
          {rangeLabel(value)}
        </Typography>
        <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
      </ButtonBase>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: POPOVER_W,
              maxWidth: 'calc(100vw - 16px)',
              borderRadius: uiTokens.card.borderRadius,
              display: 'grid',
              gridTemplateColumns: '128px minmax(0, 1fr)',
            },
          },
        }}
      >
        {/* preset: bấm = áp dụng ngay + đóng */}
        <Box role="listbox" aria-label="Khoảng có sẵn" sx={{ py: 0.75, borderRight: '1px solid', borderColor: 'divider' }}>
          {RANGE_PRESETS.map((p) => {
            const on = value.preset === p.id

            return (
              <ButtonBase
                key={p.id}
                role="option"
                aria-selected={on}
                onClick={() => {
                  onChange({ preset: p.id, from: null, to: null })
                  setAnchor(null)
                }}
                sx={{
                  width: '100%',
                  px: 1.25,
                  py: 0.75,
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: on ? 700 : 400,
                  color: on ? 'primary.main' : 'text.primary',
                  bgcolor: on ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {p.label}
                {on && <CheckRoundedIcon sx={{ fontSize: 16 }} />}
              </ButtonBase>
            )
          })}
        </Box>

        {/* khoảng tuỳ chọn */}
        <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
            Tuỳ chọn
          </Typography>

          <DatePicker
            label="Từ"
            value={from}
            onChange={(v) => setFrom(v)}
            format="DD/MM/YYYY"
            maxDate={to && to.isValid() ? to : undefined}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          <DatePicker
            label="Đến"
            value={to}
            onChange={(v) => setTo(v)}
            format="DD/MM/YYYY"
            minDate={from && from.isValid() ? from : undefined}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                error: !orderOk,
                helperText: orderOk ? undefined : 'Đến phải sau Từ',
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75, mt: 0.25 }}>
            <AppButton onClick={() => setAnchor(null)} sx={{ height: 30, minWidth: 0 }}>
              Huỷ
            </AppButton>
            <AppButton
              appearance="action"
              disabled={!canApply}
              onClick={() => {
                onChange({
                  preset: 'custom',
                  from: from ? from.format(ISO) : null,
                  to: to ? to.format(ISO) : null,
                })
                setAnchor(null)
              }}
              sx={{ height: 30, minWidth: 0 }}
            >
              Áp dụng
            </AppButton>
          </Box>
        </Box>
      </Popover>
    </>
  )
}
