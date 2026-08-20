import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
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

import { getShipmentFulfillment } from '../services/shipmentService'
import { uiTokens } from '../theme/uiTokens'

import type {
  ShipmentFulfillment,
} from '../types/shipment'


const defaultRange =
  getDefaultShipmentDateRange()


export function ShipmentPage() {
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

  const [fromD, setFromD] =
    useState(defaultRange.fromD)

  const [toD, setToD] =
    useState(defaultRange.toD)

  const [appliedFromD, setAppliedFromD] =
    useState(defaultRange.fromD)

  const [appliedToD, setAppliedToD] =
    useState(defaultRange.toD)


  // =========================================================
  // LOAD DATA
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
        setLastUpdated(new Date())
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

  const dates = useMemo(
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

  const rows = useMemo(
    () =>
      buildShipmentRows(data),
    [data],
  )


  // =========================================================
  // DATE FILTER
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

    setFromD(range.fromD)
    setToD(range.toD)

    setAppliedFromD(range.fromD)
    setAppliedToD(range.toD)
  }


  function handleRefresh() {
    setRefreshKey(
      (value) => value + 1,
    )
  }


  // =========================================================
  // COMMON CONTROL STYLE
  // =========================================================

  const controlSx = {
    height: uiTokens.control.height,
    fontSize: uiTokens.control.fontSize,
  }


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
            updatedAt={lastUpdated}
            error={Boolean(error)}
          />
        }
        actions={
          <RefreshButton
            loading={loading}
            onClick={handleRefresh}
          />
        }
      />


      {/* =====================================================
          DATE FILTER
      ===================================================== */}

      <Stack
        direction="row"
        spacing={0.75}
        sx={(theme) => ({
          px: 1.5,
          py: 1,

          alignItems: 'center',

          bgcolor:
            'background.paper',

          border:
            `1px solid ${theme.palette.divider}`,

          borderRadius:
            uiTokens.card.borderRadius,
        })}
      >

        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: 'text.secondary',
            mr: 0.5,
          }}
        >
          DATE RANGE
        </Typography>


        {/* FROM DATE */}

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
          sx={{
            width: 145,

            '& .MuiInputBase-root':
              controlSx,
          }}
        />


        <Typography
          color="text.secondary"
          sx={{
            fontSize: 12,
          }}
        >
          →
        </Typography>


        {/* TO DATE */}

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
          sx={{
            width: 145,

            '& .MuiInputBase-root':
              controlSx,
          }}
        />


        {/* APPLY */}

        <Button
          size="small"
          variant="contained"
          disabled={loading}
          onClick={handleApplyDate}
          sx={{
            minWidth: 60,
            ...controlSx,
          }}
        >
          Apply
        </Button>


        {/* RESET 14 DAYS */}

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


        {/* PUSH LEGEND TO RIGHT */}

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

          position: 'relative',
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
          />

        )}
      </Box>

    </PageShell>
  )
}