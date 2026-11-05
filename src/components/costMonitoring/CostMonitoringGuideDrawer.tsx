import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useState, type ReactNode } from 'react'
import { CostGuideDiagram } from './CostGuideDiagram'
import { CostGuideExampleChart } from './CostGuideExampleChart'
import { CostGuideFormulas } from './CostGuideFormulas'
import { buildExampleDemo } from './costGuideDemo'
import { CostLineSwatch } from './CostLineSwatch'
import {
  BADGE_LEVELS,
  EXAMPLE_DATA,
  buildConclusion,
  GLOSSARY,
  GUIDE_TAB_IDS,
  QUICK_STEP_IDS,
  type GuideTabId,
} from './costMonitoringGuide'
import { useI18n } from '../../i18n/useI18n'

interface CostMonitoringGuideDrawerProps {
  open: boolean
  tab: GuideTabId
  onTabChange: (tab: GuideTabId) => void
  onClose: () => void
}

const BODY = { fontSize: 14, lineHeight: 1.6 }
const CIRCLED = ['①', '②', '③', '④', '⑤']

// Bỏ dấu tiếng Việt để tìm "chi phi" vẫn ra "chi phí"
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()


// =========================================================
// KHỐI DÙNG CHUNG
// =========================================================

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography sx={{ fontSize: 15, fontWeight: 800, mt: 1 }}>
      {children}
    </Typography>
  )
}

function Callout({ title, tone, children }: {
  title: string
  tone: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}) {
  const theme = useTheme()
  const color = theme.palette[tone].main

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        borderLeft: `4px solid ${color}`,
        bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.14 : 0.08),
      }}
    >
      <Typography sx={{ ...BODY, fontWeight: 800, mb: 0.5 }}>{title}</Typography>
      {children}
    </Box>
  )
}

function StatusChip({ level, text }: { level: 'ok' | 'watch' | 'over'; text: string }) {
  const theme = useTheme()
  const color = { ok: theme.palette.success.main, watch: theme.palette.warning.main, over: theme.palette.error.main }[level]

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        fontSize: 14,
        fontWeight: 800,
        color,
        bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.18 : 0.1),
        border: `1px solid ${alpha(color, 0.4)}`,
      }}
    >
      {text}
    </Box>
  )
}

const tableSx = {
  '& td, & th': { fontSize: 14, lineHeight: 1.5, verticalAlign: 'top', px: 1, py: 1 },
  '& th': { fontWeight: 800, color: 'text.secondary' },
}


// =========================================================
// TAB 1 – BẮT ĐẦU NHANH
// =========================================================

function QuickStartTab() {
  const { t } = useI18n()
  const quick = t.costGuide.quick

  return (
    <Stack spacing={2.5}>
      <Typography sx={BODY}>{quick.intro}</Typography>

      {QUICK_STEP_IDS.map((id, i) => (
        <Stack key={id} direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            {i + 1}
          </Box>

          <Box sx={{ pt: 0.25 }}>
            <Typography sx={{ ...BODY, fontSize: 15, fontWeight: 800 }}>{quick.steps[id].title}</Typography>
            <Typography sx={BODY} color="text.secondary">{quick.steps[id].body}</Typography>

            {id === 'badge' && (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {BADGE_LEVELS.map((level) => (
                  <StatusChip key={level} level={level} text={`${t.cost.status[level]} ${quick.badgeRanges[level]}`} />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      ))}
    </Stack>
  )
}


// =========================================================
// TAB 2 – CÁCH ĐỌC CHART
// =========================================================

function ReadChartTab() {
  const { t } = useI18n()
  const read = t.costGuide.read

  return (
    <Stack spacing={2}>
      <CostGuideDiagram />

      <Stack spacing={1.25}>
        {read.annotations.map((a, i) => (
          <Stack key={CIRCLED[i]} direction="row" spacing={1.25}>
            <Typography sx={{ fontSize: 20, lineHeight: 1.2, color: 'primary.main', fontWeight: 800 }}>
              {CIRCLED[i]}
            </Typography>
            <Typography sx={BODY}>
              <b>{a.title}.</b> {a.body}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Callout title={read.quickRead.title} tone="info">
        {read.quickRead.lines.map((line) => (
          <Typography key={line} sx={{ ...BODY, mb: 0.5 }}>{line}</Typography>
        ))}
      </Callout>

      <Callout title={read.note.title} tone="warning">
        <Typography sx={BODY}>{read.note.body}</Typography>
      </Callout>
    </Stack>
  )
}


// =========================================================
// TAB 3 – THUẬT NGỮ
// =========================================================

function GlossaryTab() {
  const { t } = useI18n()
  const glossary = t.costGuide.glossary

  const [query, setQuery] = useState('')
  const q = normalize(query.trim())

  const groups = GLOSSARY
    .map((g) => ({
      ...g,
      terms: g.terms
        .map((term) => ({
          ...term,
          ...glossary.terms[term.id],
          lineNote: term.line ? glossary.lineNotes[term.line] : undefined,
        }))
        .filter((term) => !q || normalize(`${term.term} ${term.meaning} ${term.lineNote ?? ''}`).includes(q)),
    }))
    .filter((g) => g.terms.length > 0)

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        placeholder={glossary.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        slotProps={{
          input: {
            sx: { fontSize: 14 },
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 19 }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {groups.length === 0 && (
        <Typography sx={BODY} color="text.secondary">{glossary.noResult}</Typography>
      )}

      {groups.map((g) => (
        <Box key={g.id}>
          <SectionTitle>{glossary.groups[g.id]}</SectionTitle>

          <Table size="small" sx={tableSx}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '30%' }}>{glossary.columns.term}</TableCell>
                <TableCell>{glossary.columns.meaning}</TableCell>
                {g.showLine && <TableCell sx={{ width: 90 }}>{glossary.columns.onChart}</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {g.terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{term.term}</TableCell>
                  <TableCell>{term.meaning}</TableCell>
                  {g.showLine && (
                    <TableCell title={term.lineNote} aria-label={term.lineNote}>
                      {term.line && (
                        <Box sx={{ pt: 0.75 }}>
                          <CostLineSwatch series={term.line} width={60} />
                        </Box>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ))}
    </Stack>
  )
}


// =========================================================
// TAB 4 – VÍ DỤ THỰC TẾ
// =========================================================

const CONCLUSION_TONE = { ok: 'success', watch: 'warning', over: 'error' } as const

// Ngày hôm nay trong tháng, giới hạn theo tháng ví dụ (30 ngày: ngày 31 → 30)
function todayInExample() {
  return Math.min(Math.max(new Date().getDate(), 1), EXAMPLE_DATA.daysInMonth)
}

// Drawer (Modal) unmount nội dung khi đóng → mở lại sẽ khởi tạo lại state = hôm nay
function ExampleTab() {
  const { t } = useI18n()
  const example = t.costGuide.example

  const [today] = useState(todayInExample)
  const [day, setDay] = useState(today)
  const demo = buildExampleDemo(day)

  return (
    <Stack spacing={2}>
      <SectionTitle>{example.storyTitle}</SectionTitle>

      <Table size="small" sx={tableSx}>
        <TableHead>
          <TableRow>
            <TableCell>{example.columns.what}</TableCell>
            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{example.columns.amount}</TableCell>
            <TableCell>{example.columns.term}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {example.steps.map((s) => (
            <TableRow key={s.term}>
              <TableCell>{s.text}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.amount}</TableCell>
              <TableCell sx={{ fontWeight: 800, color: 'primary.main', whiteSpace: 'nowrap' }}>{s.term}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SectionTitle>{example.demo.title}</SectionTitle>
      <CostGuideExampleChart
        day={day}
        today={today}
        onDayChange={setDay}
        chart={demo.chart}
        rows={demo.rows}
        values={demo.values}
      />

      {/* kết luận sinh theo badge của ngày đang chọn */}
      <Callout title={example.demo.conclusionTitle} tone={CONCLUSION_TONE[demo.values.level]}>
        <Typography sx={BODY}>{buildConclusion(t, demo.values)}</Typography>
      </Callout>

      <CostGuideFormulas values={demo.values} />

      <SectionTitle>{example.chartTitle}</SectionTitle>
      <Typography sx={BODY}>{example.chartBody}</Typography>
    </Stack>
  )
}


// =========================================================
// TAB 5 – FAQ
// =========================================================

function FaqTab() {
  const { t } = useI18n()

  return (
    <Box>
      {t.costGuide.faq.map((item) => (
        <Accordion key={item.q} disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&::before': { opacity: 1 } }}>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography sx={{ ...BODY, fontWeight: 700 }}>{item.q}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Typography sx={BODY} color="text.secondary">{item.a}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}


// =========================================================
// DRAWER
// =========================================================

const TAB_CONTENT: Record<GuideTabId, () => ReactNode> = {
  quick: QuickStartTab,
  read: ReadChartTab,
  glossary: GlossaryTab,
  example: ExampleTab,
  faq: FaqTab,
}

export function CostMonitoringGuideDrawer({ open, tab, onTabChange, onClose }: CostMonitoringGuideDrawerProps) {
  const { t } = useI18n()

  const Content = TAB_CONTENT[tab]

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: 'none',
          },
        },
      }}
    >
      {/* header + tabs cố định, chỉ phần nội dung cuộn */}
      <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" sx={{ alignItems: 'center', px: 2, pt: 1.5, pb: 0.5 }}>
          <Typography component="h2" sx={{ flex: 1, fontSize: 18, fontWeight: 800 }}>
            {t.costGuide.title}
          </Typography>

          <IconButton aria-label={t.common.close} onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, value: GuideTabId) => onTabChange(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, '& .MuiTab-root': { fontSize: 14, textTransform: 'none', fontWeight: 700, minHeight: 44 } }}
        >
          {GUIDE_TAB_IDS.map((id) => (
            <Tab key={id} value={id} label={t.costGuide.tabs[id]} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2.5, py: 2.5 }}>
        <Content />
      </Box>
    </Drawer>
  )
}
