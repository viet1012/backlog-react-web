import ChevronRightRoundedIcon
  from '@mui/icons-material/ChevronRightRounded'

import SearchRoundedIcon
  from '@mui/icons-material/SearchRounded'

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

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  AppButton,
} from '../AppButton'

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

import {
  ExcelFilterValueList,
} from './ExcelFilterValueList'

import {
  ExcelDateTreeFilter,
} from './ExcelDateTreeFilter'


// =========================================================
// PROPS
// =========================================================

interface ExcelColumnFilterProviderProps {
  children: ReactNode

  excelFilters: ExcelFilterItem[]

  onExcelFiltersChange:
  (filters: ExcelFilterItem[]) => void

  isFilterableField:
  (field: string) => boolean

  getFilterKind:
  (field: string) => ExcelFilterKind

  loadOptions: (
    request: ExcelFilterOptionsRequest,
    signal?: AbortSignal,
  ) => Promise<string[]>
}


// =========================================================
// TYPES
// =========================================================

type FilterView =
  | 'values'
  | 'condition'


// =========================================================
// CONDITION LABELS
// =========================================================

const conditionLabels:
  Record<string, string> = {

  equals:
    'Equals',

  doesNotEqual:
    'Does Not Equal',

  startsWith:
    'Begins With',

  endsWith:
    'Ends With',

  contains:
    'Contains',

  doesNotContain:
    'Does Not Contain',

  isEmpty:
    'Is Empty',

  isNotEmpty:
    'Is Not Empty',

  '=':
    'Equals',

  '!=':
    'Does Not Equal',

  '>':
    'Greater Than',

  '>=':
    'Greater Than Or Equal',

  '<':
    'Less Than',

  '<=':
    'Less Than Or Equal',

  before:
    'Before',

  after:
    'After',

  onOrAfter:
    'On Or After',

  onOrBefore:
    'On Or Before',
}


// =========================================================
// HELPERS
// =========================================================

function requiresFilterValue(
  operator: string,
) {
  return operator !== 'isEmpty'
    && operator !== 'isNotEmpty'
}


// =========================================================
// PROVIDER
// =========================================================

export function ExcelColumnFilterProvider({
  children,

  excelFilters,
  onExcelFiltersChange,

  isFilterableField,
  getFilterKind,

  loadOptions,
}: ExcelColumnFilterProviderProps) {

  // =======================================================
  // POPUP STATE
  // =======================================================

  const [
    anchorEl,
    setAnchorEl,
  ] =
    useState<HTMLElement | null>(
      null,
    )

  const [
    conditionAnchor,
    setConditionAnchor,
  ] =
    useState<HTMLElement | null>(
      null,
    )


  // =======================================================
  // CURRENT COLUMN
  // =======================================================

  const [
    field,
    setField,
  ] =
    useState<string | null>(
      null,
    )

  const [
    label,
    setLabel,
  ] =
    useState('')


  // =======================================================
  // VALUE FILTER STATE
  // =======================================================

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    options,
    setOptions,
  ] =
    useState<string[]>([])

  const [
    selected,
    setSelected,
  ] =
    useState<Set<string>>(
      new Set(),
    )


  // =======================================================
  // VIEW
  // =======================================================

  const [
    view,
    setView,
  ] =
    useState<FilterView>(
      'values',
    )


  // =======================================================
  // CONDITION FILTER
  // =======================================================

  const [
    conditionOperator,
    setConditionOperator,
  ] =
    useState(
      'contains',
    )

  const [
    conditionValue,
    setConditionValue,
  ] =
    useState('')


  // =======================================================
  // REQUEST STATE
  // =======================================================

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )


  // =======================================================
  // FILTER KIND
  // =======================================================

  const kind:
    ExcelFilterKind =
    field
      ? getFilterKind(field)
      : 'text'


  const isDateFilter =
    kind === 'date'


  // =======================================================
  // LOAD OPTIONS
  // =======================================================

  useEffect(() => {

    if (
      !anchorEl
      || !field
    ) {
      return
    }


    const controller =
      new AbortController()


    // Không gửi filter của chính column đang mở.
    //
    // Ví dụ:
    //
    // Status = WIP
    // Div    = PR
    //
    // mở Status filter:
    // chỉ gửi Div sang option API.
    //
    const otherColumnFilters =
      excelFilters.filter(
        (filter) =>
          filter.field !== field,
      )


    setLoading(true)
    setError(null)


    void loadOptions(
      {
        field,

        filters:
          otherColumnFilters,

        logicOperator:
          'and',

        search:
          '',

        limit:
          500,
      },
      controller.signal,
    )

      .then((values) => {

        // ===============================================
        // NORMALIZE OPTIONS
        // ===============================================

        const normalizedValues =
          Array.from(
            new Set(
              values.map(
                (value) =>
                  value ?? '',
              ),
            ),
          )


        const currentFilter =
          excelFilters.find(
            (filter) =>
              filter.field === field,
          )


        // ===============================================
        // EXISTING EXCEL VALUE FILTER
        // ===============================================

        const activeValues =
          currentFilter?.operator
            === 'isAnyOf'
            && Array.isArray(
              currentFilter.values,
            )

            ? currentFilter.values

            // Không có filter:
            // mặc định Select All.
            : normalizedValues


        setOptions(
          normalizedValues,
        )


        setSelected(
          new Set(
            activeValues,
          ),
        )
      })

      .catch(
        (
          requestError:
            unknown,
        ) => {

          if (
            controller.signal.aborted
          ) {
            return
          }


          setOptions([])

          setSelected(
            new Set(),
          )


          setError(
            requestError
              instanceof Error

              ? requestError.message

              : 'Unable to load filter values',
          )
        },
      )

      .finally(() => {

        if (
          !controller.signal.aborted
        ) {
          setLoading(false)
        }
      })


    return () =>
      controller.abort()

  }, [
    anchorEl,
    excelFilters,
    field,
    loadOptions,
  ])


  // =======================================================
  // SEARCH
  // =======================================================

  const visibleOptions =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLocaleLowerCase()


        if (!query) {
          return options
        }


        return options.filter(
          (value) => {

            // =============================================
            // BLANK SEARCH
            // =============================================

            if (!value) {
              return (
                '(blanks)'
                  .includes(
                    query,
                  )
                || 'blank'
                  .includes(
                    query,
                  )
              )
            }


            return value
              .toLocaleLowerCase()
              .includes(
                query,
              )
          },
        )
      },
      [
        options,
        search,
      ],
    )


  const hasSearch =
    search.trim() !== ''


  // =======================================================
  // SELECT ALL SCOPE
  // =======================================================

  const selectionScope =
    hasSearch
      ? visibleOptions
      : options


  const allSelected =
    selectionScope.length > 0

    && selectionScope.every(
      (value) =>
        selected.has(
          value,
        ),
    )


  const someSelected =
    selectionScope.some(
      (value) =>
        selected.has(
          value,
        ),
    )

    && !allSelected


  // =======================================================
  // ACTIVE FILTER
  // =======================================================

  const hasActiveFilter =
    field
      ? excelFilters.some(
        (filter) =>
          filter.field === field,
      )
      : false


  // =======================================================
  // CONDITION STATE
  // =======================================================

  const conditionNeedsValue =
    requiresFilterValue(
      conditionOperator,
    )


  const conditionCanApply =
    !conditionNeedsValue

    || conditionValue
      .trim() !== ''


  // =======================================================
  // DATE OPTIONS
  // =======================================================

  const dateOptions =
    useMemo(
      () =>
        visibleOptions.filter(
          (value) =>
            /^\d{4}-\d{2}-\d{2}$/
              .test(value),
        ),
      [
        visibleOptions,
      ],
    )


  const hasBlankDateOption =
    isDateFilter
    && visibleOptions.includes('')


  // =======================================================
  // CLOSE
  // =======================================================

  function closeFilter() {

    setAnchorEl(null)

    setConditionAnchor(null)

    setSearch('')
  }


  // =======================================================
  // REPLACE CURRENT FIELD FILTER
  // =======================================================

  function replaceCurrentFieldFilter(
    nextFilter?:
      ExcelFilterItem,
  ) {

    if (!field) {
      return
    }


    const otherColumnFilters =
      excelFilters.filter(
        (filter) =>
          filter.field !== field,
      )


    onExcelFiltersChange(
      nextFilter

        ? [
          ...otherColumnFilters,
          nextFilter,
        ]

        : otherColumnFilters,
    )
  }


  // =======================================================
  // CLEAR
  // =======================================================

  function clearFilter() {

    replaceCurrentFieldFilter()

    closeFilter()
  }


  // =======================================================
  // APPLY VALUE FILTER
  // =======================================================

  function applyValueFilter() {

    if (!field) {
      return
    }


    /*
     * QUAN TRỌNG:
     *
     * Không dùng selectionScope ở đây.
     *
     * Nếu đang search:
     *
     * search = "2026"
     *
     * thì các value 2025 đang được chọn
     * vẫn phải được giữ.
     */

    const selectedValues =
      options.filter(
        (value) =>
          selected.has(
            value,
          ),
      )


    // =====================================================
    // SELECT ALL
    //
    // tất cả option được chọn
    // => không cần filter column này.
    // =====================================================

    if (
      selectedValues.length
      === options.length
    ) {

      replaceCurrentFieldFilter()

      closeFilter()

      return
    }


    // =====================================================
    // APPLY IS ANY OF
    // =====================================================

    replaceCurrentFieldFilter({
      field,

      operator:
        'isAnyOf',

      values:
        selectedValues,
    })


    closeFilter()
  }


  // =======================================================
  // APPLY CONDITION FILTER
  // =======================================================

  function applyConditionFilter() {

    if (
      !field
      || !conditionCanApply
    ) {
      return
    }


    replaceCurrentFieldFilter({
      field,

      operator:
        conditionOperator,

      ...(
        conditionNeedsValue
          ? {
            value:
              conditionValue
                .trim(),
          }
          : {}
      ),
    })


    closeFilter()
  }


  // =======================================================
  // SELECT CONDITION
  // =======================================================

  function selectCondition(
    condition:
      FilterCondition,
  ) {

    setConditionOperator(
      condition.operator,
    )


    if (
      !condition.requiresValue
    ) {
      setConditionValue('')
    }


    setConditionAnchor(
      null,
    )


    setView(
      'condition',
    )
  }


  // =======================================================
  // SELECT ALL
  // =======================================================

  function toggleSelectAll() {

    setSelected(
      (current) => {

        // ===============================================
        // NO SEARCH
        // ===============================================

        if (!hasSearch) {

          return allSelected
            ? new Set<string>()
            : new Set(
              options,
            )
        }


        // ===============================================
        // SEARCH ACTIVE
        //
        // chỉ toggle các option đang visible.
        // ===============================================

        const next =
          new Set(
            current,
          )


        for (
          const value
          of selectionScope
        ) {

          if (allSelected) {
            next.delete(
              value,
            )
          } else {
            next.add(
              value,
            )
          }
        }


        return next
      },
    )
  }


  // =======================================================
  // SINGLE VALUE
  // =======================================================

  function toggleValue(
    value: string,
  ) {

    setSelected(
      (current) => {

        const next =
          new Set(
            current,
          )


        if (
          next.has(value)
        ) {
          next.delete(value)
        } else {
          next.add(value)
        }


        return next
      },
    )
  }


  // =======================================================
  // DATE TREE CHANGE
  // =======================================================

  function handleDateTreeChange(
    values: string[],
  ) {

    /*
     * ExcelDateTreeFilter chỉ biết các date đang visible.
     *
     * Ta phải giữ selection:
     *
     * - ngoài search
     * - blank
     * - những date không nằm trong visible tree
     */

    setSelected(
      (current) => {

        const next =
          new Set(
            current,
          )


        // remove current visible date scope
        for (
          const value
          of dateOptions
        ) {
          next.delete(value)
        }


        // add new visible date selection
        for (
          const value
          of values
        ) {
          next.add(value)
        }


        return next
      },
    )
  }


  // =======================================================
  // CONTEXT
  // =======================================================

  const contextValue =
    useMemo<
      ExcelFilterContextValue
    >(
      () => ({

        excelFilters,

        onExcelFiltersChange,

        isFilterableField,


        openFilter: (
          nextField,
          nextLabel,
          nextAnchor,
        ) => {

          const activeFilter =
            excelFilters.find(
              (filter) =>
                filter.field
                === nextField,
            )


          const hasCondition =
            Boolean(
              activeFilter

              && activeFilter.operator
              !== 'isAnyOf',
            )


          setField(
            nextField,
          )


          setLabel(
            nextLabel,
          )


          setOptions([])


          setSelected(
            new Set(),
          )


          setSearch('')


          setView(
            hasCondition
              ? 'condition'
              : 'values',
          )


          setConditionOperator(
            hasCondition
              && activeFilter

              ? activeFilter.operator

              : 'contains',
          )


          setConditionValue(
            hasCondition

              ? activeFilter?.value
              ?? ''

              : '',
          )


          setLoading(true)

          setError(null)

          setConditionAnchor(null)

          setAnchorEl(
            nextAnchor,
          )
        },
      }),

      [
        excelFilters,
        isFilterableField,
        onExcelFiltersChange,
      ],
    )


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <ExcelFilterContext.Provider
      value={
        contextValue
      }
    >

      {children}


      {/* ===================================================
          EXCEL FILTER POPOVER
      =================================================== */}

      <Popover

        open={
          Boolean(
            anchorEl,
          )
        }

        anchorEl={
          anchorEl
        }

        onClose={
          closeFilter
        }

        anchorOrigin={{
          vertical:
            'bottom',

          horizontal:
            'left',
        }}

        slotProps={{
          paper: {
            sx: {
              width: 330,

              maxHeight: 580,

              overflow:
                'hidden',
            },
          },
        }}
      >

        {/* =================================================
            TITLE
        ================================================= */}

        <Typography
          sx={{
            px: 1.25,

            pt: 1,

            pb: 0.65,

            fontSize: 13,

            fontWeight: 800,
          }}
        >
          {label}
        </Typography>


        {/* =================================================
            VALUE VIEW
        ================================================= */}

        {view === 'values' ? (

          <>

            {/* ===============================================
                SEARCH
            =============================================== */}

            <Box
              sx={{
                px: 1,

                pb: 0.75,
              }}
            >

              <TextField
                autoFocus

                fullWidth

                size="small"

                placeholder={
                  isDateFilter
                    ? 'Search date...'
                    : 'Search values...'
                }

                value={
                  search
                }

                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }

                slotProps={{
                  input: {
                    startAdornment: (

                      <SearchRoundedIcon
                        sx={{
                          mr: 0.75,

                          fontSize: 18,

                          color:
                            'text.secondary',
                        }}
                      />

                    ),
                  },
                }}
              />

            </Box>


            <Divider />


            {/* ===============================================
                CONDITION FILTER MENU
            =============================================== */}

            <ListItemButton

              onClick={(
                event,
              ) =>
                setConditionAnchor(
                  event.currentTarget,
                )
              }

              sx={{
                minHeight: 36,

                px: 1.25,
              }}
            >

              <ListItemText

                primary={
                  `${kind === 'text'
                    ? 'Text'
                    : kind === 'number'
                      ? 'Number'
                      : 'Date'
                  } Filters`
                }

                slotProps={{
                  primary: {
                    sx: {
                      fontSize: 12.5,

                      fontWeight: 600,
                    },
                  },
                }}
              />


              <ChevronRightRoundedIcon
                fontSize="small"
              />

            </ListItemButton>


            <Divider />


            {/* ===============================================
                LOADING / ERROR / VALUES
            =============================================== */}

            {loading ? (

              <Box
                sx={{
                  height: 270,

                  display: 'grid',

                  placeItems:
                    'center',
                }}
              >

                <CircularProgress
                  size={24}
                />

              </Box>

            ) : error ? (

              <Box
                sx={{
                  p: 1,
                }}
              >

                <Alert
                  severity="error"
                >
                  {error}
                </Alert>

              </Box>

            ) : isDateFilter ? (

              // =================================================
              // DATE TREE
              // =================================================

              <Box
                sx={{
                  maxHeight: 310,

                  overflowY:
                    'auto',

                  py: 0.5,
                }}
              >

                {/* =============================================
                    SELECT ALL
                ============================================= */}

                <Stack
                  direction="row"

                  sx={{
                    minHeight: 32,

                    px: 0.75,

                    alignItems:
                      'center',
                  }}
                >

                  <Checkbox
                    size="small"

                    checked={
                      allSelected
                    }

                    indeterminate={
                      someSelected
                    }

                    onChange={
                      toggleSelectAll
                    }
                  />


                  <Typography
                    sx={{
                      fontSize: 12,

                      fontWeight: 700,
                    }}
                  >
                    (Select All)
                  </Typography>

                </Stack>


                {/* =============================================
                    BLANK
                ============================================= */}

                {hasBlankDateOption && (

                  <Stack
                    direction="row"

                    sx={{
                      minHeight: 30,

                      px: 0.75,

                      alignItems:
                        'center',
                    }}
                  >

                    <Checkbox
                      size="small"

                      checked={
                        selected.has('')
                      }

                      onChange={() =>
                        toggleValue('')
                      }
                    />


                    <Typography
                      sx={{
                        fontSize: 11.5,

                        fontStyle:
                          'italic',

                        color:
                          'text.secondary',
                      }}
                    >
                      (Blanks)
                    </Typography>

                  </Stack>

                )}


                {/* =============================================
                    YEAR → MONTH → DAY
                ============================================= */}

                <ExcelDateTreeFilter

                  options={
                    dateOptions
                  }

                  selectedValues={
                    dateOptions.filter(
                      (value) =>
                        selected.has(
                          value,
                        ),
                    )
                  }

                  onChange={
                    handleDateTreeChange
                  }

                />

              </Box>

            ) : (

              // =================================================
              // NORMAL TEXT / NUMBER VALUE LIST
              // =================================================

              <ExcelFilterValueList

                values={
                  visibleOptions
                }

                selected={
                  selected
                }

                allSelected={
                  allSelected
                }

                someSelected={
                  someSelected
                }

                onToggleAll={
                  toggleSelectAll
                }

                onToggleValue={
                  toggleValue
                }

              />

            )}

          </>

        ) : (

          // =====================================================
          // CONDITION VIEW
          // =====================================================

          <Box
            sx={{
              px: 1,

              py: 1,
            }}
          >

            <Stack
              direction="row"

              sx={{
                mb: 1,

                alignItems:
                  'center',

                justifyContent:
                  'space-between',
              }}
            >

              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                {
                  conditionLabels[
                  conditionOperator
                  ]
                  ?? conditionOperator
                }
              </Typography>


              <AppButton
                compact

                onClick={() =>
                  setView(
                    'values',
                  )
                }
              >
                Value list
              </AppButton>

            </Stack>


            {conditionNeedsValue && (

              <TextField
                autoFocus

                fullWidth

                size="small"

                type={
                  kind === 'number'
                    ? 'number'

                    : kind === 'date'
                      ? 'date'

                      : 'text'
                }

                placeholder={
                  'Enter value...'
                }

                value={
                  conditionValue
                }

                onChange={(
                  event,
                ) =>
                  setConditionValue(
                    event.target.value,
                  )
                }

                onKeyDown={(
                  event,
                ) => {

                  if (
                    event.key
                    === 'Enter'

                    && conditionCanApply
                  ) {

                    applyConditionFilter()
                  }
                }}
              />

            )}

          </Box>

        )}


        {/* =================================================
            FOOTER
        ================================================= */}

        <Divider />


        <Stack
          direction="row"

          spacing={1}

          sx={{
            px: 1,

            py: 1,

            justifyContent:
              'flex-end',
          }}
        >

          <AppButton

            disabled={
              !hasActiveFilter
            }

            onClick={
              clearFilter
            }
          >
            Clear
          </AppButton>


          <AppButton
            onClick={
              closeFilter
            }
          >
            Cancel
          </AppButton>


          <AppButton

            appearance="action"

            disabled={
              view === 'values'

                ? (
                  loading
                  || Boolean(
                    error,
                  )
                )

                : !conditionCanApply
            }

            onClick={
              view === 'values'
                ? applyValueFilter
                : applyConditionFilter
            }
          >
            OK
          </AppButton>

        </Stack>

      </Popover>


      {/* ===================================================
          CONDITION MENU
      =================================================== */}

      <ExcelFilterConditionMenu

        anchorEl={
          conditionAnchor
        }

        kind={
          kind
        }

        onClose={() =>
          setConditionAnchor(
            null,
          )
        }

        onSelect={
          selectCondition
        }

      />

    </ExcelFilterContext.Provider>
  )
}