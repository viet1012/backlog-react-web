import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ExcelFilterField } from '../../config/backlogFilterFields'
import {
  getBacklogFilterOptions,
  type BacklogFilterItem,
} from '../../services/reportService'
import {
  ExcelFilterContext,
  type ExcelFilterContextValue,
} from './excelFilterContext'

interface ExcelColumnFilterProviderProps {
  children: ReactNode
  excelFilters: BacklogFilterItem[]
  onExcelFiltersChange: (filters: BacklogFilterItem[]) => void
}

export function ExcelColumnFilterProvider({
  children,
  excelFilters,
  onExcelFiltersChange,
}: ExcelColumnFilterProviderProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [field, setField] = useState<ExcelFilterField | null>(null)
  const [label, setLabel] = useState('')
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!anchorEl || !field) return

    const controller = new AbortController()
    const otherColumnFilters = excelFilters.filter(
      (filter) => filter.field !== field,
    )

    void getBacklogFilterOptions(
      {
        field,
        filters: otherColumnFilters,
        logicOperator: 'and',
        limit: 100,
      },
      controller.signal,
    )
      .then((values) => {
        const currentFilter = excelFilters.find(
          (filter) => filter.field === field,
        )
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
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load filter values',
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [anchorEl, excelFilters, field])

  const visibleOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return query
      ? options.filter((value) => value.toLocaleLowerCase().includes(query))
      : options
  }, [options, search])

  const allVisibleSelected =
    visibleOptions.length > 0
    && visibleOptions.every((value) => selected.has(value))
  const someVisibleSelected =
    visibleOptions.some((value) => selected.has(value)) && !allVisibleSelected
  const hasActiveFilter = field
    ? excelFilters.some((filter) => filter.field === field)
    : false

  function closeFilter() {
    setAnchorEl(null)
    setSearch('')
  }

  function clearFilter() {
    if (!field) return
    onExcelFiltersChange(
      excelFilters.filter((filter) => filter.field !== field),
    )
    closeFilter()
  }

  function applyFilter() {
    if (!field) return

    const otherColumnFilters = excelFilters.filter(
      (filter) => filter.field !== field,
    )
    const selectedValues = options.filter((value) => selected.has(value))

    if (selectedValues.length === options.length) {
      onExcelFiltersChange(otherColumnFilters)
    } else {
      onExcelFiltersChange([
        ...otherColumnFilters,
        {
          field,
          operator: 'isAnyOf',
          values: selectedValues,
        },
      ])
    }

    closeFilter()
  }

  function toggleSelectAll() {
    setSelected((current) => {
      const next = new Set(current)
      visibleOptions.forEach((value) => {
        if (allVisibleSelected) next.delete(value)
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

  const contextValue = useMemo<ExcelFilterContextValue>(
    () => ({
      excelFilters,
      onExcelFiltersChange,
      openFilter: (nextField, nextLabel, nextAnchor) => {
        setField(nextField)
        setLabel(nextLabel)
        setOptions([])
        setSelected(new Set())
        setSearch('')
        setLoading(true)
        setError(null)
        setAnchorEl(nextAnchor)
      },
    }),
    [excelFilters, onExcelFiltersChange],
  )

  return (
    <ExcelFilterContext.Provider value={contextValue}>
      {children}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeFilter}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 310, maxHeight: 520, overflow: 'hidden' } } }}
      >
        <Box sx={{ px: 1, pt: 1 }}>
          <Typography sx={{ mb: 0.5, fontWeight: 700 }}>{label}</Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Search values..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchRoundedIcon sx={{ mr: 0.75, fontSize: 18, color: 'text.secondary' }} />
                ),
              },
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ height: 250, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 1 }}><Alert severity="error">{error}</Alert></Box>
        ) : (
          <Box sx={{ height: 250, overflowY: 'auto', px: 1, py: 0.5 }}>
            <FormControlLabel
              control={(
                <Checkbox
                  size="small"
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  onChange={toggleSelectAll}
                />
              )}
              label="(Select All)"
              sx={{ m: 0, width: '100%', '& .MuiFormControlLabel-label': { fontWeight: 700 } }}
            />
            {visibleOptions.map((value) => (
              <FormControlLabel
                key={value || '__blank__'}
                control={(
                  <Checkbox
                    size="small"
                    checked={selected.has(value)}
                    onChange={() => toggleValue(value)}
                  />
                )}
                label={value || '(Blank)'}
                sx={{ m: 0, width: '100%' }}
              />
            ))}
          </Box>
        )}

        <Divider />
        <Stack direction="row" spacing={1} sx={{ px: 1, py: 1, justifyContent: 'flex-end' }}>
          <Button disabled={!hasActiveFilter} onClick={clearFilter}>Clear</Button>
          <Button variant="outlined" onClick={closeFilter}>Cancel</Button>
          <Button
            variant="contained"
            disabled={loading || Boolean(error)}
            onClick={applyFilter}
          >
            OK
          </Button>
        </Stack>
      </Popover>
    </ExcelFilterContext.Provider>
  )
}
