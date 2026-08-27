import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  GridColumnVisibilityModel,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid'

import {
  ReusableDataGrid,
} from '../components/common/dataGrid/ReusableDataGrid'

import {
  facConfirmColumns,
} from '../components/facConfirm/facConfirmColumns'

import {
  getFacConfirm,
  getFacConfirmProcessGroups,
} from '../services/facConfirmService'

import type {
  FacConfirmProcessGroup,
  FacConfirmProcessGroupSummary,
  FacConfirmRow,
} from '../types/facConfirm'

import { PageHeader } from '../components/common/PageHeader'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { RefreshButton } from '../components/common/RefreshButton'

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

export function FacConfirmPage() {

  // =======================================================
  // FILTER
  // =======================================================

  const [
    div,
    setDiv,
  ] = useState('PR')


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
      'Fine',
    )

  const [
    processGroups,
    setProcessGroups,
  ] = useState<FacConfirmProcessGroupSummary[]>([])


  const [
    processGroupsLoading,
    setProcessGroupsLoading,
  ] = useState(false)
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
    useState<GridPaginationModel>({
      page: 0,
      pageSize: 20,
    })


  // =======================================================
  // SORT
  // =======================================================

  const [
    sortModel,
    setSortModel,
  ] =
    useState<GridSortModel>([])


  // =======================================================
  // COLUMN VISIBILITY
  // =======================================================

  const [
    columnVisibilityModel,
    setColumnVisibilityModel,
  ] =
    useState<GridColumnVisibilityModel>(
      {},
    )


  // =======================================================
  // COLUMN ORDER
  // =======================================================

  const [
    columnOrder,
    setColumnOrder,
  ] =
    useState<string[]>(
      () =>
        facConfirmColumns.map(
          (column) =>
            column.field,
        ),
    )


  // =======================================================
  // COLUMN WIDTH
  // =======================================================

  const [
    columnWidths,
    setColumnWidths,
  ] =
    useState<Record<string, number>>(
      {},
    )


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

        const result =
          await getFacConfirm(
            {
              div,
              expD,
              procGrp,

              page:
                paginationModel.page,

              size:
                paginationModel.pageSize,
            },

            signal,
          )

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


  // =======================================================
  // COLUMN WIDTH CHANGE
  // =======================================================

  function handleColumnWidthChange(
    field: string,
    width: number,
  ) {

    setColumnWidths(
      (current) => ({
        ...current,
        [field]: width,
      }),
    )
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,

        display: 'flex',
        flexDirection: 'column',

        gap: 1.5,
        p: 2,
      }}
    >

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

      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 1.25,
          borderRadius: 2.5,

          background:
            theme.palette.mode === 'dark'
              ? 'rgba(15,23,42,0.62)'
              : 'rgba(255,255,255,0.72)',

          border:
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(255,255,255,0.82)',

          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',

          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.12)'
              : '0 8px 24px rgba(15,23,42,0.05)',
        })}
      >
        <Stack
          spacing={1}
          sx={{
            flexDirection: {
              xs: 'column',
              md: 'row',
            },

            alignItems: {
              xs: 'stretch',
              md: 'center',
            },
          }}
        >

          {/* DIVISION */}

          <FormControl
            size="small"
            sx={{
              minWidth: {
                xs: '100%',
                md: 125,
              },

              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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
                setDiv(event.target.value)
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


          {/* EXPORT DATE */}

          <TextField
            label="Export Date"
            type="date"
            size="small"

            value={expD}

            onChange={(event) => {
              setExpD(event.target.value)
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
                md: 170,
              },

              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />


          {/* PROCESS GROUP */}
          {/* =====================================================
    PROCESS GROUP
===================================================== */}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 0.7,
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

              return (
                <Button
                  key={item.processGroup}

                  disabled={processGroupsLoading}

                  onClick={() => {
                    setProcGrp(
                      item.processGroup,
                    )

                    setPaginationModel(
                      (current) => ({
                        ...current,
                        page: 0,
                      }),
                    )
                  }}

                  sx={(theme) => ({
                    minWidth: 145,
                    height: 48,

                    px: 1.25,
                    py: 0.55,

                    flexShrink: 0,

                    borderRadius: 2,

                    textTransform: 'none',

                    justifyContent: 'flex-start',

                    border: selected
                      ? `1px solid ${theme.palette.primary.main}`
                      : theme.palette.mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid rgba(15,23,42,0.08)',

                    background: selected
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(37,99,235,0.18)'
                        : 'rgba(37,99,235,0.08)'
                      : theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(255,255,255,0.42)',

                    color: selected
                      ? 'primary.main'
                      : 'text.primary',

                    boxShadow: selected
                      ? '0 3px 10px rgba(37,99,235,0.12)'
                      : 'none',

                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',

                    transition: 'all 160ms ease',

                    '&:hover': {
                      background: selected
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(37,99,235,0.24)'
                          : 'rgba(37,99,235,0.12)'
                        : theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.78)',

                      transform: 'translateY(-1px)',
                    },
                  })}
                >
                  <Box
                    sx={{
                      width: '100%',

                      display: 'flex',
                      flexDirection: 'column',

                      alignItems: 'flex-start',
                      justifyContent: 'center',

                      lineHeight: 1,
                    }}
                  >

                    {/* NAME */}

                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 800,

                        lineHeight: 1.1,

                        color: selected
                          ? 'primary.main'
                          : 'text.primary',
                      }}
                    >
                      {item.processGroup}
                    </Typography>


                    {/* COUNT + QTY */}

                    <Box
                      sx={{
                        mt: 0.45,

                        display: 'flex',
                        alignItems: 'center',

                        whiteSpace: 'nowrap',
                      }}
                    >

                      {/* DOT */}

                      <Box
                        sx={{
                          width: 4,
                          height: 4,

                          mr: 0.55,

                          borderRadius: '50%',

                          bgcolor: selected
                            ? 'primary.main'
                            : 'text.disabled',
                        }}
                      />


                      {/* ORDER COUNT */}

                      <Typography
                        component="span"
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 600,

                          color: selected
                            ? 'primary.main'
                            : 'text.secondary',
                        }}
                      >
                        PO {item.orderCount.toLocaleString()}
                      </Typography>


                      {/* SEPARATOR */}

                      <Typography
                        component="span"
                        sx={{
                          mx: 0.55,

                          fontSize: 10,
                          color: 'text.disabled',
                        }}
                      >
                        ·
                      </Typography>


                      {/* FINAL QTY */}

                      <Typography
                        component="span"
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 600,

                          color: selected
                            ? 'primary.main'
                            : 'text.secondary',
                        }}
                      >
                        Qty {item.totalFinalQty.toLocaleString()}
                      </Typography>

                    </Box>

                  </Box>
                </Button>
              )
            })}
          </Box>

          {/* SUMMARY */}

          <Box
            sx={{
              ml: {
                md: 'auto',
              },

              px: 1.1,
              py: 0.7,

              borderRadius: 2,

              bgcolor:
                'rgba(37,99,235,0.06)',

              border:
                '1px solid rgba(37,99,235,0.10)',
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: 'primary.main',
              }}
            >
              {div} · {procGrp}
            </Typography>
          </Box>

        </Stack>
      </Paper>

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

        <ReusableDataGrid<FacConfirmRow>

          // =============================================
          // DATA
          // =============================================

          rows={rows}

          columns={
            facConfirmColumns
          }

          getRowId={(row) =>
            [
              row.aufnr,
              row.zglobalCode ?? '',
            ].join('|')
          }

          loading={loading}


          // =============================================
          // PAGINATION
          // =============================================

          paginationMode="server"

          page={
            paginationModel.page
          }

          pageSize={
            paginationModel.pageSize
          }

          rowCount={
            totalElements
          }

          onPaginationChange={
            setPaginationModel
          }


          // =============================================
          // SORT
          // =============================================

          sortingMode="client"

          sortModel={
            sortModel
          }

          onSortChange={
            setSortModel
          }


          // =============================================
          // COLUMN VISIBILITY
          // =============================================

          columnVisibilityModel={
            columnVisibilityModel
          }

          onColumnVisibilityModelChange={
            setColumnVisibilityModel
          }


          // =============================================
          // COLUMN ORDER
          // =============================================

          columnOrder={
            columnOrder
          }

          onColumnOrderChange={
            setColumnOrder
          }


          // =============================================
          // COLUMN WIDTH
          // =============================================

          columnWidths={
            columnWidths
          }

          onColumnWidthChange={
            handleColumnWidthChange
          }

        />

      </Box>

    </Box>
  )
}