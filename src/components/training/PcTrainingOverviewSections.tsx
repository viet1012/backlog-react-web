import {
  AccountTreeRounded,
  ArrowForwardRounded,
  AssignmentTurnedInRounded,
  InsightsRounded,
  LocalShippingRounded,
  ScheduleRounded,
} from '@mui/icons-material'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { primaryOrderFlow, replacementBranch, TODO_SOURCE_CONFIRMATION } from '../../data/training/pcOrderFlow'
import { pcTrainingModules } from '../../data/training/pcTrainingModules'
import { GlassPanel } from '../common/GlassPanel'
import { PcTrainingSection } from './PcTrainingSection'

const responsibilities = [
  { icon: <AssignmentTurnedInRounded />, title: 'Order Control', text: 'Theo dõi đơn hàng từ khi nhận đến khi hoàn thành và xuất khỏi nhà máy.' },
  { icon: <ScheduleRounded />, title: 'Production Planning', text: 'Kiểm soát đơn hàng và lập kế hoạch sản xuất theo dữ liệu thực tế.' },
  { icon: <InsightsRounded />, title: 'Process Monitoring', text: 'Theo dõi công đoạn, thời gian gia công và số lượng OK/NG.' },
  { icon: <LocalShippingRounded />, title: 'Delivery & Data Control', text: 'Kiểm tra kỳ hạn, thông tin xuất hàng, BOM và dữ liệu liên quan.' },
] as const

export function PcOverviewSection() {
  return (
    <PcTrainingSection id="overview" number="02" title="Production Control làm gì?" description="Bốn nhóm trách nhiệm cốt lõi được tổng hợp từ tài liệu đào tạo.">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1 }}>
        {responsibilities.map((item) => (
          <GlassPanel key={item.title} sx={{ p: 1.5 }}>
            <Box sx={{ color: 'primary.main', '& svg': { fontSize: 20 } }}>{item.icon}</Box>
            <Typography sx={{ mt: 0.65, fontSize: 13, fontWeight: 800 }}>{item.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45, fontSize: 12, lineHeight: 1.55 }}>{item.text}</Typography>
          </GlassPanel>
        ))}
      </Box>
    </PcTrainingSection>
  )
}

export function PcOrderFlow() {
  return (
    <PcTrainingSection id="order-flow" number="03" title="Order Flow" description="Quan hệ mã đơn hàng đã được xác nhận trong tài liệu.">
      <GlassPanel sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ alignItems: 'stretch' }}>
          {primaryOrderFlow.map((node, index) => (
            <Stack key={node.id} direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
              <Box sx={(theme) => ({ width: '100%', minHeight: 88, p: 1.25, display: 'grid', placeItems: 'center', textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.24), bgcolor: alpha(theme.palette.primary.main, 0.06) })}>
                <Box>
                  <Typography sx={{ color: 'primary.main', fontSize: 20, fontWeight: 900 }}>{node.label}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.3, fontSize: 11.5 }}>{node.caption}</Typography>
                </Box>
              </Box>
              {index < primaryOrderFlow.length - 1 && <ArrowForwardRounded sx={{ flexShrink: 0, color: 'text.disabled', transform: { xs: 'rotate(90deg)', md: 'none' } }} />}
            </Stack>
          ))}
        </Stack>
        <Box sx={(theme) => ({ mt: 1.25, p: 1.25, display: 'flex', gap: 1, alignItems: 'center', borderRadius: 2, border: '1px dashed', borderColor: alpha(theme.palette.warning.main, 0.4), bgcolor: alpha(theme.palette.warning.main, 0.06) })}>
          <AccountTreeRounded color="warning" />
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{replacementBranch.label} · Nhánh riêng</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>{replacementBranch.caption}; được tạo tham chiếu từ 41* trong quy trình của tài liệu.</Typography>
          </Box>
        </Box>
        {TODO_SOURCE_CONFIRMATION.map((note) => (
          <Typography key={note} color="text.disabled" sx={{ mt: 1, fontSize: 10.5 }}>{note}</Typography>
        ))}
      </GlassPanel>
    </PcTrainingSection>
  )
}

export function PcTrainingRoadmap() {
  return (
    <PcTrainingSection
      id="roadmap"
      number="05"
      title="Bạn sẽ tìm hiểu những gì?"
      description="Hành trình onboarding qua tám chủ đề nghiệp vụ Production Control."
    >
      <Box
        sx={{
          position: 'relative',

          display: 'grid',

          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },

          gap: {
            xs: 1.1,
            md: 1.4,
          },
        }}
      >
        {pcTrainingModules.map((module, index) => {
          const category =
            index === 0
              ? 'FOUNDATION'
              : index < 4
                ? 'CORE FLOW'
                : index < 6
                  ? 'OPERATIONS'
                  : 'BUSINESS DATA'

          return (
            <GlassPanel
              key={module.id}
              sx={(theme) => ({
                position: 'relative',

                minHeight: 128,

                p: 1.6,

                overflow: 'hidden',

                display: 'flex',
                flexDirection: 'column',

                border: `1px solid ${alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'dark'
                    ? 0.22
                    : 0.16,
                )}`,

                borderTop: `3px solid ${alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'dark'
                    ? 0.75
                    : 0.55,
                )}`,

                background:
                  theme.palette.mode === 'dark'
                    ? `linear-gradient(
                        145deg,
                        ${alpha(
                      theme.palette.primary.main,
                      0.09,
                    )},
                        ${alpha(
                      theme.palette.background.paper,
                      0.72,
                    )}
                      )`
                    : `linear-gradient(
                        145deg,
                        ${alpha(
                      theme.palette.primary.main,
                      0.055,
                    )},
                        ${alpha(
                      theme.palette.background.paper,
                      0.96,
                    )}
                      )`,

                boxShadow:
                  theme.palette.mode === 'dark'
                    ? `0 10px 24px ${alpha('#000', 0.12)}`
                    : `0 10px 24px ${alpha(
                      theme.palette.primary.main,
                      0.055,
                    )}`,

                transition:
                  'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',

                '&:hover': {
                  transform: 'translateY(-3px)',

                  borderColor: alpha(
                    theme.palette.primary.main,
                    0.35,
                  ),

                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? `0 14px 30px ${alpha('#000', 0.18)}`
                      : `0 14px 30px ${alpha(
                        theme.palette.primary.main,
                        0.10,
                      )}`,
                },

                '&::before': {
                  content: '""',

                  position: 'absolute',

                  width: 84,
                  height: 84,

                  top: -36,
                  right: -28,

                  borderRadius: '50%',

                  bgcolor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === 'dark'
                      ? 0.08
                      : 0.05,
                  ),

                  pointerEvents: 'none',
                },

                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',

                  '&:hover': {
                    transform: 'none',
                  },
                },
              })}
            >
              <Stack
                direction="row"
                spacing={1.1}
                sx={{
                  alignItems: 'flex-start',
                }}
              >
                {/* NUMBER */}
                <Box
                  sx={(theme) => ({
                    width: 38,
                    height: 30,

                    flexShrink: 0,

                    display: 'grid',
                    placeItems: 'center',

                    borderRadius: 1.4,

                    color:
                      theme.palette.primary.main,

                    bgcolor: alpha(
                      theme.palette.primary.main,
                      theme.palette.mode === 'dark'
                        ? 0.18
                        : 0.09,
                    ),

                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      theme.palette.mode === 'dark'
                        ? 0.42
                        : 0.26,
                    )}`,

                    fontSize: 11.5,
                    fontWeight: 900,

                    letterSpacing: '0.04em',

                    boxShadow: `inset 0 0 0 1px ${alpha(
                      theme.palette.common.white,
                      theme.palette.mode === 'dark'
                        ? 0.02
                        : 0.5,
                    )}`,
                  })}
                >
                  {module.number}
                </Box>

                <Box
                  sx={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {/* CATEGORY */}
                  <Typography
                    sx={{
                      color: 'primary.main',

                      fontSize: 9,
                      fontWeight: 900,

                      letterSpacing: '0.12em',

                      lineHeight: 1.2,
                    }}
                  >
                    {category}
                  </Typography>

                  {/* TITLE */}
                  <Typography
                    sx={{
                      mt: 0.45,

                      fontSize: 12.5,
                      fontWeight: 850,

                      lineHeight: 1.4,

                      color: 'text.primary',
                    }}
                  >
                    {module.title}
                  </Typography>
                </Box>
              </Stack>

              {/* SUMMARY */}
              <Typography
                color="text.secondary"
                sx={{
                  mt: 1.15,

                  fontSize: 11.3,
                  lineHeight: 1.5,

                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                }}
              >
                {module.summary}
              </Typography>

              {/* FOOTER */}
              <Box
                sx={{
                  mt: 'auto',
                  pt: 1.2,
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.45}
                  sx={{
                    flexWrap: 'wrap',
                    gap: 0.45,
                  }}
                >
                  {module.systems
                    .slice(0, 3)
                    .map((system) => (
                      <Chip
                        key={system}
                        label={system}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 22,

                          fontSize: 9.5,

                          '& .MuiChip-label': {
                            px: 0.75,
                          },
                        }}
                      />
                    ))}

                  {module.systems.length > 3 && (
                    <Chip
                      label={`+${module.systems.length - 3}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 22,

                        fontSize: 9.5,

                        '& .MuiChip-label': {
                          px: 0.75,
                        },
                      }}
                    />
                  )}
                </Stack>
              </Box>

              {/* DESKTOP CONNECTOR */}
              {index < pcTrainingModules.length - 1 && (
                <Box
                  sx={(theme) => ({
                    display: {
                      xs: 'none',
                      lg:
                        index === 3
                          ? 'none'
                          : 'block',
                    },

                    position: 'absolute',

                    top: '50%',
                    right: -12,

                    width: 12,
                    height: 2,

                    bgcolor: alpha(
                      theme.palette.primary.main,
                      0.28,
                    ),

                    zIndex: 2,

                    '&::after': {
                      content: '""',

                      position: 'absolute',

                      right: -1,
                      top: -3,

                      width: 0,
                      height: 0,

                      borderTop:
                        '4px solid transparent',

                      borderBottom:
                        '4px solid transparent',

                      borderLeft: `5px solid ${alpha(
                        theme.palette.primary.main,
                        0.4,
                      )}`,
                    },
                  })}
                />
              )}
            </GlassPanel>
          )
        })}
      </Box>
    </PcTrainingSection>
  )
}
