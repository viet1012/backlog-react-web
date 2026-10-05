import type { ReactNode } from 'react'

import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded'
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

import {
  alpha,
  Box,
  Stack,
  useTheme,
} from '@mui/material'
import type { Theme } from '@mui/material/styles'


// =========================================================
// Các phần tử trực quan dùng trong nội dung tour.
// Mục tiêu: ít chữ, người dùng nhận ra ngay thứ họ sẽ thấy trên màn hình.
// =========================================================


/** Phím bàn phím: <Kbd>Enter</Kbd> */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <Box
      component="kbd"
      sx={{
        display: 'inline-block',
        minWidth: 20,
        px: 0.6,
        mx: 0.25,
        fontFamily: 'inherit',
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1.6,
        textAlign: 'center',
        border: 1,
        borderBottomWidth: 2,
        borderColor: 'divider',
        borderRadius: 0.75,
        bgcolor: 'background.paper',
        color: 'text.primary',
        verticalAlign: 'baseline',
      }}
    >
      {children}
    </Box>
  )
}


/** Nút / nhãn đúng như trên màn hình: <Ui>Columns</Ui> */
export function Ui({
  children,
  filled = false,
}: {
  children: ReactNode
  filled?: boolean
}) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 0.75,
        mx: 0.25,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
        borderRadius: 0.75,
        border: 1,
        borderColor: 'primary.main',
        color: filled ? 'primary.contrastText' : 'primary.main',
        bgcolor: filled ? 'primary.main' : 'transparent',
        verticalAlign: 'baseline',
      }}
    >
      {children}
    </Box>
  )
}


/** Bút dạ quang cho ý quan trọng: <Hl>chưa lưu</Hl> */
export function Hl({ children }: { children: ReactNode }) {
  const theme = useTheme()

  return (
    <Box
      component="mark"
      sx={{
        px: 0.4,
        borderRadius: 0.5,
        fontWeight: 600,
        color: 'text.primary',
        bgcolor: alpha(theme.palette.warning.main, 0.25),
      }}
    >
      {children}
    </Box>
  )
}


/** Màu lấy theo theme, ví dụ FAC_CONFIRM_PROCESS_CONFIG.Rough.getColor */
export type GuideColor = (theme: Theme) => string


/** Dãy lựa chọn: <Options items={['Sale', 'Stock']} /> */
export function Options({
  items,
  color,
}: {
  items: string[]
  color?: GuideColor
}) {
  const theme = useTheme()
  const main = color?.(theme)

  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', gap: 0.5 }}
    >
      {items.map((item) => (
        <Box
          key={item}
          component="span"
          sx={{
            px: 0.9,
            py: 0.1,
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 5,
            bgcolor: main ? alpha(main, 0.14) : 'action.selected',
            color: main ?? 'text.primary',
            whiteSpace: 'nowrap',
          }}
        >
          {item}
        </Box>
      ))}
    </Stack>
  )
}


/** Bảng "nhãn → lựa chọn", ví dụ Division → Heat Type */
export function OptionTable({
  rows,
}: {
  rows: { label: string, items: string[], color?: GuideColor }[]
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        columnGap: 1.5,
        rowGap: 0.75,
        alignItems: 'center',
        p: 1.25,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
      }}
    >
      {rows.map((row) => [
        <Box
          key={`${row.label}-l`}
          sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary' }}
        >
          {row.label}
        </Box>,
        <Options
          key={`${row.label}-o`}
          items={row.items}
          color={row.color}
        />,
      ])}
    </Box>
  )
}


/** Nhãn hệ quả lặp lại ở nhiều bước, thay cho câu chữ dài */
export type BadgeKind =
  | 'saved'
  | 'clearsFilters'
  | 'today'

const BADGES: Record<
  BadgeKind,
  { label: string, icon: ReactNode, tone: 'success' | 'warning' | 'info' }
> = {
  saved: {
    label: 'Được ghi nhớ',
    icon: <BookmarkRoundedIcon sx={{ fontSize: 14 }} />,
    tone: 'success',
  },
  clearsFilters: {
    label: 'Xóa bộ lọc cột',
    icon: <FilterAltOffRoundedIcon sx={{ fontSize: 14 }} />,
    tone: 'warning',
  },
  today: {
    label: 'Luôn mặc định hôm nay',
    icon: <TodayRoundedIcon sx={{ fontSize: 14 }} />,
    tone: 'info',
  },
}

export function Badges({ kinds }: { kinds: BadgeKind[] }) {
  const theme = useTheme()

  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', gap: 0.75 }}
    >
      {kinds.map((kind) => {
        const badge = BADGES[kind]
        const main = theme.palette[badge.tone].main

        return (
          <Box
            key={kind}
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0.9,
              py: 0.25,
              fontSize: 11.5,
              fontWeight: 600,
              borderRadius: 5,
              color: `${badge.tone}.main`,
              bgcolor: alpha(main, 0.12),
            }}
          >
            {badge.icon}
            {badge.label}
          </Box>
        )
      })}
    </Stack>
  )
}


/** Hộp lưu ý ngắn, tối đa 1 hộp mỗi bước */
export function Note({
  children,
  tone = 'info',
}: {
  children: ReactNode
  tone?: 'info' | 'warning'
}) {
  const theme = useTheme()
  const main = theme.palette[tone].main

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        p: 1,
        fontSize: 12.5,
        lineHeight: 1.5,
        color: 'text.primary',
        borderRadius: 1,
        borderLeft: 3,
        borderColor: `${tone}.main`,
        bgcolor: alpha(main, 0.1),
      }}
    >
      {tone === 'warning'
        ? <WarningAmberRoundedIcon sx={{ fontSize: 16, mt: '1px', color: `${tone}.main` }} />
        : <InfoOutlinedIcon sx={{ fontSize: 16, mt: '1px', color: `${tone}.main` }} />}
      <Box>{children}</Box>
    </Box>
  )
}


/** Danh sách "gặp vấn đề → cách xử lý" */
export function Faq({
  items,
}: {
  items: { q: ReactNode, a: ReactNode }[]
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {items.map((item, i) => (
        <Box
          key={i}
          sx={{
            px: 1.25,
            py: 0.9,
            fontSize: 12.5,
            lineHeight: 1.5,
            borderTop: i === 0 ? 0 : 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ fontWeight: 700, color: 'text.primary' }}>
            {item.q}
          </Box>
          <Box sx={{ color: 'text.secondary' }}>
            {item.a}
          </Box>
        </Box>
      ))}
    </Box>
  )
}


/** Xếp các khối trong description cách đều nhau */
export function GuideBody({ children }: { children: ReactNode }) {
  return (
    <Stack spacing={1.25}>
      {children}
    </Stack>
  )
}
