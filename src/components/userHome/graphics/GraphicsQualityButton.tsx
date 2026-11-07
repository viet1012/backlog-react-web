import { useState, type ReactNode } from 'react'

import { Box, IconButton, Popover, Radio, RadioGroup, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  AutoAwesomeRounded,
  CloseRounded,
  InfoOutlined,
  LightbulbOutlined,
  ViewInArRounded,
  WarningAmberRounded,
} from '@mui/icons-material'

import { useI18n } from '../../../i18n/useI18n'
import {
  GRAPHICS_LEVELS,
  GRAPHICS_LOAD,
  LEVEL_ACCENT,
  type GpuInfo,
  type GraphicsLevel,
  type GraphicsSetting,
} from './graphicsQuality'
import { GpuLoadMeter, QualityBars, QualityThumb } from './GraphicsVisuals'

export interface RenderSize {
  width: number
  height: number
  dpr: number
}

interface GraphicsQualityButtonProps {
  setting: GraphicsSetting
  // Mức thực tế đang dùng (đã tính Tự động / giới hạn máy)
  level: GraphicsLevel
  gpu: GpuInfo
  wide: boolean
  reduceMotion: boolean
  renderSize: RenderSize | null
  onChange: (setting: GraphicsSetting) => void
}

function Notice({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        mx: 2,
        mb: 1.2,
        p: 1.1,
        borderRadius: '10px',
        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
        border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
        color: 'text.secondary',
        '& svg': { fontSize: 17, mt: 0.1, color: 'warning.main' },
      }}
    >
      {icon}
      <Typography sx={{ fontSize: 12, lineHeight: 1.5 }}>{children}</Typography>
    </Box>
  )
}

interface OptionCardProps {
  value: GraphicsSetting
  selected: boolean
  disabled?: boolean
  accent: string
  leading: ReactNode
  title: ReactNode
  description: ReactNode
  badges?: ReactNode
  details?: ReactNode
}

// Thẻ radio: cả thẻ là <label> nên bấm đâu cũng chọn được; mũi tên lên/xuống chuyển mức (radio gốc)
function OptionCard({ value, selected, disabled, accent, leading, title, description, badges, details }: OptionCardProps) {
  return (
    <Box
      component="label"
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.2,
        px: 1.2,
        py: 1,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: selected ? alpha(accent, 0.55) : 'transparent',
        bgcolor: selected ? alpha(accent, 0.08) : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background-color 160ms ease, border-color 160ms ease',
        '&:hover': disabled ? undefined : { bgcolor: selected ? alpha(accent, 0.1) : 'action.hover' },
        '&:has(input:focus-visible)': { outline: `2px solid ${accent}`, outlineOffset: 1 },
      }}
    >
      <Radio
        value={value}
        disabled={disabled}
        size="small"
        sx={{ p: 0.4, mt: 0.6, color: 'text.disabled', '&.Mui-checked': { color: accent } }}
      />
      {leading}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>{title}</Typography>
          {badges}
        </Box>
        <Typography sx={{ mt: 0.2, fontSize: 12, lineHeight: 1.45, color: 'text.secondary' }}>{description}</Typography>
        {details}
      </Box>
    </Box>
  )
}

function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        px: 0.7,
        py: 0.1,
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.02em',
        color,
        bgcolor: alpha(color, 0.12),
        border: `1px solid ${alpha(color, 0.3)}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  )
}

export function GraphicsQualityButton({ setting, level, gpu, wide, reduceMotion, renderSize, onChange }: GraphicsQualityButtonProps) {
  const { t } = useI18n()
  const g = t.userHome.graphics
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const can3D = gpu.webgl && wide
  const accent = LEVEL_ACCENT[level]
  const load = GRAPHICS_LOAD[level]
  const levelName = (value: GraphicsLevel) => g.levels[value].name

  return (
    <>
      <Tooltip title={g.buttonAria}>
        <Box
          component="button"
          type="button"
          aria-label={`${g.buttonAria}: ${levelName(level)}`}
          aria-haspopup="dialog"
          aria-expanded={Boolean(anchor)}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.8,
            flexShrink: 0,
            height: 34,
            pl: 1,
            pr: 1.2,
            borderRadius: '34px',
            border: '1px solid',
            borderColor: anchor ? alpha(accent, 0.6) : 'divider',
            bgcolor: anchor ? alpha(accent, 0.1) : 'action.hover',
            color: 'text.primary',
            cursor: 'pointer',
            font: 'inherit',
            transition: 'border-color 160ms ease, background-color 160ms ease',
            '&:hover': { borderColor: alpha(accent, 0.5) },
            '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
          }}
        >
          <ViewInArRounded sx={{ fontSize: 18, color: accent }} />
          <Typography component="span" sx={{ display: { xs: 'none', sm: 'inline' }, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
            {levelName(level)}
          </Typography>
          <QualityBars value={load} color={accent} />
          {setting === 'auto' && (
            <Typography component="span" sx={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', color: 'text.secondary' }}>
              AUTO
            </Typography>
          )}
        </Box>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-label': g.title,
            sx: {
              mt: 1,
              width: 400,
              maxWidth: 'calc(100vw - 24px)',
              maxHeight: 'calc(100vh - 96px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: dark ? '0 24px 60px rgba(0, 0, 0, 0.55)' : '0 24px 60px rgba(15, 35, 60, 0.18)',
            },
          },
        }}
      >
        {/* Tiêu đề */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 2, pt: 1.8, pb: 1.4 }}>
          <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: '10px', color: accent, bgcolor: alpha(accent, 0.12) }}>
            <ViewInArRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{g.title}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{g.subtitle}</Typography>
          </Box>
          <IconButton size="small" aria-label={t.common.close} onClick={() => setAnchor(null)}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Box>

        {!gpu.webgl && <Notice icon={<InfoOutlined />}>{g.noWebgl}</Notice>}
        {gpu.webgl && !wide && <Notice icon={<InfoOutlined />}>{g.narrow}</Notice>}
        {can3D && reduceMotion && setting === 'auto' && <Notice icon={<InfoOutlined />}>{g.reducedMotion}</Notice>}

        {/* Danh sách mức */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1 }}>
          <RadioGroup value={setting} onChange={(event) => onChange(event.target.value as GraphicsSetting)} aria-label={g.title}>
            <OptionCard
              value="auto"
              selected={setting === 'auto'}
              accent={LEVEL_ACCENT[gpu.suggested]}
              leading={(
                <Box sx={{ width: 56, height: 44, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '10px', border: '1px solid', borderColor: 'divider', color: LEVEL_ACCENT[gpu.suggested] }}>
                  <AutoAwesomeRounded />
                </Box>
              )}
              title={g.auto}
              badges={<Badge color={theme.palette.success.main}>{g.recommended}</Badge>}
              description={g.autoDetected(gpu.renderer ?? g.unknownGpu, levelName(gpu.suggested))}
            />

            <Box sx={{ my: 0.8, mx: 1.2, borderTop: '1px solid', borderColor: 'divider' }} />

            {GRAPHICS_LEVELS.map((value) => {
              const selected = setting === value
              const color = LEVEL_ACCENT[value]
              const disabled = value !== 'flat' && !can3D
              const showInUse = setting === 'auto' && level === value

              return (
                <OptionCard
                  key={value}
                  value={value}
                  selected={selected}
                  disabled={disabled}
                  accent={color}
                  leading={<QualityThumb level={value} dark={dark} />}
                  title={(
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                      {g.levels[value].name}
                      <QualityBars value={GRAPHICS_LOAD[value]} color={color} />
                    </Box>
                  )}
                  badges={(
                    <>
                      {showInUse && <Badge color={color}>{g.inUse}</Badge>}
                      {value === 'ultra' && gpu.suggested !== 'high' && (
                        <Badge color={theme.palette.warning.main}>{g.needsDiscrete}</Badge>
                      )}
                    </>
                  )}
                  description={g.levels[value].desc}
                  details={(selected || showInUse) && (
                    // Chỉ thẻ đang chọn mới mở rộng danh sách tính năng -> bảng gọn
                    <Box sx={{ mt: 0.8, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {g.features[value].map((feature) => (
                        <Box key={feature} component="span" sx={{ px: 0.8, py: 0.2, borderRadius: '6px', fontSize: 10.5, fontWeight: 700, color: 'text.secondary', bgcolor: 'action.hover' }}>
                          {feature}
                        </Box>
                      ))}
                    </Box>
                  )}
                />
              )
            })}
          </RadioGroup>
        </Box>

        {/* Thông số thực tế */}
        <Box sx={{ mt: 1, px: 2, py: 1.4, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', display: 'grid', gap: 0.9 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{g.gpuLoad}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GpuLoadMeter load={load} />
              <Typography sx={{ minWidth: 72, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{g.loadLabels[load - 1]}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{g.renderSize}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {level === 'flat' || !renderSize
                ? g.renderSize2d
                : `${renderSize.width} × ${renderSize.height} · ${Number(renderSize.dpr.toFixed(2))}×`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary' }}>
            {level === 'ultra'
              ? <WarningAmberRounded sx={{ fontSize: 16, color: 'warning.main' }} />
              : <LightbulbOutlined sx={{ fontSize: 16 }} />}
            <Typography sx={{ fontSize: 11.5 }}>{g.tip}</Typography>
          </Box>
        </Box>
      </Popover>
    </>
  )
}
