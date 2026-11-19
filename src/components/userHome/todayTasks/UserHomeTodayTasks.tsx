import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { Box, ButtonBase, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'

import { useI18n } from '../../../i18n/useI18n'
import { HOME_FONT } from '../homeFonts'
import { SegmentDisplay } from '../warehouse/SegmentDisplay'
import { useTodayTasks, type TodayTask } from './useTodayTasks'

/*
 * "Việc của tôi hôm nay": bảng điều độ cùng chất liệu với bảng LED phía trên
 * (nền đen, số LED 7 đoạn). Mỗi ô bấm vào là mở thẳng trang đã lọc sẵn.
 * Số > 0 sáng đỏ (cần xử lý), = 0 sáng xanh.
 */

const AMBER = '#ffbe5c'
const GREEN = '#52f59a'
const RED = '#ff6b6b'
const CYAN = '#6fd8ff'

const pulse = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.6; }
`

interface TileProps<T> {
  icon: ReactNode
  label: string
  task: TodayTask<T>
  value: (data: T) => number
  sub: (data: T) => string
  link: (data: T) => string
  /** Trang đích khi chưa có số liệu (lỗi): vẫn bấm vào xem được */
  fallbackLink: string
  /** Ô thấp hơn (cột hẹp giữa bảng LED và thẻ nhân viên) */
  dense?: boolean
}

function Tile<T>({ icon, label, task, value, sub, link, fallbackLink, dense = false }: TileProps<T>) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const count = task.data ? value(task.data) : null
  const color = count == null ? AMBER : count > 0 ? RED : GREEN
  const digits = count == null ? (task.loading ? '---' : '--') : String(Math.min(count, 9999))
  const subText = task.data ? sub(task.data) : task.error ? t.userHome.today.loadFailed : ' '

  return (
    <ButtonBase
      onClick={() => navigate(task.data ? link(task.data) : fallbackLink)}
      aria-label={[label, count == null ? null : String(count), subText, t.userHome.today.open(label)]
        .filter(Boolean)
        .join('. ')}
      title={task.error ?? undefined}
      sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: dense ? 1 : 1.25,
        px: dense ? 1.1 : 1.5,
        py: dense ? 0.6 : 1,
        borderRadius: '9px',
        textAlign: 'left',
        bgcolor: 'rgba(255, 255, 255, 0.025)',
        border: `1px solid ${count && count > 0 ? `${RED}40` : 'rgba(255, 255, 255, 0.07)'}`,
        transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.06)',
          borderColor: `${CYAN}66`,
        },
        '&:active': { transform: 'scale(0.985)' },
        '&.Mui-focusVisible': { outline: `2px solid ${CYAN}`, outlineOffset: 2 },
        '& .tile-chevron': { transition: 'transform 140ms ease' },
        '&:hover .tile-chevron': { transform: 'translateX(2px)' },
      }}
    >
      <Box sx={{ color: CYAN, opacity: 0.85, display: 'flex', '& svg': { fontSize: 20 } }}>
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontFamily: HOME_FONT, fontSize: 12, fontWeight: 700, color: AMBER, opacity: 0.9 }}>
          {label}
        </Typography>
        <Typography noWrap sx={{ mt: 0.25, fontFamily: HOME_FONT, fontSize: 11, color: 'rgba(226, 232, 240, 0.72)' }}>
          {subText}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box
          aria-hidden
          sx={{
            fontSize: dense ? 21 : 26,
            lineHeight: 1,
            animation: task.loading && count == null ? `${pulse} 1.2s ease-in-out infinite` : 'none',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <SegmentDisplay text={digits} color={color} />
        </Box>
        <ChevronRightRoundedIcon className="tile-chevron" sx={{ fontSize: 18, color: 'rgba(226, 232, 240, 0.5)' }} />
      </Box>
    </ButtonBase>
  )
}

interface UserHomeTodayTasksProps {
  /**
   * column: treo giữa bảng LED và thẻ nhân viên (màn rộng) – không lấy thêm
   *         chiều cao nên kệ hàng giữ nguyên kích thước như trước;
   * strip:  dải ngang dưới hàng đầu (màn hẹp, trang vốn đã cuộn được)
   */
  layout?: 'column' | 'strip'
}

export function UserHomeTodayTasks({ layout = 'strip' }: UserHomeTodayTasksProps) {
  const { t } = useI18n()
  const labels = t.userHome.today
  const tasks = useTodayTasks()
  const column = layout === 'column'

  return (
    <Box
      component="section"
      aria-label={labels.title}
      sx={{
        position: 'relative',
        width: column ? '100%' : 'min(1220px, 100%)',
        mx: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Xích treo lên trần, giống bảng LED */}
      {column && (['left', 'right'] as const).map((side) => (
        <Box
          key={side}
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: '100%',
            [side]: '18%',
            width: 4,
            height: 240,
            background: 'repeating-linear-gradient(180deg, #7b8796 0 6px, transparent 6px 9px)',
            borderLeft: '1px solid rgba(0, 0, 0, 0.25)',
          }}
        />
      ))}

    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        px: column ? 1 : { xs: 1.25, sm: 1.5 },
        pt: 0.9,
        pb: column ? 0.9 : 1.1,
        borderRadius: '12px',
        bgcolor: '#07090d',
        border: '3px solid #2b333e',
        boxShadow: '0 12px 26px rgba(0, 0, 0, 0.32), inset 0 0 22px rgba(0, 0, 0, 0.9)',
        // lưới chấm LED ở nền (giống bảng LED phía trên)
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.035) 0.8px, transparent 1.2px)',
          backgroundSize: '4px 4px',
        },
        '& > *': { position: 'relative' },
      }}
    >
      <Typography
        component="h2"
        sx={{
          mb: 0.75,
          fontFamily: HOME_FONT,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: AMBER,
          textShadow: `0 0 10px ${AMBER}55`,
        }}
      >
        {labels.title}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: column ? '1fr' : { xs: '1fr', sm: 'repeat(auto-fit, minmax(240px, 1fr))' },
          gap: column ? 0.5 : 0.75,
        }}
      >
        {tasks.facConfirm && (
          <Tile
            icon={<FactCheckOutlinedIcon />}
            label={labels.facConfirm}
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
            dense={column}
          />
        )}

        <Tile
          icon={<TrendingUpOutlinedIcon />}
          label={labels.cost}
          task={tasks.cost}
          value={(data) => data.over}
          sub={(data) => labels.costSub(data.willExceed, data.month)}
          link={(data) => data.link}
          fallbackLink="/cost-monitoring"
          dense={column}
        />

        <Tile
          icon={<MonitorHeartOutlinedIcon />}
          label={labels.machine}
          task={tasks.machine}
          value={(data) => data.active}
          sub={(data) => labels.machineSub(data.overdue, data.topFloorName)}
          link={(data) => data.link}
          fallbackLink="/monitoring/machine"
          dense={column}
        />
      </Box>
    </Box>
    </Box>
  )
}
