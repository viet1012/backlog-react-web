import { ArrowUpwardRounded, DescriptionRounded, MenuBookRounded, WarningAmberRounded } from '@mui/icons-material'
import { Alert, Box, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { pcTrainingResources } from '../../data/training/pcTrainingResources'
import { pcTrainingWarnings } from '../../data/training/pcTrainingWarnings'
import type { TrainingWarningSeverity } from '../../types/pcTraining'
import { AppButton } from '../common/AppButton'
import { GlassPanel } from '../common/GlassPanel'
import { PcTrainingSection } from './PcTrainingSection'

const alertSeverity: Record<TrainingWarningSeverity, 'info' | 'warning' | 'error'> = {
  note: 'info', warning: 'warning', critical: 'error',
}

export function PcWarningsSection() {
  return (
    <PcTrainingSection id="warnings" number="08" title="Những điều PC cần ghi nhớ" description="Các giới hạn và quy tắc quan trọng trong công việc Production Control.">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 0.8 }}>
        {pcTrainingWarnings.map((item) => (
          <Alert key={item.id} severity={alertSeverity[item.severity]} icon={<WarningAmberRounded />} sx={{ alignItems: 'flex-start' }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{item.title}</Typography>
            <Typography sx={{ mt: 0.3, fontSize: 11.5, lineHeight: 1.5 }}>{item.message}</Typography>
          </Alert>
        ))}
      </Box>
    </PcTrainingSection>
  )
}

export function PcResourcesSection() {
  return (
    <PcTrainingSection id="resources" number="09" title="Tài liệu & nguồn tham khảo" description="Danh mục nguồn được nhắc trong tài liệu; không có URL nội bộ hoặc download giả.">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 0.8 }}>
        {pcTrainingResources.map((resource) => (
          <GlassPanel key={resource.id} sx={{ p: 1.35 }}>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <DescriptionRounded color="primary" sx={{ fontSize: 18 }} />
              <Chip label={resource.status === 'reference' ? 'Reference' : 'Coming soon'} size="small" color={resource.status === 'reference' ? 'primary' : 'default'} variant="outlined" />
            </Stack>
            <Typography sx={{ mt: 0.8, fontSize: 12.5, fontWeight: 800 }}>{resource.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45, fontSize: 11.5, lineHeight: 1.5 }}>{resource.description}</Typography>
            <Typography color="text.disabled" sx={{ mt: 0.7, fontSize: 10 }}>{resource.category}</Typography>
          </GlassPanel>
        ))}
      </Box>
    </PcTrainingSection>
  )
}

interface CtaProps {
  onNavigate: (id: string) => void
}

export function PcTrainingFinalCta({ onNavigate }: CtaProps) {
  return (
    <PcTrainingSection id="final-cta" number="10" title="Ready to start?">
      <GlassPanel
        sx={(theme) => ({
          position: 'relative', overflow: 'hidden', p: { xs: 2.5, md: 4 }, textAlign: 'center',
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.info.main, 0.06)} 55%, transparent)`,
          '&::before': { content: '""', position: 'absolute', width: 240, height: 240, borderRadius: '50%', top: -150, right: -60, bgcolor: alpha(theme.palette.info.main, 0.1), filter: 'blur(8px)' },
        })}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography color="primary.main" sx={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.14em' }}>READY TO START?</Typography>
          <Typography sx={{ mt: 0.8, fontSize: { xs: 21, md: 28 }, fontWeight: 900 }}>Sẵn sàng bắt đầu với Production Control?</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 12.5 }}>Khám phá lại luồng tổng quan hoặc đi thẳng đến tám nội dung onboarding.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2, justifyContent: 'center' }}>
            <AppButton icon={<ArrowUpwardRounded />} onClick={() => onNavigate('introduction')}>Quay lại đầu trang</AppButton>
            <AppButton appearance="action" icon={<MenuBookRounded />} onClick={() => onNavigate('modules')}>Xem 8 nội dung</AppButton>
          </Stack>
          <Typography color="text.disabled" sx={{ mt: 2, fontSize: 10.5, letterSpacing: '0.08em' }}>KVH · FACTORY 2 · PRODUCTION CONTROL</Typography>
        </Box>
      </GlassPanel>
    </PcTrainingSection>
  )
}
