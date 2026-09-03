import { Box, Chip, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { pcExportListTraining } from '../../data/training/pcExportListTraining'

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ mb: 0.8, fontSize: 12, fontWeight: 900, color: 'text.secondary' }}>{title}</Typography>
      {children}
    </Box>
  )
}

export function PcExportListDocumentation() {
  const training = pcExportListTraining

  return (
    <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
      <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Export List / Packing List</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.6, fontSize: 12.5 }}>{training.overview}</Typography>

      <SectionBlock title="KHÁI NIỆM VÀ MỐI QUAN HỆ">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1 }}>
          {Object.values(training.concepts).map((concept) => (
            <Box key={concept.title} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>{concept.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 12 }}>{concept.definition}</Typography>
              {concept.relationship && <Typography color="primary.main" sx={{ mt: 0.6, fontSize: 11.5 }}>{concept.relationship}</Typography>}
            </Box>
          ))}
        </Box>
      </SectionBlock>

      <SectionBlock title="THỜI ĐIỂM THỰC HIỆN">
        {training.whenToUse.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </SectionBlock>

      <SectionBlock title="CHUẨN BỊ / INPUT">
        {training.prerequisites.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </SectionBlock>

      <SectionBlock title="QUY TRÌNH EXPORT LIST → PACKING LIST">
        <Stack spacing={1}>
          {training.workflow.map((step) => (
            <Box key={step.step} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                <Chip label={step.step} size="small" color="primary" />
                <Typography sx={{ mr: 0.3, fontSize: 12.5, fontWeight: 900 }}>{step.title}</Typography>
                {step.system && <Chip label={step.system} size="small" variant="outlined" />}
                {step.tool && <Chip label={step.tool} size="small" variant="outlined" />}
                {step.timing && <Chip label={step.timing} size="small" color="info" variant="outlined" />}
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 0.6, fontSize: 12 }}>{step.purpose}</Typography>
              {step.inputs && (
                <Typography sx={{ mt: 0.6, fontSize: 11.5 }}>
                  <Box component="span" sx={{ fontWeight: 900 }}>Input: </Box>{step.inputs.join(' · ')}
                </Typography>
              )}
              {step.actions.map((action) => <Typography key={action} sx={{ mt: 0.4, fontSize: 12 }}>• {action}</Typography>)}
              {step.checks && (
                <Typography color="success.main" sx={{ mt: 0.6, fontSize: 11.5 }}>
                  <Box component="span" sx={{ fontWeight: 900 }}>Kiểm tra: </Box>{step.checks.join(' · ')}
                </Typography>
              )}
              {step.expectedResult && <Typography color="success.main" sx={{ mt: 0.4, fontSize: 11.5 }}>✓ {step.expectedResult}</Typography>}
              {step.warnings?.map((warning) => <Typography key={warning} color="warning.main" sx={{ mt: 0.4, fontSize: 11.5 }}>⚠ {warning}</Typography>)}
            </Box>
          ))}
        </Stack>
      </SectionBlock>

      <SectionBlock title="DELIVERY TERMS">
        <Stack spacing={0.7}>
          {training.deliveryTerms.map((term) => (
            <Box key={term.value} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{term.value}</Typography>
              <Typography sx={{ mt: 0.35, fontSize: 11.5 }}>{term.meaning}</Typography>
              {term.action && <Typography color="primary.main" sx={{ mt: 0.35, fontSize: 11.5 }}>Action: {term.action}</Typography>}
              {term.warning && <Typography color="warning.main" sx={{ mt: 0.35, fontSize: 11.5 }}>⚠ {term.warning}</Typography>}
            </Box>
          ))}
        </Stack>
      </SectionBlock>

      <SectionBlock title="CO / RVC / FTA">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 0.7 }}>
          {training.coRvcRules.map((rule) => (
            <Box key={rule.value} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{rule.value}</Typography>
              <Typography sx={{ mt: 0.35, fontSize: 11.5 }}>{rule.meaning}</Typography>
              {rule.action && <Typography color="primary.main" sx={{ mt: 0.35, fontSize: 11.5 }}>Action: {rule.action}</Typography>}
            </Box>
          ))}
        </Box>
      </SectionBlock>

      <SectionBlock title="JUDGE REFERENCE">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 0.7 }}>
          {training.judgeDefinitions.map((judge) => (
            <Box key={judge.value} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{judge.value}</Typography>
              <Typography sx={{ mt: 0.35, fontSize: 11.5 }}>{judge.meaning}</Typography>
              {judge.warning && <Typography color="warning.main" sx={{ mt: 0.35, fontSize: 11.5 }}>⚠ {judge.warning}</Typography>}
            </Box>
          ))}
        </Box>
      </SectionBlock>

      <SectionBlock title="TRẠNG THÁI KẾT QUẢ">
        {training.successStates.map((item) => <Typography key={item} color="success.main" sx={{ mt: 0.45, fontSize: 12 }}>✓ {item}</Typography>)}
        {training.warningStates.map((item) => <Typography key={item} color="warning.main" sx={{ mt: 0.45, fontSize: 12 }}>⚠ {item}</Typography>)}
        {training.errorStates.map((item) => <Typography key={item} color="error.main" sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </SectionBlock>

      <SectionBlock title="QUY TẮC QUAN TRỌNG">
        {training.importantRules.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </SectionBlock>
    </Box>
  )
}
