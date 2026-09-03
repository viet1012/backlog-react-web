import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppButton } from '../AppButton'
import {
  ExcelFilterContext,
  type ExcelFilterContextValue,
  type ExcelFilterItem,
  type ExcelFilterKind,
  type ExcelFilterOptionsRequest,
} from './excelFilterContext'
import { ExcelDateTreeFilter } from './ExcelDateTreeFilter'
import { ExcelFilterConditionMenu, type FilterCondition } from './ExcelFilterConditionMenu'
import { ExcelFilterValueList } from './ExcelFilterValueList'

interface ExcelColumnFilterProviderProps {
  children: ReactNode
  excelFilters: ExcelFilterItem[]
  onExcelFiltersChange: (filters: ExcelFilterItem[]) => void
  isFilterableField: (field: string) => boolean
  getFilterKind: (field: string) => ExcelFilterKind
  loadOptions: (
    request: ExcelFilterOptionsRequest,
    signal?: AbortSignal,
  ) => Promise<string[]>
}

type FilterView = 'values' | 'condition'

const conditionLabels: Record<string, string> = {
  equals: 'Equals',
  doesNotEqual: 'Does Not Equal',
  startsWith: 'Begins With',
  endsWith: 'Ends With',
  contains: 'Contains',
  doesNotContain: 'Does Not Contain',
  isEmpty: 'Is Empty',
  isNotEmpty: 'Is Not Empty',
  '=': 'Equals',
  '!=': 'Does Not Equal',
  '>': 'Greater Than',
  '>=': 'Greater Than Or Equal',
  '<': 'Less Than',
  '<=': 'Less Than Or Equal',
  before: 'Before',
  after: 'After',
  onOrAfter: 'On Or After',
  onOrBefore: 'On Or Before',
}

const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function requiresFilterValue(operator: string) {
  return operator !== 'isEmpty' && operator !== 'isNotEmpty'
}

function filterVisibleOptions(options: string[], search: string) {
  const query = search.trim().toLocaleLowerCase()
  if (!query) return options

  return options.filter((value) => {
    if (!value) return '(blanks)'.includes(query) || 'blank'.includes(query)
    return value.toLocaleLowerCase().includes(query)
  })
}

interface ValueFilterViewProps {
  kind: ExcelFilterKind
  search: string
  onSearchChange: (value: string) => void
  onOpenConditionMenu: (anchor: HTMLElement) => void
  loading: boolean
  error: string | null
  visibleOptions: string[]
  dateOptions: string[]
  selected: ReadonlySet<string>
  allSelected: boolean
  someSelected: boolean
  hasBlankDateOption: boolean
  onToggleAll: () => void
  onToggleValue: (value: string) => void
  onDateTreeChange: (values: string[]) => void
}

function SelectAllRow({ checked, indeterminate, onChange }: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  return (
    <Stack direction="row" sx={{ minHeight: 32, px: 0.75, alignItems: 'center' }}>
      <Checkbox size="small" checked={checked} indeterminate={indeterminate} onChange={onChange} />
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>(Select All)</Typography>
    </Stack>
  )
}

function ValueFilterView({
  kind,
  search,
  onSearchChange,
  onOpenConditionMenu,
  loading,
  error,
  visibleOptions,
  dateOptions,
  selected,
  allSelected,
  someSelected,
  hasBlankDateOption,
  onToggleAll,
  onToggleValue,
  onDateTreeChange,
}: ValueFilterViewProps) {
  const isDateFilter = kind === 'date'
  const filterKindLabel = kind === 'text' ? 'Text' : kind === 'number' ? 'Number' : 'Date'

  return (
    <>
      <Box sx={{ px: 1, pb: 0.75 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder={isDateFilter ? 'Search date...' : 'Search values...'}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <SearchRoundedIcon sx={{ mr: 0.75, fontSize: 18, color: 'text.secondary' }} />
              ),
            },
          }}
        />
      </Box>

      <Divider />
      <ListItemButton
        onClick={(event) => onOpenConditionMenu(event.currentTarget)}
        sx={{ minHeight: 36, px: 1.25 }}
      >
        <ListItemText
          primary={`${filterKindLabel} Filters`}
          slotProps={{ primary: { sx: { fontSize: 12.5, fontWeight: 600 } } }}
        />
        <ChevronRightRoundedIcon fontSize="small" />
      </ListItemButton>
      <Divider />

      {loading ? (
        <Box sx={{ height: 270, display: 'grid', placeItems: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 1 }}><Alert severity="error">{error}</Alert></Box>
      ) : isDateFilter ? (
        <Box sx={{ maxHeight: 310, overflowY: 'auto', py: 0.5 }}>
          <SelectAllRow checked={allSelected} indeterminate={someSelected} onChange={onToggleAll} />
          {hasBlankDateOption && (
            <Stack direction="row" sx={{ minHeight: 30, px: 0.75, alignItems: 'center' }}>
              <Checkbox size="small" checked={selected.has('')} onChange={() => onToggleValue('')} />
              <Typography sx={{ fontSize: 11.5, fontStyle: 'italic', color: 'text.secondary' }}>
                (Blanks)
              </Typography>
            </Stack>
          )}
          <ExcelDateTreeFilter
            options={dateOptions}
            selectedValues={dateOptions.filter((value) => selected.has(value))}
            onChange={onDateTreeChange}
          />
        </Box>
      ) : (
        <ExcelFilterValueList
          values={visibleOptions}
          selected={selected}
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleAll={onToggleAll}
          onToggleValue={onToggleValue}
        />
      )}
    </>
  )
}

interface ConditionFilterViewProps {
  kind: ExcelFilterKind
  operator: string
  value: string
  needsValue: boolean
  canApply: boolean
  onValueChange: (value: string) => void
  onApply: () => void
  onShowValues: () => void
}

function ConditionFilterView({
  kind,
  operator,
  value,
  needsValue,
  canApply,
  onValueChange,
  onApply,
  onShowValues,
}: ConditionFilterViewProps) {
  return (
    <Box sx={{ px: 1, py: 1 }}>
      <Stack direction="row" sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700 }}>{conditionLabels[operator] ?? operator}</Typography>
        <AppButton compact onClick={onShowValues}>Value list</AppButton>
      </Stack>
      {needsValue && (
        <TextField
          autoFocus
          fullWidth
          size="small"
          type={kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'}
          placeholder="Enter value..."
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canApply) onApply()
          }}
        />
      )}
    </Box>
  )
}

function FilterFooter({
  hasActiveFilter,
  canApply,
  onClear,
  onCancel,
  onApply,
}: {
  hasActiveFilter: boolean
  canApply: boolean
  onClear: () => void
  onCancel: () => void
  onApply: () => void
}) {
  return (
    <>
      <Divider />
      <Stack direction="row" spacing={1} sx={{ px: 1, py: 1, justifyContent: 'flex-end' }}>
        <AppButton disabled={!hasActiveFilter} onClick={onClear}>Clear</AppButton>
        <AppButton onClick={onCancel}>Cancel</AppButton>
        <AppButton appearance="action" disabled={!canApply} onClick={onApply}>OK</AppButton>
      </Stack>
    </>
  )
}

export function ExcelColumnFilterProvider({
  children,
  excelFilters,
  onExcelFiltersChange,
  isFilterableField,
  getFilterKind,
  loadOptions,
}: ExcelColumnFilterProviderProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [conditionAnchor, setConditionAnchor] = useState<HTMLElement | null>(null)
  const [field, setField] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [view, setView] = useState<FilterView>('values')
  const [conditionOperator, setConditionOperator] = useState('contains')
  const [conditionValue, setConditionValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const kind: ExcelFilterKind = field ? getFilterKind(field) : 'text'
  const isDateFilter = kind === 'date'

  useEffect(() => {
    if (!anchorEl || !field) return

    const controller = new AbortController()
    const otherColumnFilters = excelFilters.filter((filter) => filter.field !== field)

    // Reload state must reset when other active column filters change while this popover stays open.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    setError(null)

    void loadOptions({
      field,
      filters: otherColumnFilters,
      logicOperator: 'and',
      search: '',
      limit: 500,
    }, controller.signal)
      .then((values) => {
        const normalizedValues = Array.from(new Set(values.map((value) => value ?? '')))
        const currentFilter = excelFilters.find((filter) => filter.field === field)
        const activeValues = currentFilter?.operator === 'isAnyOf' && Array.isArray(currentFilter.values)
          ? currentFilter.values
          : normalizedValues

        setOptions(normalizedValues)
        setSelected(new Set(activeValues))
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        setOptions([])
        setSelected(new Set())
        setError(requestError instanceof Error ? requestError.message : 'Unable to load filter values')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [anchorEl, excelFilters, field, loadOptions])

  const visibleOptions = useMemo(
    () => filterVisibleOptions(options, search),
    [options, search],
  )
  const hasSearch = search.trim() !== ''
  const selectionScope = hasSearch ? visibleOptions : options
  const allSelected = selectionScope.length > 0
    && selectionScope.every((value) => selected.has(value))
  const someSelected = selectionScope.some((value) => selected.has(value)) && !allSelected
  const hasActiveFilter = field
    ? excelFilters.some((filter) => filter.field === field)
    : false
  const conditionNeedsValue = requiresFilterValue(conditionOperator)
  const conditionCanApply = !conditionNeedsValue || conditionValue.trim() !== ''
  const dateOptions = useMemo(
    () => visibleOptions.filter((value) => DATE_VALUE_PATTERN.test(value)),
    [visibleOptions],
  )
  const hasBlankDateOption = isDateFilter && visibleOptions.includes('')

  function closeFilter() {
    setAnchorEl(null)
    setConditionAnchor(null)
    setSearch('')
  }

  function replaceCurrentFieldFilter(nextFilter?: ExcelFilterItem) {
    if (!field) return
    const otherColumnFilters = excelFilters.filter((filter) => filter.field !== field)
    onExcelFiltersChange(nextFilter ? [...otherColumnFilters, nextFilter] : otherColumnFilters)
  }

  function clearFilter() {
    replaceCurrentFieldFilter()
    closeFilter()
  }

  function applyValueFilter() {
    if (!field) return
    const selectedValues = options.filter((value) => selected.has(value))

    if (selectedValues.length === options.length) {
      replaceCurrentFieldFilter()
      closeFilter()
      return
    }

    replaceCurrentFieldFilter({ field, operator: 'isAnyOf', values: selectedValues })
    closeFilter()
  }

  function applyConditionFilter() {
    if (!field || !conditionCanApply) return
    replaceCurrentFieldFilter({
      field,
      operator: conditionOperator,
      ...(conditionNeedsValue ? { value: conditionValue.trim() } : {}),
    })
    closeFilter()
  }

  function selectCondition(condition: FilterCondition) {
    setConditionOperator(condition.operator)
    if (!condition.requiresValue) setConditionValue('')
    setConditionAnchor(null)
    setView('condition')
  }

  function toggleSelectAll() {
    setSelected((current) => {
      if (!hasSearch) return allSelected ? new Set<string>() : new Set(options)

      const next = new Set(current)
      for (const value of selectionScope) {
        if (allSelected) next.delete(value)
        else next.add(value)
      }
      return next
    })
  }

  function toggleValue(value: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function handleDateTreeChange(values: string[]) {
    setSelected((current) => {
      const next = new Set(current)
      for (const value of dateOptions) next.delete(value)
      for (const value of values) next.add(value)
      return next
    })
  }

  const contextValue = useMemo<ExcelFilterContextValue>(() => ({
    excelFilters,
    onExcelFiltersChange,
    isFilterableField,
    openFilter: (nextField, nextLabel, nextAnchor) => {
      const activeFilter = excelFilters.find((filter) => filter.field === nextField)
      const hasCondition = Boolean(activeFilter && activeFilter.operator !== 'isAnyOf')

      setField(nextField)
      setLabel(nextLabel)
      setOptions([])
      setSelected(new Set())
      setSearch('')
      setView(hasCondition ? 'condition' : 'values')
      setConditionOperator(hasCondition && activeFilter ? activeFilter.operator : 'contains')
      setConditionValue(hasCondition ? activeFilter?.value ?? '' : '')
      setLoading(true)
      setError(null)
      setConditionAnchor(null)
      setAnchorEl(nextAnchor)
    },
  }), [excelFilters, isFilterableField, onExcelFiltersChange])

  const valueViewCanApply = !loading && !error
  const canApply = view === 'values' ? valueViewCanApply : conditionCanApply
  const applyCurrentView = view === 'values' ? applyValueFilter : applyConditionFilter

  return (
    <ExcelFilterContext.Provider value={contextValue}>
      {children}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeFilter}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 330, maxHeight: 580, overflow: 'hidden' } } }}
      >
        <Typography sx={{ px: 1.25, pt: 1, pb: 0.65, fontSize: 13, fontWeight: 800 }}>
          {label}
        </Typography>

        {view === 'values' ? (
          <ValueFilterView
            kind={kind}
            search={search}
            onSearchChange={setSearch}
            onOpenConditionMenu={setConditionAnchor}
            loading={loading}
            error={error}
            visibleOptions={visibleOptions}
            dateOptions={dateOptions}
            selected={selected}
            allSelected={allSelected}
            someSelected={someSelected}
            hasBlankDateOption={hasBlankDateOption}
            onToggleAll={toggleSelectAll}
            onToggleValue={toggleValue}
            onDateTreeChange={handleDateTreeChange}
          />
        ) : (
          <ConditionFilterView
            kind={kind}
            operator={conditionOperator}
            value={conditionValue}
            needsValue={conditionNeedsValue}
            canApply={conditionCanApply}
            onValueChange={setConditionValue}
            onApply={applyConditionFilter}
            onShowValues={() => setView('values')}
          />
        )}

        <FilterFooter
          hasActiveFilter={hasActiveFilter}
          canApply={canApply}
          onClear={clearFilter}
          onCancel={closeFilter}
          onApply={applyCurrentView}
        />
      </Popover>

      <ExcelFilterConditionMenu
        anchorEl={conditionAnchor}
        kind={kind}
        onClose={() => setConditionAnchor(null)}
        onSelect={selectCondition}
      />
    </ExcelFilterContext.Provider>
  )
}
