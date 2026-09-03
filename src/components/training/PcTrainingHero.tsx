import { ArrowDownwardRounded, HubRounded, RouteRounded, SchoolRounded } from '@mui/icons-material'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { AppButton } from '../common/AppButton'
import { GlassPanel } from '../common/GlassPanel'

interface Props {
  onNavigate: (id: string) => void
}

export function PcTrainingHero({ onNavigate }: Props) {
  return (
    <GlassPanel
      sx={(theme) => ({
        position: 'relative', overflow: 'hidden', minHeight: { xs: 330, md: 380 },
        p: { xs: 2.25, md: 3.5 }, display: 'grid', alignItems: 'center',
        backgroundImage: `linear-gradient(110deg, ${alpha(theme.palette.primary.main, 0.16)}, transparent 60%)`,
        '&::after': {
          content: '""', position: 'absolute', inset: 0, opacity: theme.palette.mode === 'dark' ? 0.16 : 0.1,
          backgroundImage: `linear-gradient(${theme.palette.divider} 1px, transparent 1px), linear-gradient(90deg, ${theme.palette.divider} 1px, transparent 1px)`,
          backgroundSize: '28px 28px', maskImage: 'linear-gradient(90deg, transparent 35%, black)', pointerEvents: 'none',
        },
      })}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) minmax(360px, .95fr)' }, gap: { xs: 2.5, md: 4 }, alignItems: 'center' }}>
        <Box>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'primary.main', mb: 1 }}>
          <SchoolRounded sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.12em' }}>
            NEW EMPLOYEE ONBOARDING
          </Typography>
        </Stack>
        <Typography component="h1" sx={{ fontSize: { xs: 27, md: 34 }, fontWeight: 900, lineHeight: 1.05 }}>
          <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.52em', mb: 0.45, letterSpacing: '-0.01em' }}>Welcome to</Box>
          Production Control
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14, fontWeight: 700 }}>
          KVH · Factory 2
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.25, maxWidth: 650, fontSize: 13, lineHeight: 1.65 }}>
          Trang giới thiệu giúp nhân viên mới hiểu vai trò của PC, luồng đơn hàng,
          hệ thống làm việc và những nội dung nghiệp vụ quan trọng trước khi bắt đầu công việc.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <AppButton appearance="action" icon={<ArrowDownwardRounded />} onClick={() => onNavigate('overview')}>
            Khám phá Production Control
          </AppButton>
          <AppButton icon={<RouteRounded />} onClick={() => onNavigate('roadmap')}>
            Xem nội dung đào tạo
          </AppButton>
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.75, flexWrap: 'wrap', gap: 0.75 }}>
          {['8 Modules', 'PC Onboarding', 'Factory 2'].map((label) => (
            <Chip key={label} label={label} size="small" />
          ))}
        </Stack>
        </Box>

        <Box sx={{ position: 'relative', minHeight: 250, display: { xs: 'none', md: 'grid' }, placeItems: 'center' }}>
          <Box sx={(theme) => ({ position: 'absolute', width: '72%', height: 1, bgcolor: alpha(theme.palette.primary.main, 0.2) })} />
          <Box sx={(theme) => ({ position: 'absolute', width: 1, height: '72%', bgcolor: alpha(theme.palette.info.main, 0.2) })} />
          <Box sx={(theme) => ({ position: 'absolute', width: '58%', height: 1, transform: 'rotate(38deg)', bgcolor: alpha(theme.palette.primary.main, 0.14) })} />
          <Box sx={(theme) => ({ position: 'absolute', width: '58%', height: 1, transform: 'rotate(-38deg)', bgcolor: alpha(theme.palette.info.main, 0.14) })} />
          <Box sx={(theme) => ({
            position: 'absolute', width: 220, height: 220, borderRadius: '50%',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
            boxShadow: `0 0 70px ${alpha(theme.palette.info.main, 0.17)}`,
          })} />
          <Box sx={(theme) => ({
            position: 'relative', width: 112, height: 112, display: 'grid', placeItems: 'center', textAlign: 'center',
            borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.14),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
            boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.2)}`,
          })}>
            <Box><HubRounded color="primary" /><Typography sx={{ fontSize: 10.5, fontWeight: 900 }}>PROCESS<br />CONTROL</Typography></Box>
          </Box>
          {[
            ['ORDER', '8%', '12%'], ['PRODUCTION', '72%', '9%'], ['DELIVERY', '73%', '76%'], ['SAP', '4%', '72%'],
            ['Manufa', '38%', '-2%'], ['Mr.ReFINE!', '0%', '42%'], ['Check Data', '67%', '43%'],
          ].map(([label, left, top]) => (
            <Box key={label} sx={(theme) => ({
              position: 'absolute', left, top, px: 1, py: 0.55, borderRadius: 1.5,
              fontSize: 9.5, fontWeight: 800, color: 'text.secondary', bgcolor: alpha(theme.palette.background.paper, 0.78),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, backdropFilter: 'blur(8px)',
            })}>{label}</Box>
          ))}
        </Box>
      </Box>
    </GlassPanel>
  )
}
