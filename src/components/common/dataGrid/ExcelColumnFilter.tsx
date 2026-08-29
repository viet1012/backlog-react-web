import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert, Box, CircularProgress, Divider, ListItemButton,
  ListItemText, Popover, Stack, TextField, Typography,
} from '@mui/material'
import { AppButton } from '../AppButton'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ExcelFilterContext,
  type ExcelFilterItem,
  type ExcelFilterKind,
  type ExcelFilterOptionsRequest,
  type ExcelFilterContextValue,
} from './excelFilterContext'
import {
  ExcelFilterConditionMenu,
  type FilterCondition,
} from './ExcelFilterConditionMenu'
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
  equals: 'Equals', doesNotEqual: 'Does Not Equal', startsWith: 'Begins With',
  endsWith: 'Ends With', contains: 'Contains', doesNotContain: 'Does Not Contain',
  isEmpty: 'Is Empty', isNotEmpty: 'Is Not Empty', '=': 'Equals',
  '!=': 'Does Not Equal', '>': 'Greater Than', '>=': 'Greater Than Or Equal',
  '<': 'Less Than', '<=': 'Less Than Or Equal', before: 'Before', after: 'After',
}

function requiresFilterValue(operator: string) {
  return operator !== 'isEmpty' && operator !== 'isNotEmpty'
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

  const kind = field ? getFilterKind(field) : 'text'

  useEffect(() => {
    if (!anchorEl || !field) return

    const controller = new AbortController()
    const otherColumnFilters = excelFilters.filter((filter) => filter.field !== field)

    void loadOptions({
      field,
      filters: otherColumnFilters,
      logicOperator: 'and',
      search: '',
      limit: 100,
    }, controller.signal)
      .then((values) => {
        const currentFilter = excelFilters.find((filter) => filter.field === field)
        const activeValues = currentFilter?.operator === 'isAnyOf'
          && Array.isArray(currentFilter.values)
          ? currentFilter.values
          : values
        setOptions(values)
        setSelected(new Set(activeValues))
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setOptions([])
          setSelected(new Set())
          setError(requestError instanceof Error
            ? requestError.message
            : 'Unable to load filter values')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [anchorEl, excelFilters, field, loadOptions])

  const visibleOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return query
      ? options.filter((value) => value.toLocaleLowerCase().includes(query))
      : options
  }, [options, search])

  const hasSearch = search.trim() !== ''
  const selectionScope = hasSearch ? visibleOptions : options
  const allSelected = selectionScope.length > 0
    && selectionScope.every((value) => selected.has(value))
  const someSelected = selectionScope.some((value) => selected.has(value))
    && !allSelected
  const hasActiveFilter = field
    ? excelFilters.some((filter) => filter.field === field)
    : false
  const conditionNeedsValue = requiresFilterValue(conditionOperator)
  const conditionCanApply = !conditionNeedsValue || conditionValue.trim() !== ''

  function closeFilter() {
    setAnchorEl(null)
    setConditionAnchor(null)
    setSearch('')
  }

  function replaceCurrentFieldFilter(nextFilter?: ExcelFilterItem) {
    if (!field) return
    const otherColumnFilters = excelFilters.filter((filter) => filter.field !== field)
    onExcelFiltersChange(nextFilter
      ? [...otherColumnFilters, nextFilter]
      : otherColumnFilters)
  }

  function clearFilter() {
    replaceCurrentFieldFilter()
    closeFilter()
  }

  function applyValueFilter() {
    if (!field) return
    const selectedValues = selectionScope.filter((value) => selected.has(value))
    replaceCurrentFieldFilter(!hasSearch && selectedValues.length === options.length
      ? undefined
      : { field, operator: 'isAnyOf', values: selectedValues })
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
    setView('condition')
  }

  function toggleSelectAll() {
    setSelected((current) => {
      if (!hasSearch) {
        return allSelected ? new Set() : new Set(options)
      }

      const next = new Set(current)
      selectionScope.forEach((value) => {
        if (allSelected) next.delete(value)
        else next.add(value)
      })
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
      setAnchorEl(nextAnchor)
    },
  }), [excelFilters, isFilterableField, onExcelFiltersChange])

  return (
    <ExcelFilterContext.Provider value={contextValue}>
      {children}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeFilter}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 310, maxHeight: 540, overflow: 'hidden' } } }}
      >
        <Typography sx={{ px: 1, pt: 1, pb: 0.5, fontWeight: 700 }}>{label}</Typography>

        {view === 'values' ? (
          <>
            <Box sx={{ px: 1, pb: 0.75 }}>
              <TextField
                autoFocus fullWidth size="small" placeholder="Search values..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                slotProps={{ input: { startAdornment: (
                  <SearchRoundedIcon sx={{ mr: 0.75, fontSize: 18, color: 'text.secondary' }} />
                ) } }}
              />
            </Box>
            <Divider />
            <ListItemButton
              onClick={(event) => setConditionAnchor(event.currentTarget)}
              sx={{ minHeight: 36, px: 1.25 }}
            >
              <ListItemText
                primary={`${kind === 'text' ? 'Text' : kind === 'number' ? 'Number' : 'Date'} Filters`}
                slotProps={{ primary: { sx: { fontSize: 12.5, fontWeight: 600 } } }}
              />
              <ChevronRightRoundedIcon fontSize="small" />
            </ListItemButton>
            <Divider />

            {loading ? (
              <Box sx={{ height: 245, display: 'grid', placeItems: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Box sx={{ p: 1 }}><Alert severity="error">{error}</Alert></Box>
            ) : (
              <ExcelFilterValueList
                values={visibleOptions}
                selected={selected}
                allSelected={allSelected}
                someSelected={someSelected}
                onToggleAll={toggleSelectAll}
                onToggleValue={toggleValue}
              />
            )}
          </>
        ) : (
          <Box sx={{ px: 1, py: 1 }}>
            <Stack
              direction="row"
              sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography sx={{ fontWeight: 700 }}>
                {conditionLabels[conditionOperator] ?? conditionOperator}
              </Typography>
              <AppButton compact onClick={() => setView('values')}>Value list</AppButton>
            </Stack>
            {conditionNeedsValue && (
              <TextField
                autoFocus fullWidth size="small"
                type={kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'}
                placeholder="Enter value..."
                value={conditionValue}
                onChange={(event) => setConditionValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && conditionCanApply) applyConditionFilter()
                }}
              />
            )}
          </Box>
        )}

        <Divider />
        <Stack direction="row" spacing={1} sx={{ px: 1, py: 1, justifyContent: 'flex-end' }}>
          <AppButton disabled={!hasActiveFilter} onClick={clearFilter}>Clear</AppButton>
          <AppButton onClick={closeFilter}>Cancel</AppButton>
          <AppButton
            appearance="action"
            disabled={view === 'values' ? loading || Boolean(error) : !conditionCanApply}
            onClick={view === 'values' ? applyValueFilter : applyConditionFilter}
          >
            OK
          </AppButton>
        </Stack>
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
