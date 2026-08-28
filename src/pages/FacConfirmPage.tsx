import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'

import PrecisionManufacturingRoundedIcon
  from '@mui/icons-material/PrecisionManufacturingRounded'

import LocalFireDepartmentRoundedIcon
  from '@mui/icons-material/LocalFireDepartmentRounded'

import ConstructionRoundedIcon
  from '@mui/icons-material/ConstructionRounded'

import { alpha } from '@mui/material/styles'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid'

import {
  facConfirmColumns,
} from '../components/facConfirm/facConfirmColumns'
import { FacConfirmDataTable } from '../components/facConfirm/FacConfirmDataTable'

import {
  getFacConfirm,
  getFacConfirmProcessGroups,
  searchFacConfirm,
} from '../services/facConfirmService'

import type {
  FacConfirmProcessGroup,
  FacConfirmProcessGroupSummary,
  FacConfirmRow,
  FacConfirmFilterItem,
} from '../types/facConfirm'

import { PageHeader } from '../components/common/PageHeader'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { RefreshButton } from '../components/common/RefreshButton'
import { PageShell } from '../components/common/PageShell'
import { GlassPanel } from '../components/common/GlassPanel'
import { uiTokens } from '../theme/uiTokens'
import { useGridPreferences } from '../hooks/useGridPreferences'
import {
  loadFacConfirmPreferences,
  saveFacConfirmPreferences,
} from '../utils/uiPreferences'
// =========================================================
// DEFAULT DATE
// =========================================================

function getToday(): string {
  const now = new Date()

  const year = now.getFullYear()

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(2, '0')

  const day =
    String(
      now.getDate(),
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


// =========================================================
// PAGE
// =========================================================
function getProcessGroupIcon(
  processGroup: FacConfirmProcessGroup,
) {
  switch (processGroup) {
    case 'Fine':
      return PrecisionManufacturingRoundedIcon

    case 'Heat':
      return LocalFireDepartmentRoundedIcon

    case 'Rough':
      return ConstructionRoundedIcon
  }
}

export function FacConfirmPage() {

  // =======================================================
  // GRID PREFERENCES - LOCAL STORAGE
  // =======================================================

  const {
    columnVisibilityModel,
    columnOrder,
    columnWidths,
    pageSize,
    setColumnVisibilityModel,
    setColumnOrder,
    setColumnWidth,
    setPageSize,
  } = useGridPreferences(
    'fac-confirm',
    20,
  )

  // =======================================================
  // FILTER
  // =======================================================

  const initialFacConfirmPreferences =
    loadFacConfirmPreferences()

  const [
    div,
    setDiv,
  ] = useState(
    initialFacConfirmPreferences.div,
  )


  const [
    expD,
    setExpD,
  ] = useState(
    getToday,
  )


  const [
    procGrp,
    setProcGrp,
  ] =
    useState<FacConfirmProcessGroup>(
      initialFacConfirmPreferences.procGrp,
    )

  const [
    processGroups,
    setProcessGroups,
  ] = useState<FacConfirmProcessGroupSummary[]>([])


  const [
    processGroupsLoading,
    setProcessGroupsLoading,
  ] = useState(false)

  const [excelFilters, setExcelFilters] =
    useState<FacConfirmFilterItem[]>([])

  const savePagePreference = useCallback(
    (
      nextDiv: string,
      nextProcGrp: FacConfirmProcessGroup,
    ) => {
      saveFacConfirmPreferences({
        div: nextDiv,
        procGrp: nextProcGrp,
      })
    },
    [],
  )

  // =======================================================
  // DATA
  // =======================================================

  const [
    rows,
    setRows,
  ] =
    useState<FacConfirmRow[]>([])


  const [
    totalElements,
    setTotalElements,
  ] =
    useState(0)


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

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(
    null,
  )

  // =======================================================
  // PAGINATION
  // =======================================================

  const [
    paginationModel,
    setPaginationModel,
  ] =
    useState<GridPaginationModel>(() => ({
      page: 0,
      pageSize,
    }))

  const handlePaginationChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel(model)

      if (model.pageSize !== pageSize) {
        setPageSize(model.pageSize)
      }
    },
    [pageSize, setPageSize],
  )
  // =======================================================
  // SORT
  // =======================================================

  const [
    sortModel,
    setSortModel,
  ] =
    useState<GridSortModel>([])



  // =======================================================
  // LOAD DATA
  // =======================================================
  const loadProcessGroups = useCallback(
    async (
      signal?: AbortSignal,
    ) => {

      setProcessGroupsLoading(true)

      try {

        const result =
          await getFacConfirmProcessGroups(
            div,
            expD,
            signal,
          )

        setProcessGroups(
          result,
        )

      } catch (error) {

        if (
          error instanceof DOMException
          && error.name === 'AbortError'
        ) {
          return
        }

        console.error(
          'Load process groups failed:',
          error,
        )

      } finally {

        if (!signal?.aborted) {
          setProcessGroupsLoading(false)
        }
      }
    },
    [
      div,
      expD,
    ],
  )


  const loadData = useCallback(
    async (
      signal?: AbortSignal,
    ) => {

      setLoading(true)
      setError(null)

      try {

        const request = {
          div,
          expD,
          procGrp,
          page: paginationModel.page,
          size: paginationModel.pageSize,
        }

        const result = excelFilters.length > 0
          ? await searchFacConfirm({
            ...request,
            filters: excelFilters,
            logicOperator: 'and',
          }, signal)
          : await getFacConfirm(request, signal)

        setRows(
          result.content,
        )

        setTotalElements(
          result.totalElements,
        )

        setLastUpdated(
          new Date(),
        )

      } catch (error) {

        if (
          error instanceof DOMException
          && error.name === 'AbortError'
        ) {
          return
        }

        console.error(
          'Load Fac Confirm failed:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load Fac Confirm',
        )

      } finally {

        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [
      div,
      expD,
      procGrp,
      paginationModel.page,
      paginationModel.pageSize,
      excelFilters,
    ],
  )

  useEffect(() => {

    const controller =
      new AbortController()

    void loadData(
      controller.signal,
    )

    return () => {
      controller.abort()
    }

  }, [loadData])

  useEffect(() => {

    const controller =
      new AbortController()

    void loadProcessGroups(
      controller.signal,
    )

    return () => {
      controller.abort()
    }

  }, [loadProcessGroups])

  // =======================================================
  // RESET PAGE
  // =======================================================
  function handleRefresh() {

    void loadData()

    void loadProcessGroups()
  }

  function resetPage() {

    setPaginationModel(
      (current) => ({
        ...current,
        page: 0,
      }),
    )
  }

  function handleExcelFiltersChange(
    nextFilters: FacConfirmFilterItem[],
  ) {
    setExcelFilters(nextFilters)
    resetPage()
  }




  // =======================================================
  // RENDER
  // =======================================================

  return (
    <PageShell>

      {/* =================================================
          HEADER
      ================================================= */}
      <PageHeader
        title="FAC CONFIRM"
        subtitle="Production process confirmation."

        status={
          <UpdatedStatus
            updatedAt={
              lastUpdated
            }
            error={
              Boolean(error)
            }
          />
        }

        actions={
          <RefreshButton
            loading={loading}
            onClick={
              handleRefresh
            }
          />
        }
      />



      {/* =================================================
          FILTER BAR
      ================================================= */}

      <GlassPanel
        sx={{
          p: 1,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',

            flexDirection: {
              xs: 'column',
              sm: 'row',
            },

            alignItems: {
              xs: 'stretch',
              sm: 'center',
            },

            gap: 0.75,
          }}
        >

          {/* =====================================================
        DIVISION
    ===================================================== */}

          <FormControl
            size="small"
            sx={{
              width: {
                xs: '100%',
                sm: 125,
              },

              flexShrink: 0,

              '& .MuiOutlinedInput-root': {
                height: 44,
                borderRadius: uiTokens.control.borderRadius,
              },

              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',

                fontSize: 12.5,
                fontWeight: 600,
              },

              '& .MuiInputLabel-root': {
                fontSize: 12,
              },
            }}
          >
            <InputLabel>
              Division
            </InputLabel>

            <Select
              label="Division"
              value={div}
              onChange={(event) => {
                const nextDiv =
                  event.target.value

                setDiv(
                  nextDiv,
                )

                savePagePreference(
                  nextDiv,
                  procGrp,
                )

                resetPage()
              }}
            >
              <MenuItem value="PR">
                PRESS
              </MenuItem>

              <MenuItem value="PR-RET">
                PRESS Retainer
              </MenuItem>

              <MenuItem value="MO">
                MOLD
              </MenuItem>

              <MenuItem value="GU">
                GUIDE
              </MenuItem>
            </Select>
          </FormControl>


          {/* =====================================================
        EXPORT DATE
    ===================================================== */}

          <TextField
            label="Export Date"
            type="date"
            size="small"

            value={expD}

            onChange={(event) => {
              setExpD(
                event.target.value,
              )

              resetPage()
            }}

            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}

            sx={{
              width: {
                xs: '100%',
                sm: 160,
              },

              flexShrink: 0,

              '& .MuiOutlinedInput-root': {
                height: 44,
                borderRadius: uiTokens.control.borderRadius,
              },

              '& .MuiInputBase-input': {
                fontSize: 12.5,
                fontWeight: 600,
              },

              '& .MuiInputLabel-root': {
                fontSize: 12,
              },
            }}
          />


          {/* =====================================================
        SEPARATOR
    ===================================================== */}

          <Box
            sx={(theme) => ({
              display: {
                xs: 'none',
                sm: 'block',
              },

              width: '1px',
              height: 26,

              mx: 0.2,

              flexShrink: 0,

              bgcolor:
                alpha(
                  theme.palette.text.primary,
                  0.10,
                ),
            })}
          />


          {/* =====================================================
        PROCESS GROUPS
    ===================================================== */}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',

              gap: 0.65,

              flex: 1,
              minWidth: 0,

              overflowX: 'auto',

              '&::-webkit-scrollbar': {
                display: 'none',
              },

              scrollbarWidth: 'none',
            }}
          >
            {processGroups.map((item) => {

              const selected =
                item.processGroup === procGrp

              const ProcessIcon =
                getProcessGroupIcon(
                  item.processGroup,
                )

              return (
                <Button
                  key={item.processGroup}

                  disabled={
                    processGroupsLoading
                  }

                  onClick={() => {
                    const nextProcGrp =
                      item.processGroup

                    setProcGrp(
                      nextProcGrp,
                    )

                    savePagePreference(
                      div,
                      nextProcGrp,
                    )

                    setPaginationModel(
                      (current) => ({
                        ...current,
                        page: 0,
                      }),
                    )
                  }}

                  sx={(theme) => ({
                    minWidth: 148,
                    height: 44,

                    px: 1.25,

                    flexShrink: 0,

                    borderRadius:
                      uiTokens.control.borderRadius,

                    textTransform: 'none',

                    justifyContent: 'flex-start',

                    border:
                      `1px solid ${selected
                        ? alpha(
                          theme.palette.primary.main,
                          0.55,
                        )
                        : alpha(
                          theme.palette.text.primary,
                          0.08,
                        )
                      }`,

                    backgroundColor:
                      selected
                        ? alpha(
                          theme.palette.primary.main,
                          theme.palette.mode === 'dark'
                            ? 0.16
                            : 0.07,
                        )
                        : alpha(
                          theme.palette.background.paper,
                          theme.palette.mode === 'dark'
                            ? 0.28
                            : 0.52,
                        ),

                    color:
                      selected
                        ? 'primary.main'
                        : 'text.primary',

                    boxShadow:
                      selected
                        ? `0 2px 10px ${alpha(
                          theme.palette.primary.main,
                          0.10,
                        )
                        }`
                        : 'none',

                    backdropFilter:
                      'blur(10px)',

                    WebkitBackdropFilter:
                      'blur(10px)',

                    transition:
                      'background-color 160ms ease, border-color 160ms ease, transform 160ms ease',

                    '&:hover': {
                      backgroundColor:
                        selected
                          ? alpha(
                            theme.palette.primary.main,
                            theme.palette.mode === 'dark'
                              ? 0.22
                              : 0.11,
                          )
                          : theme.palette.action.hover,

                      transform:
                        'translateY(-1px)',
                    },
                  })}
                >
                  <Box
                    sx={{
                      width: '100%',

                      display: 'flex',
                      alignItems: 'center',

                      gap: 0.8,

                      minWidth: 0,
                    }}
                  >
                    {/* ICON */}

                    <Box
                      sx={(theme) => ({
                        width: 28,
                        height: 28,

                        flexShrink: 0,

                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',

                        borderRadius: 1.5,

                        color: selected
                          ? 'primary.main'
                          : 'text.secondary',

                        backgroundColor: selected
                          ? alpha(
                            theme.palette.primary.main,
                            0.12,
                          )
                          : alpha(
                            theme.palette.text.primary,
                            0.045,
                          ),
                      })}
                    >
                      <ProcessIcon
                        sx={{
                          fontSize: 17,
                        }}
                      />
                    </Box>


                    {/* CONTENT */}

                    <Box
                      sx={{
                        minWidth: 0,

                        display: 'flex',
                        flexDirection: 'column',

                        alignItems: 'flex-start',
                        justifyContent: 'center',
                      }}
                    >
                      {/* NAME */}

                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 800,

                          lineHeight: 1,

                          color: selected
                            ? 'primary.main'
                            : 'text.primary',
                        }}
                      >
                        {item.processGroup}
                      </Typography>


                      {/* PO + QTY */}

                      <Box
                        sx={{
                          mt: 0.5,

                          display: 'flex',
                          alignItems: 'center',

                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 600,

                            lineHeight: 1,

                            color: selected
                              ? 'primary.main'
                              : 'text.secondary',
                          }}
                        >
                          PO {item.orderCount.toLocaleString()}
                        </Typography>

                        <Box
                          sx={{
                            width: 3,
                            height: 3,

                            mx: 0.65,

                            borderRadius: '50%',

                            bgcolor: selected
                              ? 'primary.main'
                              : 'text.disabled',
                          }}
                        />

                        <Typography
                          component="span"
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 600,

                            lineHeight: 1,

                            color: selected
                              ? 'primary.main'
                              : 'text.secondary',
                          }}
                        >
                          Qty {item.totalFinalQty.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Button>
              )
            })}
          </Box>

        </Box>
      </GlassPanel>
      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}


      {/* =================================================
          DATA GRID
      ================================================= */}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
        }}
      >
        <FacConfirmDataTable
          rows={rows}
          loading={loading}
          div={div}
          expD={expD}
          procGrp={procGrp}

          excelFilters={excelFilters}

          paginationModel={paginationModel}
          rowCount={totalElements}

          sortModel={sortModel}

          columnVisibilityModel={columnVisibilityModel}
          columnOrder={columnOrder}
          columnWidths={columnWidths}

          onExcelFiltersChange={handleExcelFiltersChange}

          onPaginationChange={handlePaginationChange}

          onSortChange={setSortModel}

          onColumnVisibilityModelChange={
            setColumnVisibilityModel
          }

          onColumnOrderChange={
            setColumnOrder
          }

          onColumnWidthChange={
            setColumnWidth
          }
        />

      </Box>

    </PageShell>
  )
}
