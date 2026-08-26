import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import ArrowUpwardRoundedIcon
  from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRoundedIcon
  from '@mui/icons-material/ArrowDownwardRounded'
import FilterAltOffRoundedIcon
  from '@mui/icons-material/FilterAltOffRounded'
import SearchRoundedIcon
  from '@mui/icons-material/SearchRounded'
import ChevronRightRoundedIcon
  from '@mui/icons-material/ChevronRightRounded'

import type { GridFilterModel } from '@mui/x-data-grid'

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { getBacklogFilterOptions }
  from '../../services/reportService'

import type { ExcelFilterField }
  from '../../config/backlogFilterFields'

import {
  ExcelFilterContext,
  type ExcelFilterContextValue,
} from './excelFilterContext'


interface ExcelColumnFilterProviderProps {
  children: ReactNode

  filterModel: GridFilterModel

  onFilterChange: (
    model: GridFilterModel
  ) => void

  onSortChange?: (
    field: string,
    direction: 'asc' | 'desc'
  ) => void
}


export function ExcelColumnFilterProvider({
  children,
  filterModel,
  onFilterChange,
  onSortChange,
}: ExcelColumnFilterProviderProps) {

  const [anchorEl, setAnchorEl] =
    useState<HTMLElement | null>(null)

  const [field, setField] =
    useState<ExcelFilterField | null>(null)

  const [label, setLabel] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [options, setOptions] =
    useState<string[]>([])

  const [selected, setSelected] =
    useState<Set<string>>(
      new Set()
    )

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)


  // =========================================================
  // LOAD DISTINCT VALUES
  // =========================================================

  useEffect(() => {

    if (!anchorEl || !field) {
      return
    }

    const controller =
      new AbortController()

    setLoading(true)
    setError(null)

    void getBacklogFilterOptions(
      field,
      controller.signal,
    )
      .then((values) => {

        const activeItem =
          filterModel.items.find(
            (item) =>
              item.field === field
              && item.operator === 'isAnyOf'
          )

        const activeValues =
          Array.isArray(activeItem?.value)
            ? activeItem.value.map(String)
            : values

        setOptions(values)

        setSelected(
          new Set(activeValues)
        )
      })

      .catch((requestError: unknown) => {

        if (
          controller.signal.aborted
        ) {
          return
        }

        setOptions([])

        setSelected(
          new Set()
        )

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load filter values'
        )
      })

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
    field,
    filterModel.items,
  ])


  // =========================================================
  // SEARCH
  // =========================================================

  const visibleOptions =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase()

      if (!query) {
        return options
      }

      return options.filter(
        (value) =>
          value
            .toLocaleLowerCase()
            .includes(query)
      )

    }, [
      options,
      search,
    ])


  // =========================================================
  // CHECKBOX STATE
  // =========================================================

  const allVisibleSelected =
    visibleOptions.length > 0
    && visibleOptions.every(
      (value) =>
        selected.has(value)
    )

  const someVisibleSelected =
    visibleOptions.some(
      (value) =>
        selected.has(value)
    )
    && !allVisibleSelected


  // =========================================================
  // ACTIVE FILTER
  // =========================================================

  const hasActiveFilter =
    field
      ? filterModel.items.some(
        (item) =>
          item.field === field
      )
      : false


  // =========================================================
  // CLOSE
  // =========================================================

  function closeFilter() {
    setAnchorEl(null)
    setSearch('')
  }


  // =========================================================
  // CLEAR
  // =========================================================

  function removeFieldFilter() {

    if (!field) {
      return
    }

    onFilterChange({
      ...filterModel,

      items:
        filterModel.items.filter(
          (item) =>
            item.field !== field
        ),
    })

    closeFilter()
  }


  // =========================================================
  // APPLY
  // =========================================================

  function applyFilter() {

    if (!field) {
      return
    }

    const otherItems =
      filterModel.items.filter(
        (item) =>
          item.field !== field
      )

    const selectedValues =
      options.filter(
        (value) =>
          selected.has(value)
      )


    // Excel behavior:
    // tất cả được chọn => bỏ filter
    if (
      selectedValues.length
      === options.length
    ) {

      onFilterChange({
        ...filterModel,
        items: otherItems,
      })

      closeFilter()

      return
    }


    // Không chọn gì
    // vẫn gửi [] để biểu diễn không match
    const newItem = {
      id: `${field}-excel-filter`,
      field,
      operator: 'isAnyOf',
      value: selectedValues,
    }


    onFilterChange({
      ...filterModel,

      items: [
        ...otherItems,
        newItem,
      ],
    })

    closeFilter()
  }


  // =========================================================
  // SELECT ALL
  // =========================================================

  function toggleSelectAll() {

    setSelected(
      (current) => {

        const next =
          new Set(current)

        if (allVisibleSelected) {

          visibleOptions.forEach(
            (value) =>
              next.delete(value)
          )

        } else {

          visibleOptions.forEach(
            (value) =>
              next.add(value)
          )
        }

        return next
      }
    )
  }


  // =========================================================
  // SINGLE VALUE
  // =========================================================

  function toggleValue(
    value: string
  ) {

    setSelected(
      (current) => {

        const next =
          new Set(current)

        if (
          next.has(value)
        ) {
          next.delete(value)
        } else {
          next.add(value)
        }

        return next
      }
    )
  }


  // =========================================================
  // SORT
  // =========================================================

  function sort(
    direction: 'asc' | 'desc'
  ) {

    if (!field) {
      return
    }

    onSortChange?.(
      field,
      direction,
    )

    closeFilter()
  }


  // =========================================================
  // CONTEXT
  // =========================================================

  const contextValue =
    useMemo<ExcelFilterContextValue>(
      () => ({
        filterModel,

        onFilterChange,

        openFilter: (
          nextField,
          nextLabel,
          nextAnchor,
        ) => {
          setField(nextField)

          setLabel(nextLabel)

          setOptions([])

          setSelected(
            new Set(),
          )

          setLoading(true)

          setError(null)

          setSearch('')

          setAnchorEl(
            nextAnchor,
          )
        },
      }),
      [
        filterModel,
        onFilterChange,
      ],
    )


  // =========================================================
  // UI
  // =========================================================

  return (
    <ExcelFilterContext.Provider
      value={contextValue}
    >

      {children}


      <Popover
        open={Boolean(anchorEl)}

        anchorEl={anchorEl}

        onClose={closeFilter}

        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}

        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}

        slotProps={{
          paper: {
            sx: (theme) => ({
              width: 310,

              maxHeight: 520,

              borderRadius: '6px',

              overflow: 'hidden',

              border:
                `1px solid ${theme.palette.divider}`,

              bgcolor:
                theme.palette.mode === 'dark'
                  ? '#252525'
                  : '#ffffff',

              backgroundImage: 'none',

              boxShadow:
                '0 10px 30px rgba(0,0,0,0.24)',
            }),
          },
        }}
      >

        {/* =========================================
            EXCEL COMMANDS
        ========================================= */}

        <MenuList
          dense
          disablePadding
          sx={{ py: 0.5 }}
        >

          <MenuItem
            onClick={() =>
              sort('asc')
            }
          >
            <ArrowUpwardRoundedIcon
              fontSize="small"
              sx={{ mr: 1.25 }}
            />

            Sort A to Z
          </MenuItem>


          <MenuItem
            onClick={() =>
              sort('desc')
            }
          >
            <ArrowDownwardRoundedIcon
              fontSize="small"
              sx={{ mr: 1.25 }}
            />

            Sort Z to A
          </MenuItem>


          <Divider />


          <MenuItem
            disabled={
              !hasActiveFilter
            }

            onClick={
              removeFieldFilter
            }
          >
            <FilterAltOffRoundedIcon
              fontSize="small"

              sx={{
                mr: 1.25,
              }}
            />

            <Typography
              noWrap
              sx={{
                fontSize: 13,
              }}
            >
              Clear Filter From "{label}"
            </Typography>
          </MenuItem>


          <Divider />


          <MenuItem>
            <Box
              sx={{
                width: '100%',

                display: 'flex',

                alignItems: 'center',

                justifyContent:
                  'space-between',
              }}
            >
              <span>
                Text Filters
              </span>

              <ChevronRightRoundedIcon
                fontSize="small"
              />
            </Box>
          </MenuItem>

        </MenuList>


        <Divider />


        {/* =========================================
            SEARCH
        ========================================= */}

        <Box
          sx={{
            px: 1,
            pt: 1,
            pb: 0.5,
          }}
        >

          <TextField
            autoFocus

            fullWidth

            size="small"

            placeholder="Search"

            value={search}

            onChange={(event) =>
              setSearch(
                event.target.value
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


        {/* =========================================
            VALUES
        ========================================= */}

        {loading ? (

          <Box
            sx={{
              height: 230,

              display: 'grid',

              placeItems: 'center',
            }}
          >
            <CircularProgress
              size={24}
            />
          </Box>

        ) : error ? (

          <Box sx={{ p: 1 }}>
            <Alert
              severity="error"
            >
              {error}
            </Alert>
          </Box>

        ) : (

          <Box
            sx={{
              height: 250,

              overflowY: 'auto',

              px: 1,

              py: 0.5,
            }}
          >

            {/* SELECT ALL */}

            <FormControlLabel
              control={
                <Checkbox
                  size="small"

                  checked={
                    allVisibleSelected
                  }

                  indeterminate={
                    someVisibleSelected
                  }

                  onChange={
                    toggleSelectAll
                  }
                />
              }

              label="(Select All)"

              sx={{
                m: 0,

                width: '100%',

                height: 28,

                '& .MuiFormControlLabel-label': {
                  fontSize: 12.5,
                  fontWeight: 600,
                },
              }}
            />


            {/* VALUES */}

            {visibleOptions.map(
              (value) => (

                <FormControlLabel
                  key={value}

                  control={
                    <Checkbox
                      size="small"

                      checked={
                        selected.has(
                          value
                        )
                      }

                      onChange={() =>
                        toggleValue(
                          value
                        )
                      }
                    />
                  }

                  label={
                    value || '(Blank)'
                  }

                  sx={{
                    m: 0,

                    width: '100%',

                    height: 27,

                    '& .MuiFormControlLabel-label':
                    {
                      fontSize: 12.5,

                      overflow:
                        'hidden',

                      textOverflow:
                        'ellipsis',

                      whiteSpace:
                        'nowrap',
                    },
                  }}
                />

              )
            )}


            {visibleOptions.length ===
              0 && (

                <Typography
                  color="text.secondary"

                  sx={{
                    py: 3,

                    fontSize: 12,

                    textAlign:
                      'center',
                  }}
                >
                  No values found
                </Typography>

              )}

          </Box>
        )}


        {/* =========================================
            FOOTER
        ========================================= */}

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

          <Button
            variant="outlined"

            onClick={
              closeFilter
            }
          >
            Cancel
          </Button>


          <Button
            variant="contained"

            disabled={
              loading
              || Boolean(error)
            }

            onClick={
              applyFilter
            }
          >
            OK
          </Button>

        </Stack>

      </Popover>

    </ExcelFilterContext.Provider>
  )
}