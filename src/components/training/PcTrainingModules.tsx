import { ExpandMoreRounded, MenuBookRounded } from '@mui/icons-material'
import type { ReactNode } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { pcIssueTraining } from '../../data/training/pcIssueTraining'
import { pcTrainingModules } from '../../data/training/pcTrainingModules'
import { pcUploadOrderTraining } from '../../data/training/pcUploadOrderTraining'
import type { PcOrderMode, TrainingModule } from '../../types/pcTraining'
import { PcExportListDocumentation } from './PcExportListDocumentation'
import { PcStockReplacementDocumentation } from './PcStockReplacementDocumentation'
import { PcTrainingSection } from './PcTrainingSection'

interface CardProps {
  module: TrainingModule
}

const orderModeColumns: Array<{ mode: PcOrderMode; label: string }> = [
  { mode: 'mts-manual', label: 'MTS Manual' },
  { mode: 'mts-auto', label: 'MTS Auto' },
  { mode: 'mto-manual', label: 'MTO Manual' },
  { mode: 'mto-auto', label: 'MTO Auto' },
]

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ mb: 0.8, fontSize: 12, fontWeight: 900, color: 'text.secondary' }}>{title}</Typography>
      {children}
    </Box>
  )
}

function UploadOrderDocumentation() {
  const training = pcUploadOrderTraining

  return (
    <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
      <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Hướng dẫn Upload đơn hàng</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.6, fontSize: 12.5 }}>{training.overview}</Typography>

      <DetailBlock title="KHI NÀO THỰC HIỆN">
        {training.whenToUse.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </DetailBlock>

      <DetailBlock title="PHÂN LOẠI CUSTOMER — AUTO / MANUAL">
        <Typography color="text.secondary" sx={{ mb: 0.8, fontSize: 11.5 }}>Dấu ✓ là ô được đánh dấu trong bảng nguồn; dấu — là ô không có đánh dấu và không được suy diễn thêm.</Typography>
        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small" aria-label="Phân loại customer Auto và Manual">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Group</TableCell>
                {orderModeColumns.map(({ label }) => <TableCell key={label} align="center" sx={{ fontWeight: 900, whiteSpace: 'nowrap' }}>{label}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {training.customerClassification.map((customer) => (
                <TableRow key={customer.customerId}>
                  <TableCell sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{customer.customerId}</TableCell>
                  <TableCell>{customer.group}</TableCell>
                  {orderModeColumns.map(({ mode }) => (
                    <TableCell key={mode} align="center">{customer.modes.includes(mode) ? '✓' : '—'}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DetailBlock>

      <DetailBlock title="CHUẨN BỊ">
        {training.prerequisites.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
        <Typography sx={{ mt: 1.25, mb: 0.65, fontSize: 12, fontWeight: 850 }}>Danh sách format ({training.formats.length})</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 0.5 }}>
          {training.formats.map((format) => <Typography key={format} sx={{ fontSize: 11.5 }}>{format}</Typography>)}
        </Box>
        <Typography color="warning.main" sx={{ mt: 1.25, mb: 0.65, fontSize: 12, fontWeight: 850 }}>
          Format bắt buộc Convert Order Name To SPC Name ({training.nameConversionFormats.length})
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {training.nameConversionFormats.map((format) => <Chip key={format} label={format} size="small" color="warning" variant="outlined" />)}
        </Stack>
      </DetailBlock>

      <DetailBlock title="UPLOAD → PREVIEW / CHECK → FIX → FINAL VERIFICATION">
        <Stack spacing={1}>
          {training.workflow.map((step) => (
            <Box key={step.step} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                <Chip label={step.step} size="small" color="primary" />
                <Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>{step.title}</Typography>
                {step.system && <Chip label={step.system} size="small" variant="outlined" />}
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 0.6, fontSize: 12 }}>{step.description}</Typography>
              {step.actions.map((action) => <Typography key={action} sx={{ mt: 0.4, fontSize: 12 }}>• {action}</Typography>)}
              {step.checks?.map((check) => <Typography key={check} color="success.main" sx={{ mt: 0.4, fontSize: 11.5 }}>✓ {check}</Typography>)}
              {step.warnings?.map((warning) => <Typography key={warning} color="warning.main" sx={{ mt: 0.4, fontSize: 11.5 }}>⚠ {warning}</Typography>)}
            </Box>
          ))}
        </Stack>
      </DetailBlock>

      <DetailBlock title="TRẠNG THÁI KẾT QUẢ">
        {training.successStates.map((item) => <Typography key={item} color="success.main" sx={{ mt: 0.45, fontSize: 12 }}>✓ {item}</Typography>)}
        {training.warningStates.map((item) => <Typography key={item} color="warning.main" sx={{ mt: 0.45, fontSize: 12 }}>⚠ {item}</Typography>)}
        {training.errorStates.map((item) => <Typography key={item} color="error.main" sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </DetailBlock>

      <DetailBlock title="QUY TẮC QUAN TRỌNG">
        {training.importantRules.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </DetailBlock>
    </Box>
  )
}

function IssueDocumentation() {
  const training = pcIssueTraining

  return (
    <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
      <Typography sx={{ fontSize: 16, fontWeight: 900 }}>Ban hành đơn hàng sản xuất — Issue</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.6, fontSize: 12.5 }}>{training.overview}</Typography>

      <DetailBlock title="KHI NÀO THỰC HIỆN">
        {training.whenToUse.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </DetailBlock>

      <DetailBlock title="CHUẨN BỊ / INPUT">
        {training.prerequisites.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </DetailBlock>

      <DetailBlock title="QUY TRÌNH ISSUE">
        <Stack spacing={1}>
          {training.workflow.map((step) => (
            <Box key={step.step} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                <Chip label={step.step} size="small" color="primary" />
                <Typography sx={{ mr: 0.3, fontSize: 12.5, fontWeight: 900 }}>{step.title}</Typography>
                {step.worksheet && <Chip label={`Worksheet: ${step.worksheet}`} size="small" variant="outlined" />}
                {step.system && <Chip label={step.system} size="small" variant="outlined" />}
                {step.tool && <Chip label={step.tool} size="small" variant="outlined" />}
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
      </DetailBlock>

      <DetailBlock title="TRẠNG THÁI KẾT QUẢ">
        {training.successStates.map((item) => <Typography key={item} color="success.main" sx={{ mt: 0.45, fontSize: 12 }}>✓ {item}</Typography>)}
        {training.warningStates.map((item) => <Typography key={item} color="warning.main" sx={{ mt: 0.45, fontSize: 12 }}>⚠ {item}</Typography>)}
        {training.errorStates.map((item) => <Typography key={item} color="error.main" sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </DetailBlock>

      <DetailBlock title="QUY TẮC QUAN TRỌNG">
        {training.importantRules.map((item) => <Typography key={item} sx={{ mt: 0.45, fontSize: 12 }}>• {item}</Typography>)}
      </DetailBlock>
    </Box>
  )
}

function PcTrainingModuleCard({ module }: CardProps) {
  return (
    <Accordion
      disableGutters
      sx={(theme) => ({
        '&::before': { display: 'none' }, overflow: 'hidden',
        borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.72)}`,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': { transform: 'translateY(-1px)', boxShadow: theme.shadows[3] },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      })}
    >
      <AccordionSummary expandIcon={<ExpandMoreRounded />} aria-controls={`${module.id}-content`} id={`${module.id}-header`} sx={{ py: 0.5 }}>
        <Stack direction="row" spacing={1.25} sx={{ width: '100%', alignItems: 'center', minWidth: 0 }}>
          <Box sx={{ minWidth: 52 }}>
            <Typography color="primary.main" sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{module.number}</Typography>
            <Typography color="text.disabled" sx={{ mt: 0.35, fontSize: 8.5, fontWeight: 900, letterSpacing: '0.1em' }}>TOPIC</Typography>
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 850 }}>{module.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 11.5 }}>{module.summary}</Typography>
            <Stack direction="row" sx={{ mt: 0.65, flexWrap: 'wrap', gap: 0.4 }}>
              {module.systems.map((system) => <Chip key={system} label={system} size="small" variant="outlined" />)}
            </Stack>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 900, color: 'text.secondary' }}>MỤC TIÊU</Typography>
            {module.objectives.map((item) => <Typography key={item} sx={{ mt: 0.6, fontSize: 12 }}>• {item}</Typography>)}
            <Typography sx={{ mt: 1.25, fontSize: 11, fontWeight: 900, color: 'text.secondary' }}>CHỦ ĐỀ</Typography>
            <Stack direction="row" sx={{ mt: 0.7, flexWrap: 'wrap', gap: 0.5 }}>
              {module.topics.map((topic) => <Chip key={topic} label={topic} size="small" />)}
            </Stack>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 900, color: 'text.secondary' }}>LUỒNG TỔNG QUAN</Typography>
            {module.workflowSteps.map((step, index) => <Typography key={step} sx={{ mt: 0.6, fontSize: 12 }}>{index + 1}. {step}</Typography>)}
            {module.warnings.length > 0 && (
              <Box sx={{ mt: 1.1 }}>
                {module.warnings.map((warning) => <Typography key={warning} color="warning.main" sx={{ mt: 0.4, fontSize: 11.5 }}>⚠ {warning}</Typography>)}
              </Box>
            )}
          </Box>
        </Box>
        {module.id === 'upload-orders' && <UploadOrderDocumentation />}
        {module.id === 'issue-orders' && <IssueDocumentation />}
        {module.id === 'export-list' && <PcExportListDocumentation />}
        {module.id === 'stock-replacement' && <PcStockReplacementDocumentation />}
      </AccordionDetails>
    </Accordion>
  )
}

export function PcTrainingModules() {
  return (
    <PcTrainingSection id="modules" number="06" title="Explore 8 Topics" description="Khám phá tám chủ đề nền tảng dành cho nhân viên Production Control mới.">
      <Stack spacing={0.8}>
        {pcTrainingModules.map((module) => (
          <PcTrainingModuleCard key={module.id} module={module} />
        ))}
      </Stack>
      <Stack direction="row" spacing={0.6} sx={{ mt: 1, alignItems: 'center', color: 'text.disabled' }}>
        <MenuBookRounded sx={{ fontSize: 15 }} />
        <Typography sx={{ fontSize: 10.5 }}>Nội dung là tổng quan onboarding; thao tác chi tiết vẫn theo tài liệu và hướng dẫn tại nơi làm việc.</Typography>
      </Stack>
    </PcTrainingSection>
  )
}
