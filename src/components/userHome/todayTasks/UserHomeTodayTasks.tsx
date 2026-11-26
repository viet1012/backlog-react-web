import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import { Box, ButtonBase, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'

import { useI18n } from '../../../i18n/useI18n'
import { HOME_FONT } from '../homeFonts'
import { LED } from '../userHomeStyles'
import { SegmentDisplay } from '../warehouse/SegmentDisplay'
import { useTodayTasks, type TodayTask } from './useTodayTasks'

/*
 * "Việc của tôi hôm nay": nhóm 3 ô trên thanh đầu trang chủ (nền LED tối do thanh cung cấp).
 * Mỗi ô bấm vào là mở thẳng trang đã lọc sẵn. Số > 0 sáng đỏ (cần xử lý), = 0 sáng xanh.
 * Tên ô dùng bản ngắn; tên đầy đủ + dòng chi tiết nằm ở tooltip / aria.
 */

const pulse = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.6; }
`

interface TileProps<T> {
  icon: ReactNode
  label: string
  fullLabel: string
  task: TodayTask<T>
  value: (data: T) => number
  sub: (data: T) => string
  link: (data: T) => string
  /** Trang đích khi chưa có số liệu (lỗi): vẫn bấm vào xem được */
  fallbackLink: string
}

function Tile<T>({ icon, label, fullLabel, task, value, sub, link, fallbackLink }: TileProps<T>) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const count = task.data ? value(task.data) : null
  const color = count == null ? LED.amber : count > 0 ? LED.red : LED.green
  const digits = count == null ? (task.loading ? '---' : '--') : String(Math.min(count, 9999))
  const subText = task.data ? sub(task.data) : task.error ? t.userHome.today.loadFailed : ' '

  return (
    <ButtonBase
      onClick={() => navigate(task.data ? link(task.data) : fallbackLink)}
      aria-label={[fullLabel, count == null ? null : String(count), subText, t.userHome.today.open(fullLabel)]
        .filter(Boolean)
        .join('. ')}
      title={task.error ?? [fullLabel, task.data ? subText : null].filter(Boolean).join('\n')}
      sx={{
        minWidth: 0,
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        columnGap: 1,
        px: 1.1,
        py: 0.75,
        borderRadius: '9px',
        textAlign: 'left',
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${count && count > 0 ? `${LED.red}45` : 'rgba(255, 255, 255, 0.07)'}`,
        transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.07)', borderColor: `${LED.cyan}70` },
        '&:active': { transform: 'scale(0.985)' },
        '&.Mui-focusVisible': { outline: `2px solid ${LED.cyan}`, outlineOffset: 2 },
      }}
    >
      <Box sx={{ color: LED.cyan, opacity: 0.85, display: 'flex', '& svg': { fontSize: 19 } }}>
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontFamily: HOME_FONT, fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: '#e7edf5' }}>
          {label}
        </Typography>
        <Typography noWrap sx={{ fontFamily: HOME_FONT, fontSize: 10.5, lineHeight: 1.3, color: 'rgba(226, 232, 240, 0.6)' }}>
          {subText}
        </Typography>
      </Box>

      <Box
        aria-hidden
        sx={{
          fontSize: 22,
          lineHeight: 1,
          animation: task.loading && count == null ? `${pulse} 1.2s ease-in-out infinite` : 'none',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        <SegmentDisplay text={digits} color={color} />
      </Box>
    </ButtonBase>
  )
}

export function UserHomeTodayTasks() {
  const { t } = useI18n()
  const labels = t.userHome.today
  const tasks = useTodayTasks()

  // Số liệu cũ nhất đang hiện: cho biết dữ liệu mới đến đâu (chỉ tải lại khi quay lại trang)
  const times = [tasks.facConfirm, tasks.cost, tasks.machine]
    .map((task) => task?.updatedAt)
    .filter((at): at is number => at != null)
  const updatedText = times.length > 0 ? dayjs(Math.min(...times)).format('HH:mm') : null

  return (
    <Box component="section" aria-label={labels.title} sx={{ minWidth: 0 }}>
      <Box sx={{ mb: 0.6, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography
          component="h2"
          noWrap
          sx={{ minWidth: 0, fontFamily: HOME_FONT, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: LED.amber }}
        >
          {labels.title}
        </Typography>
        {updatedText && (
          <Typography component="span" sx={{ flexShrink: 0, fontFamily: HOME_FONT, fontSize: 10, color: 'rgba(226, 232, 240, 0.5)', fontVariantNumeric: 'tabular-nums' }}>
            {labels.updatedAt(updatedText)}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 0.75 }}>
        {tasks.facConfirm && (
          <Tile
            icon={<FactCheckOutlinedIcon />}
            label={labels.short.facConfirm}
            fullLabel={labels.facConfirm}
            task={tasks.facConfirm}
            value={(data) => data.remaining}
            sub={(data) => (data.remaining > 0
              ? labels.facConfirmSub(
                data.divLabel,
                data.byProcess.map((item) => `${item.process} ${item.remaining}`).join(' · '),
              )
              : labels.facConfirmDone(data.divLabel))}
            link={(data) => data.link}
            fallbackLink="/fac-confirm"
          />
        )}

        {tasks.cost && (
          <Tile
            icon={<TrendingUpOutlinedIcon />}
            label={labels.short.cost}
            fullLabel={labels.cost}
            task={tasks.cost}
            value={(data) => data.over}
            sub={(data) => labels.costSub(data.willExceed, data.month)}
            link={(data) => data.link}
            fallbackLink="/cost-monitoring"
          />
        )}

        {tasks.machine && (
          <Tile
            icon={<MonitorHeartOutlinedIcon />}
            label={labels.short.machine}
            fullLabel={labels.machine}
            task={tasks.machine}
            value={(data) => data.active}
            sub={(data) => labels.machineSub(data.overdue, data.topFloorName)}
            link={(data) => data.link}
            fallbackLink="/monitoring/machine"
          />
        )}
      </Box>
    </Box>
  )
}
