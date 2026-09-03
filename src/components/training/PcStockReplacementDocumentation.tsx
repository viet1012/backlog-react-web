import { Box, Chip, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { pcStockReplacementTraining } from '../../data/training/pcStockReplacementTraining'
import type { PcStockReplacementWorkflow } from '../../types/pcTraining'

type WorkflowId = PcStockReplacementWorkflow['id']

export function PcStockReplacementDocumentation() {
  const training = pcStockReplacementTraining
  const [selectedId, setSelectedId] = useState<WorkflowId>('split-order')
  const workflow = training.workflows.find((item) => item.id === selectedId) ?? training.workflows[0]

  return (
    <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
      <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Tách, bù đơn hàng và xử lý kho</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.6, fontSize: 12.5 }}>{training.overview}</Typography>

      <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.6 }} aria-label="Chọn workflow xử lý kho">
        {training.workflows.map((item) => (
          <Chip
            key={item.id}
            label={item.title}
            color={item.id === selectedId ? 'primary' : 'default'}
            variant={item.id === selectedId ? 'filled' : 'outlined'}
            onClick={() => setSelectedId(item.id)}
          />
        ))}
      </Stack>

      <Box sx={{ mt: 1.5, p: { xs: 1.25, md: 1.5 }, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{workflow.title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 12 }}>{workflow.overview}</Typography>

        <Typography sx={{ mt: 1.4, fontSize: 11, fontWeight: 900, color: 'text.secondary' }}>KHI NÀO THỰC HIỆN</Typography>
        {workflow.whenToUse.map((item) => <Typography key={item} sx={{ mt: 0.4, fontSize: 12 }}>• {item}</Typography>)}

        <Typography sx={{ mt: 1.4, fontSize: 11, fontWeight: 900, color: 'text.secondary' }}>CHUẨN BỊ / INPUT</Typography>
        {workflow.prerequisites.map((item) => <Typography key={item} sx={{ mt: 0.4, fontSize: 12 }}>• {item}</Typography>)}

        <Stack direction="row" sx={{ mt: 1.2, flexWrap: 'wrap', gap: 0.5 }}>
          {workflow.systems.map((system) => <Chip key={system} label={system} size="small" color="info" variant="outlined" />)}
          {workflow.tools.map((tool) => <Chip key={tool} label={tool} size="small" variant="outlined" />)}
        </Stack>

        <Typography sx={{ mt: 1.6, mb: 0.8, fontSize: 11, fontWeight: 900, color: 'text.secondary' }}>CÁC BƯỚC</Typography>
        <Stack spacing={1}>
          {workflow.steps.map((step) => (
            <Box key={step.step} sx={{ p: 1.15, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                <Chip label={step.step} size="small" color="primary" />
                <Typography sx={{ mr: 0.3, fontSize: 12.5, fontWeight: 900 }}>{step.title}</Typography>
                {step.worksheet && <Chip label={`Worksheet: ${step.worksheet}`} size="small" variant="outlined" />}
                {step.system && <Chip label={step.system} size="small" variant="outlined" />}
                {step.tool && <Chip label={step.tool} size="small" variant="outlined" />}
              </Stack>
              {step.inputs && <Typography sx={{ mt: 0.6, fontSize: 11.5 }}><Box component="span" sx={{ fontWeight: 900 }}>Input: </Box>{step.inputs.join(' · ')}</Typography>}
              {step.actions.map((action) => <Typography key={action} sx={{ mt: 0.4, fontSize: 12 }}>• {action}</Typography>)}
              {step.checks && <Typography color="success.main" sx={{ mt: 0.6, fontSize: 11.5 }}><Box component="span" sx={{ fontWeight: 900 }}>Kiểm tra: </Box>{step.checks.join(' · ')}</Typography>}
              {step.expectedResult && <Typography color="success.main" sx={{ mt: 0.4, fontSize: 11.5 }}>✓ {step.expectedResult}</Typography>}
              {step.warnings?.map((warning) => <Typography key={warning} color="warning.main" sx={{ mt: 0.4, fontSize: 11.5 }}>⚠ {warning}</Typography>)}
            </Box>
          ))}
        </Stack>

        <Typography sx={{ mt: 1.5, fontSize: 11, fontWeight: 900, color: 'text.secondary' }}>QUY TẮC CỦA WORKFLOW</Typography>
        {workflow.importantRules.map((item) => <Typography key={item} sx={{ mt: 0.4, fontSize: 12 }}>• {item}</Typography>)}
      </Box>

      <Typography sx={{ mt: 2, fontSize: 12, fontWeight: 900, color: 'text.secondary' }}>PROCESS / BOM REFERENCE</Typography>
      {training.processBomRules.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}

      <Typography sx={{ mt: 2, fontSize: 12, fontWeight: 900, color: 'text.secondary' }}>WARNINGS / ERRORS</Typography>
      {training.warningStates.map((item) => <Typography key={item} color="warning.main" sx={{ mt: 0.45, fontSize: 12 }}>⚠ {item}</Typography>)}
      {training.errorStates.map((item) => <Typography key={item} color="error.main" sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
    </Box>
  )
}
