import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Box,
  ButtonBase,
  Collapse,
  Dialog,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  useState,
  type ReactNode,
} from 'react'

import { hseImageUrl } from '../../../services/machineMonitorService'
import type {
  HseItem,
  HseMachine,
} from '../../../types/machineMonitor'
import { uiTokens } from '../../../theme/uiTokens'
import { codeFontFamily } from '../../machineLocator/machineLocatorColors'
import { toneColor } from '../monitorColors'
import type { MonitorTone } from '../monitorTypes'
import {
  formatHseDate,
  hseSeverity,
  hseStatusLabel,
  hseTone,
  isPastDue,
  isSafe,
} from './hseStatus'

interface Lightbox {
  names: string[]
  index: number
}

// =========================================================
// PANEL CHI TIẾT 1 MÁY (tab An toàn)
// =========================================================

// unassigned: nhóm lỗi không gắn máy -> card hiện thêm khu vực + máy ghi trên phiếu
export function HseDetailPanel({
  machine,
  unassigned = false,
}: {
  machine: HseMachine | undefined
  unassigned?: boolean
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [lightbox, setLightbox] = useState<Lightbox | null>(null)

  if (!machine) {
    return (
      <Typography sx={{ p: 2, fontSize: 13, color: 'text.secondary' }}>
        {unassigned ? 'Nhóm này không còn lỗi nào.' : 'Máy này chưa có lỗi an toàn nào được ghi nhận.'}
      </Typography>
    )
  }

  const items = [...(machine.items ?? [])].sort((a, b) =>
    hseSeverity(b.status) - hseSeverity(a.status) || (b.riskTotal ?? 0) - (a.riskTotal ?? 0))
  const open = items.filter((it) => !isSafe(it.status))
  const safe = items.filter((it) => isSafe(it.status))
  const openImages = (names: string[], index: number) => setLightbox({ names, index })

  return (
    <Box sx={{ px: 1.75, pb: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75, mb: 1.5 }}>
        <Stat label="Chưa xử lý" value={machine.openCount} tone="bad" />
        <Stat label="Quá hạn" value={machine.overdueCount} tone="critical" />
        <Stat label="Chờ HSE" value={machine.waitCount} tone="warn" />
        <Stat label="An toàn" value={machine.safeCount} tone="ok" />
      </Box>

      {open.length
        ? open.map((it) => <HseItemCard key={it.id} item={it} unassigned={unassigned} onOpenImages={openImages} />)
        : (
          <Typography sx={{ py: 1, fontSize: 13, color: 'text.secondary' }}>
            Không còn lỗi chưa đóng.
          </Typography>
        )}

      {safe.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <ButtonBase
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
            sx={{
              width: '100%',
              justifyContent: 'space-between',
              px: 1,
              py: 0.75,
              borderRadius: 1.5,
              fontSize: 12,
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Lịch sử đã an toàn ({safe.length})
            <ExpandMoreRoundedIcon
              sx={{ fontSize: 18, transition: 'transform .2s', transform: historyOpen ? 'rotate(180deg)' : 'none' }}
            />
          </ButtonBase>

          <Collapse in={historyOpen} unmountOnExit>
            <Box sx={{ pt: 0.75 }}>
              {safe.map((it) => <HseItemCard key={it.id} item={it} unassigned={unassigned} onOpenImages={openImages} />)}
            </Box>
          </Collapse>
        </Box>
      )}

      <ImageLightbox value={lightbox} onChange={setLightbox} />
    </Box>
  )
}

function Stat({ label, value, tone }: { label: string, value: number, tone: MonitorTone }) {
  return (
    <Box
      sx={(theme) => ({
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        px: 0.9,
        py: 0.6,
        bgcolor: alpha(theme.palette.text.primary, 0.025),
      })}
    >
      <Typography
        sx={(theme) => ({
          font: `700 18px ${codeFontFamily}`,
          lineHeight: 1.15,
          color: value ? toneColor(tone, theme.palette.mode === 'dark') : 'text.disabled',
        })}
      >
        {value ?? 0}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.25 }}>
        {label}
      </Typography>
    </Box>
  )
}

function ToneChip({ tone, children }: { tone: MonitorTone, children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={(theme) => {
        const c = toneColor(tone, theme.palette.mode === 'dark')

        return {
          display: 'inline-block',
          px: 0.9,
          py: 0.15,
          borderRadius: '12px',
          fontSize: uiTokens.typography.chip,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          color: c,
          bgcolor: alpha(c, 0.13),
        }
      }}
    >
      {children}
    </Box>
  )
}

// =========================================================
// 1 LỖI
// =========================================================

function HseItemCard({
  item,
  unassigned,
  onOpenImages,
}: {
  item: HseItem
  unassigned: boolean
  onOpenImages: (names: string[], index: number) => void
}) {
  const tone = hseTone(item.status)
  const pastDue = isPastDue(item.dueDate, item.status)
  const hasAt = !!(item.atStatus || item.atUser || item.atDate || item.atComment || item.atImageNames?.length)
  const hasHse = !!(item.hseJudge || item.hseUser || item.hseDate || item.hseComment || item.hseImageNames?.length)

  return (
    <Box
      sx={(theme) => ({
        mb: 1,
        p: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${toneColor(tone, theme.palette.mode === 'dark')}`,
        borderRadius: 2,
        bgcolor: 'background.paper',
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <ToneChip tone={tone}>{hseStatusLabel(item.status)}</ToneChip>

        {item.riskTotal != null && (
          <Tooltip
            title={item.riskFreq != null || item.riskProb != null || item.riskSev != null
              ? `Tần suất ${item.riskFreq ?? '-'} · Khả năng ${item.riskProb ?? '-'} · Mức độ ${item.riskSev ?? '-'}`
              : ''}
          >
            <Box component="span" sx={{ font: `700 12px ${codeFontFamily}`, color: 'text.primary' }}>
              Risk {item.riskTotal}
            </Box>
          </Tooltip>
        )}

        {item.stt != null && (
          <Box component="span" sx={{ ml: 'auto', font: `600 11.5px ${codeFontFamily}`, color: 'text.disabled' }}>
            #{item.stt}
          </Box>
        )}
      </Box>

      {item.area && !unassigned && (
        <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary', whiteSpace: 'pre-line' }}>
          {item.area}
        </Typography>
      )}

      <Box sx={kvSx}>
        {unassigned && (
          <>
            <span>Khu vực</span>
            <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
              {item.area || '-'}
              {item.division && (
                <Box
                  component="span"
                  sx={{
                    ml: 0.75,
                    px: 0.75,
                    borderRadius: '10px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    bgcolor: 'action.selected',
                  }}
                >
                  {item.division}
                </Box>
              )}
            </Box>
            <span>Máy (phiếu)</span>
            <Box component="span" sx={{ whiteSpace: 'pre-line', fontFamily: codeFontFamily }}>
              {item.machineText || '-'}
            </Box>
          </>
        )}
        <span>Phát hiện</span>
        <span>{[formatHseDate(item.createdAt), item.patrolUser].filter(Boolean).join(' · ') || '-'}</span>
        <span>PIC</span>
        <span>{item.pic || '-'}</span>
        <span>Hạn xử lý</span>
        <Box component="span" sx={pastDue ? { color: 'error.main', fontWeight: 700 } : undefined}>
          {formatHseDate(item.dueDate) || '-'}
          {pastDue ? ' (quá hạn)' : ''}
        </Box>
      </Box>

      <TextBlock label="Nội dung" text={item.comment} />
      <TextBlock label="Đối sách" text={item.countermeasure} />
      <Thumbs names={item.imageNames} onOpen={onOpenImages} />

      {hasAt && (
        <SubSection title="PIC khắc phục" chip={item.atStatus}>
          <Meta user={item.atUser} date={item.atDate} />
          <TextBlock text={item.atComment} />
          <Thumbs names={item.atImageNames} onOpen={onOpenImages} />
        </SubSection>
      )}

      {hasHse && (
        <SubSection title="HSE xác nhận" chip={item.hseJudge}>
          <Meta user={item.hseUser} date={item.hseDate} />
          <TextBlock text={item.hseComment} />
          <Thumbs names={item.hseImageNames} onOpen={onOpenImages} />
        </SubSection>
      )}
    </Box>
  )
}

function SubSection({ title, chip, children }: { title: string, chip?: string | null, children: ReactNode }) {
  return (
    <Box sx={{ mt: 1.25, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography sx={sectTitleSx}>{title}</Typography>
        {chip && (
          <Box
            component="span"
            sx={{
              px: 0.75,
              borderRadius: '10px',
              fontSize: 11.5,
              fontWeight: 600,
              bgcolor: 'action.selected',
            }}
          >
            {chip}
          </Box>
        )}
      </Box>
      {children}
    </Box>
  )
}

function Meta({ user, date }: { user?: string | null, date?: string | null }) {
  const text = [user, formatHseDate(date)].filter(Boolean).join(' · ')

  return text
    ? <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>{text}</Typography>
    : null
}

// text VN + JP nhiều dòng: giữ xuống dòng
function TextBlock({ label, text }: { label?: string, text?: string | null }) {
  if (!text?.trim()) return null

  return (
    <Box sx={{ mt: 0.75 }}>
      {label && <Typography sx={sectTitleSx}>{label}</Typography>}
      <Typography sx={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
        {text}
      </Typography>
    </Box>
  )
}

function Thumbs({ names, onOpen }: { names?: string[] | null, onOpen: (names: string[], index: number) => void }) {
  const list = (names ?? []).filter(Boolean)

  if (!list.length) return null

  return (
    <Box sx={{ mt: 0.75, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {list.map((n, i) => (
        <ButtonBase
          key={`${n}-${i}`}
          onClick={() => onOpen(list, i)}
          aria-label={`Phóng to ảnh ${n}`}
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1.5,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        >
          <Box
            component="img"
            src={hseImageUrl(n)}
            alt={n}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </ButtonBase>
      ))}
    </Box>
  )
}

// =========================================================
// ẢNH PHÓNG TO (←/→ chuyển ảnh trong cùng nhóm)
// =========================================================

function ImageLightbox({ value, onChange }: { value: Lightbox | null, onChange: (v: Lightbox | null) => void }) {
  const n = value?.names.length ?? 0
  const go = (d: number) => {
    if (value) onChange({ ...value, index: (value.index + d + n) % n })
  }
  const name = value?.names[value.index]

  return (
    <Dialog
      open={!!value}
      onClose={() => onChange(null)}
      maxWidth="lg"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1)
        if (e.key === 'ArrowRight') go(1)
      }}
      slotProps={{ paper: { sx: { borderRadius: uiTokens.dialog.borderRadius, bgcolor: '#111', position: 'relative' } } }}
    >
      {name && (
        <>
          <Box
            component="img"
            src={hseImageUrl(name)}
            alt={name}
            sx={{ display: 'block', maxWidth: '90vw', maxHeight: '82vh', objectFit: 'contain', mx: 'auto' }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, color: '#ddd' }}>
            <Typography noWrap sx={{ flex: 1, fontSize: 12, fontFamily: codeFontFamily }}>
              {name}
            </Typography>
            {n > 1 && (
              <>
                <IconButton size="small" aria-label="Ảnh trước" onClick={() => go(-1)} sx={{ color: '#ddd' }}>
                  <ChevronLeftRoundedIcon />
                </IconButton>
                <Typography sx={{ fontSize: 12 }}>{(value?.index ?? 0) + 1}/{n}</Typography>
                <IconButton size="small" aria-label="Ảnh sau" onClick={() => go(1)} sx={{ color: '#ddd' }}>
                  <ChevronRightRoundedIcon />
                </IconButton>
              </>
            )}
            <IconButton size="small" aria-label="Đóng" onClick={() => onChange(null)} sx={{ color: '#ddd' }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </>
      )}
    </Dialog>
  )
}

const kvSx = {
  mt: 0.75,
  display: 'grid',
  gridTemplateColumns: '76px 1fr',
  gap: '3px 8px',
  fontSize: 12.5,
  '& > span:nth-of-type(odd)': { color: 'text.secondary' },
} as const

const sectTitleSx = {
  fontSize: 11,
  fontWeight: 700,
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: '.04em',
} as const
