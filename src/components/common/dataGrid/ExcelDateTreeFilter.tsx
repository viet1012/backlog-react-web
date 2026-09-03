import { ChevronRightRounded, ExpandMoreRounded } from '@mui/icons-material'
import { Box, Checkbox, Collapse, IconButton, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

interface Props {
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}

interface DateDay {
  value: string
  day: number
}

interface DateMonth {
  key: string
  label: string
  days: DateDay[]
  values: string[]
}

interface DateYear {
  year: number
  months: DateMonth[]
  values: string[]
}

const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

function parseDateOption(raw: string) {
  const value = raw.trim()
  if (!DATE_VALUE_PATTERN.test(value)) return null

  const [yearText, monthText, dayText] = value.split('-')
  return {
    value,
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  }
}

function buildDateTree(options: string[]): DateYear[] {
  const years = new Map<number, Map<number, DateDay[]>>()

  for (const raw of options) {
    const date = parseDateOption(raw)
    if (!date) continue

    let months = years.get(date.year)
    if (!months) {
      months = new Map()
      years.set(date.year, months)
    }

    let days = months.get(date.month)
    if (!days) {
      days = []
      months.set(date.month, days)
    }
    days.push({ value: date.value, day: date.day })
  }

  return [...years.entries()]
    .sort(([left], [right]) => right - left)
    .map(([year, monthMap]) => {
      const months = [...monthMap.entries()]
        .sort(([left], [right]) => left - right)
        .map(([month, rawDays]) => {
          const days = [...rawDays].sort((left, right) => left.day - right.day)
          return {
            key: `${year}-${String(month).padStart(2, '0')}`,
            label: MONTH_NAMES[month - 1] ?? String(month),
            days,
            values: days.map((day) => day.value),
          }
        })

      return {
        year,
        months,
        values: months.flatMap((month) => month.values),
      }
    })
}

function getSelectionState(values: string[], selected: ReadonlySet<string>) {
  const selectedCount = values.reduce(
    (count, value) => count + Number(selected.has(value)),
    0,
  )
  return {
    checked: values.length > 0 && selectedCount === values.length,
    indeterminate: selectedCount > 0 && selectedCount < values.length,
  }
}

function toggleSetValue<T>(current: Set<T>, value: T) {
  const next = new Set(current)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

interface MonthNodeProps {
  month: DateMonth
  expanded: boolean
  selected: ReadonlySet<string>
  onToggleExpanded: () => void
  onToggleGroup: (values: string[], checked: boolean) => void
  onToggleDay: (value: string, checked: boolean) => void
}

function MonthNode({ month, expanded, selected, onToggleExpanded, onToggleGroup, onToggleDay }: MonthNodeProps) {
  const selection = getSelectionState(month.values, selected)

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', minHeight: 29 }}>
        <IconButton size="small" onClick={onToggleExpanded} sx={{ width: 26, height: 26 }}>
          {expanded
            ? <ExpandMoreRounded sx={{ fontSize: 17 }} />
            : <ChevronRightRounded sx={{ fontSize: 17 }} />}
        </IconButton>
        <Checkbox
          size="small"
          checked={selection.checked}
          indeterminate={selection.indeterminate}
          onChange={(event) => onToggleGroup(month.values, event.target.checked)}
        />
        <Typography sx={{ fontSize: 11.5, fontWeight: 700 }}>{month.label}</Typography>
      </Stack>
      <Collapse in={expanded}>
        <Box sx={{ pl: 5 }}>
          {month.days.map((day) => (
            <Stack key={day.value} direction="row" sx={{ alignItems: 'center', minHeight: 27 }}>
              <Checkbox
                size="small"
                checked={selected.has(day.value)}
                onChange={(event) => onToggleDay(day.value, event.target.checked)}
              />
              <Typography sx={{ fontSize: 11.5 }}>{String(day.day).padStart(2, '0')}</Typography>
            </Stack>
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}

interface YearNodeProps {
  item: DateYear
  expanded: boolean
  expandedMonths: ReadonlySet<string>
  selected: ReadonlySet<string>
  onToggleExpanded: () => void
  onToggleMonth: (key: string) => void
  onToggleGroup: (values: string[], checked: boolean) => void
  onToggleDay: (value: string, checked: boolean) => void
}

function YearNode({ item, expanded, expandedMonths, selected, onToggleExpanded, onToggleMonth, onToggleGroup, onToggleDay }: YearNodeProps) {
  const selection = getSelectionState(item.values, selected)

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', minHeight: 30 }}>
        <IconButton size="small" onClick={onToggleExpanded} sx={{ width: 26, height: 26 }}>
          {expanded
            ? <ExpandMoreRounded sx={{ fontSize: 18 }} />
            : <ChevronRightRounded sx={{ fontSize: 18 }} />}
        </IconButton>
        <Checkbox
          size="small"
          checked={selection.checked}
          indeterminate={selection.indeterminate}
          onChange={(event) => onToggleGroup(item.values, event.target.checked)}
        />
        <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{item.year}</Typography>
      </Stack>
      <Collapse in={expanded}>
        <Box sx={{ pl: 2.5 }}>
          {item.months.map((month) => (
            <MonthNode
              key={month.key}
              month={month}
              expanded={expandedMonths.has(month.key)}
              selected={selected}
              onToggleExpanded={() => onToggleMonth(month.key)}
              onToggleGroup={onToggleGroup}
              onToggleDay={onToggleDay}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}

export function ExcelDateTreeFilter({ options, selectedValues, onChange }: Props) {
  const tree = useMemo(() => buildDateTree(options), [options])
  const selected = useMemo(() => new Set(selectedValues), [selectedValues])
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set(tree.map((item) => item.year)),
  )
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set())

  function applySelection(values: string[], checked: boolean) {
    const next = new Set(selected)
    for (const value of values) {
      if (checked) next.add(value)
      else next.delete(value)
    }
    onChange([...next])
  }

  return (
    <Stack spacing={0.25} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
      {tree.map((item) => (
        <YearNode
          key={item.year}
          item={item}
          expanded={expandedYears.has(item.year)}
          expandedMonths={expandedMonths}
          selected={selected}
          onToggleExpanded={() => setExpandedYears((current) => toggleSetValue(current, item.year))}
          onToggleMonth={(key) => setExpandedMonths((current) => toggleSetValue(current, key))}
          onToggleGroup={applySelection}
          onToggleDay={(value, checked) => applySelection([value], checked)}
        />
      ))}
    </Stack>
  )
}
