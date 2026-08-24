import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import type {
  SxProps,
  Theme,
} from '@mui/material'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'

import { ShipmentHeatmap } from '../components/shipment/ShipmentHeatmap'
import { ShipmentLegend } from '../components/shipment/ShipmentLegend'

import {
  buildDateRange,
  buildShipmentRows,
  getDefaultShipmentDateRange,
} from '../components/shipment/shipmentHeatmapUtils'

import {
  getShipmentDetail,
  getShipmentFulfillment,
} from '../services/shipmentService'

import { uiTokens } from '../theme/uiTokens'

import type {
  ShipmentDetailFilter,
  ShipmentFulfillment,
} from '../types/shipment'

import type {
  ProductionOrder,
} from '../types/report'
import { ShipmentDetailDialog } from '../components/common/shipment/ShipmentDetailDialog'


const defaultRange =
  getDefaultShipmentDateRange()


export function ShipmentPage() {

  // =========================================================
  // HEATMAP STATE
  // =========================================================

  const [data, setData] =
    useState<ShipmentFulfillment[]>([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null)

  const [refreshKey, setRefreshKey] =
    useState(0)


  const [
    selectedRowKey,
    setSelectedRowKey,
  ] = useState<string | null>(null)

  const [
    selectedCellKey,
    setSelectedCellKey,
  ] = useState<string | null>(null)

  // =========================================================
  // DATE FILTER
  // =========================================================

  const [fromD, setFromD] =
    useState(defaultRange.fromD)

  const [toD, setToD] =
    useState(defaultRange.toD)

  const [appliedFromD, setAppliedFromD] =
    useState(defaultRange.fromD)

  const [appliedToD, setAppliedToD] =
    useState(defaultRange.toD)


  // =========================================================
  // DETAIL DIALOG STATE
  // =========================================================

  const [detailOpen, setDetailOpen] =
    useState(false)

  const [detailFilter, setDetailFilter] =
    useState<ShipmentDetailFilter | null>(null)

  const [detailData, setDetailData] =
    useState<ProductionOrder[]>([])

  const [detailLoading, setDetailLoading] =
    useState(false)

  const [detailError, setDetailError] =
    useState<string | null>(null)


  // =========================================================
  // LOAD HEATMAP DATA
  // =========================================================

  useEffect(() => {

    const controller =
      new AbortController()

    async function loadData() {

      setLoading(true)
      setError(null)

      try {

        const result =
          await getShipmentFulfillment(
            appliedFromD,
            appliedToD,
            controller.signal,
          )

        setData(result)

        setLastUpdated(
          new Date(),
        )

      } catch (requestError) {

        if (!controller.signal.aborted) {

          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load shipment fulfillment',
          )
        }

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      controller.abort()
    }

  }, [
    appliedFromD,
    appliedToD,
    refreshKey,
  ])


  // =========================================================
  // HEATMAP DATA
  // =========================================================

  const dates =
    useMemo(
      () =>
        buildDateRange(
          appliedFromD,
          appliedToD,
        ),
      [
        appliedFromD,
        appliedToD,
      ],
    )


  const rows =
    useMemo(
      () =>
        buildShipmentRows(data),
      [data],
    )


  // =========================================================
  // DATE FILTER ACTIONS
  // =========================================================

  function handleApplyDate() {

    if (!fromD || !toD) {

      setError(
        'Please select From Date and To Date',
      )

      return
    }


    if (fromD > toD) {

      setError(
        'From Date cannot be after To Date',
      )

      return
    }


    setError(null)

    setAppliedFromD(fromD)
    setAppliedToD(toD)
  }


  function handleResetTwoWeeks() {

    const range =
      getDefaultShipmentDateRange()

    setFromD(
      range.fromD,
    )

    setToD(
      range.toD,
    )

    setAppliedFromD(
      range.fromD,
    )

    setAppliedToD(
      range.toD,
    )
  }


  function handleRefresh() {

    setRefreshKey(
      (value) =>
        value + 1,
    )
  }


  // =========================================================
  // OPEN DETAIL
  // =========================================================

  async function openShipmentDetail(
    filter: ShipmentDetailFilter,
  ) {

    setDetailFilter(
      filter,
    )

    setDetailOpen(true)

    setDetailLoading(true)

    setDetailError(null)

    setDetailData([])

    try {

      const result =
        await getShipmentDetail(
          filter,
        )

      setDetailData(
        result,
      )

    } catch (requestError) {

      setDetailError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load shipment detail',
      )

    } finally {

      setDetailLoading(false)
    }
  }


  // =========================================================
  // CLOSE DETAIL
  // =========================================================

  function handleCloseDetail() {

    setDetailOpen(false)

    setDetailError(null)
  }


  // =========================================================
  // COMMON CONTROL STYLE
  // =========================================================

  const controlSx = {
    height:
      uiTokens.control.height,

    fontSize:
      uiTokens.control.fontSize,
  }


  const dateFieldSx:
    SxProps<Theme> =
    (theme) => {

      const dark =
        theme.palette.mode === 'dark'

      return {

        width: 145,

        '& .MuiInputBase-root': {
          ...controlSx,

          bgcolor:
            dark
              ? 'rgba(30, 41, 59, 0.72)'
              : '#ffffff',

          color:
            'text.primary',
        },

        '& .MuiOutlinedInput-notchedOutline':
        {
          borderColor:
            dark
              ? 'rgba(148, 163, 184, 0.22)'
              : theme.palette.divider,
        },

        '&:hover .MuiOutlinedInput-notchedOutline':
        {
          borderColor:
            theme.palette.primary.main,
        },

        '& .MuiInputLabel-root':
        {
          color:
            'text.secondary',
        },

        '& input::-webkit-calendar-picker-indicator':
        {
          filter:
            dark
              ? 'invert(1) opacity(0.8)'
              : 'none',
        },
      }
    }


  // =========================================================
  // UI
  // =========================================================

  return (

    <PageShell>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <PageHeader
        title="SHIPMENT FULFILLMENT"
        subtitle="Monitor shipment fulfillment and delivery readiness."

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


      {/* =====================================================
          DATE RANGE
      ===================================================== */}

      <Stack
        direction="row"
        spacing={0.75}

        sx={(theme) => {

          const dark =
            theme.palette.mode === 'dark'

          return {

            px: 1.5,
            py: 1,

            alignItems:
              'center',

            bgcolor:
              dark
                ? 'rgba(15, 23, 42, 0.72)'
                : 'rgba(255, 255, 255, 0.82)',

            border:
              `1px solid ${dark
                ? 'rgba(148, 163, 184, 0.18)'
                : theme.palette.divider
              }`,

            borderRadius:
              uiTokens.card.borderRadius,

            backdropFilter:
              'blur(12px)',
          }
        }}
      >

        <Typography
          sx={{
            fontSize: 11,

            fontWeight: 700,

            color:
              'text.secondary',

            mr: 0.5,
          }}
        >
          DATE RANGE
        </Typography>


        {/* FROM */}

        <TextField
          label="From"

          type="date"

          size="small"

          value={fromD}

          onChange={(event) =>
            setFromD(
              event.target.value,
            )
          }

          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}

          sx={dateFieldSx}
        />


        <Typography
          color="text.secondary"

          sx={{
            fontSize: 12,
          }}
        >
          →
        </Typography>


        {/* TO */}

        <TextField
          label="To"

          type="date"

          size="small"

          value={toD}

          onChange={(event) =>
            setToD(
              event.target.value,
            )
          }

          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}

          sx={dateFieldSx}
        />


        {/* APPLY */}

        <Button
          size="small"

          variant="contained"

          disabled={loading}

          onClick={
            handleApplyDate
          }

          sx={{
            minWidth: 60,
            ...controlSx,
          }}
        >
          Apply
        </Button>


        {/* 14 DAYS */}

        <Button
          size="small"

          variant="outlined"

          disabled={loading}

          onClick={
            handleResetTwoWeeks
          }

          sx={controlSx}
        >
          14 Days
        </Button>


        <Box
          sx={{
            flex: 1,
          }}
        />


        {/* LEGEND */}

        <ShipmentLegend />

      </Stack>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <Alert
          severity="error"
        >
          {error}
        </Alert>

      )}


      {/* =====================================================
          HEATMAP
      ===================================================== */}

      <Box
        sx={{
          flex: 1,

          minWidth: 0,
          minHeight: 0,

          position:
            'relative',
        }}
      >

        {loading &&
          data.length === 0 ? (

          <Box
            sx={{
              height: '100%',

              display: 'grid',

              placeItems:
                'center',
            }}
          >
            <CircularProgress
              size={28}
            />
          </Box>

        ) : (

            <ShipmentHeatmap
              dates={dates}
              rows={rows}

              selectedRowKey={selectedRowKey}
              selectedCellKey={selectedCellKey}

              onRowClick={(row) => {
                setSelectedRowKey(
                  row.key,
                )

                setSelectedCellKey(
                  null,
                )

                void openShipmentDetail({
                  cusId:
                    row.cusId,

                  shipBy:
                    row.shipBy,
                })
              }}

              onCellClick={(row, date) => {
                setSelectedRowKey(
                  null,
                )

                setSelectedCellKey(
                  `${row.key}-${date}`,
                )

                void openShipmentDetail({
                  cusId:
                    row.cusId,

                  shipBy:
                    row.shipBy,

                  exportDate:
                    date,
                })
              }}
            />

        )}

      </Box>


      {/* =====================================================
          DETAIL POPUP
      ===================================================== */}

      <ShipmentDetailDialog
        open={detailOpen}

        filter={
          detailFilter
        }

        data={
          detailData
        }

        loading={
          detailLoading
        }

        error={
          detailError
        }

        onClose={
          handleCloseDetail
        }
      />

    </PageShell>
  )
}