import { BuildRounded, DatasetRounded, ExpandMoreRounded, StorageRounded } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography } from '@mui/material'
import { pcCheckDataDatasets } from '../../data/training/pcCheckDataReference'
import { pcTrainingSystems } from '../../data/training/pcTrainingSystems'
import { pcTrainingTools } from '../../data/training/pcTrainingTools'
import { GlassPanel } from '../common/GlassPanel'
import { PcTrainingSection } from './PcTrainingSection'

function DetailList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null
  return (
    <Box>
      <Typography color="text.disabled" sx={{ fontSize: 9.5, fontWeight: 900, letterSpacing: '0.08em' }}>{title}</Typography>
      {items.map((item) => <Typography key={item} color="text.secondary" sx={{ mt: 0.4, fontSize: 11.5, lineHeight: 1.45 }}>• {item}</Typography>)}
    </Box>
  )
}

export function PcSystemsSection() {
  return (
    <PcTrainingSection id="systems" number="04" title="Systems & Tools" description="Hệ thống, chức năng và công cụ Production Control sử dụng trong công việc.">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 1 }}>
        {pcTrainingSystems.map((system) => (
          <GlassPanel key={system.id} sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <StorageRounded color="primary" sx={{ fontSize: 19 }} />
              <Box><Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>{system.name}</Typography><Typography color="text.disabled" sx={{ fontSize: 10.5 }}>{system.category}</Typography></Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1, fontSize: 12, lineHeight: 1.5 }}>{system.purpose}</Typography>
            <Stack direction="row" sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>{system.uses.map((use) => <Chip key={use} label={use} size="small" variant="outlined" />)}</Stack>
            {system.functions.length > 0 && (
              <Accordion disableGutters elevation={0} sx={{ mt: 1, bgcolor: 'transparent', '&::before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ minHeight: 34, px: 0 }}><Typography sx={{ fontSize: 11.5, fontWeight: 800 }}>{system.functions.length} chức năng quan trọng</Typography></AccordionSummary>
                <AccordionDetails sx={{ px: 0, pb: 0 }}>
                  <Stack spacing={0.75}>
                    {system.functions.map((fn) => (
                      <Box key={fn.id} sx={{ p: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 800 }}>{fn.name}</Typography>
                        {fn.purpose && <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 11 }}>{fn.purpose}</Typography>}
                        <Box sx={{ mt: 0.65, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 0.75 }}><DetailList title="INPUT" items={fn.inputs} /><DetailList title="OUTPUT" items={fn.outputs} /></Box>
                        <DetailList title="LƯU Ý" items={fn.warnings} />
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
          </GlassPanel>
        ))}
      </Box>

      <Typography component="h3" sx={{ mt: 2, mb: 0.8, fontSize: 15, fontWeight: 850 }}>PC Tools</Typography>
      <Stack spacing={0.65}>
        {pcTrainingTools.map((tool) => (
          <Accordion key={tool.id} disableGutters sx={{ '&::before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreRounded />}><Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}><BuildRounded color="primary" sx={{ fontSize: 18 }} /><Box><Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{tool.name}</Typography><Typography color="text.secondary" sx={{ fontSize: 11 }}>{tool.purpose}</Typography></Box></Stack></AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.2 }}>
                <DetailList title="KHI SỬ DỤNG" items={tool.whenToUse} /><DetailList title="INPUT" items={tool.inputs} />
                <DetailList title="OUTPUT" items={tool.outputs} /><DetailList title="QUY TẮC QUAN TRỌNG" items={tool.rules} />
              </Box>
              <Stack direction="row" sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                {tool.successState && <Chip color="success" size="small" label={tool.successState} />}
                {tool.warningState && <Chip color="warning" size="small" label={tool.warningState} />}
                {tool.errorState && <Chip color="error" size="small" label={tool.errorState} />}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      <Typography component="h3" sx={{ mt: 2, mb: 0.8, fontSize: 15, fontWeight: 850 }}>Check Data Reference · 23 datasets</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 0.65 }}>
        {pcCheckDataDatasets.map((dataset) => (
          <Accordion key={dataset.id} disableGutters sx={{ '&::before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreRounded />}>
              <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', minWidth: 0 }}><DatasetRounded color="primary" sx={{ fontSize: 17 }} /><Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 12, fontWeight: 850 }}>{dataset.name}</Typography><Typography color="text.secondary" sx={{ fontSize: 10.5 }}>{dataset.purpose}</Typography></Box><Chip label={dataset.category} size="small" variant="outlined" sx={{ ml: 'auto' }} /></Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}><DetailList title="INPUT" items={dataset.inputs} /><DetailList title="OUTPUT" items={dataset.outputs} /></Box>
              {dataset.fields.length > 0 && <Box sx={{ mt: 1 }}><Typography color="text.disabled" sx={{ mb: 0.5, fontSize: 9.5, fontWeight: 900 }}>IMPORTANT FIELDS</Typography>{dataset.fields.map((field) => <Box key={field.name} sx={{ py: 0.55, borderTop: '1px solid', borderColor: 'divider' }}><Typography component="span" sx={{ fontSize: 11.5, fontWeight: 800 }}>{field.name}: </Typography><Typography component="span" color="text.secondary" sx={{ fontSize: 11.5 }}>{field.meaning}{field.note ? ` ${field.note}` : ''}</Typography></Box>)}</Box>}
              {dataset.fields.length === 0 && <Typography color="text.disabled" sx={{ mt: 0.5, fontSize: 10.5 }}>Chưa có định nghĩa field chi tiết trong tài liệu web.</Typography>}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </PcTrainingSection>
  )
}
