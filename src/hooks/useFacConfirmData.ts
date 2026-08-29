import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getFacConfirm,
  getFacConfirmConfirmedProcesses,
  getFacConfirmProcessGroups,
  searchFacConfirm,
} from '../services/facConfirmService'

import type {
  FacConfirmConfirmedProcess,
  FacConfirmFilterItem,
  FacConfirmProcessGroup,
  FacConfirmProcessGroupSummary,
  FacConfirmRow,
} from '../types/facConfirm'


interface UseFacConfirmDataParams {
  div: string
  expD: string
  procGrp: FacConfirmProcessGroup
  page: number
  pageSize: number
  excelFilters: FacConfirmFilterItem[]
}


// =========================================================
// MERGE CONFIRMED PROCESS TIMES INTO ROWS
// =========================================================

function mergeConfirmedProcesses(
  rows: FacConfirmRow[],
  confirmedProcesses: FacConfirmConfirmedProcess[],
): FacConfirmRow[] {

  if (
    rows.length === 0
    || confirmedProcesses.length === 0
  ) {
    return rows
  }


  const confirmedMap =
    new Map<
      string,
      FacConfirmConfirmedProcess[]
    >()


  confirmedProcesses.forEach(
    (item) => {

      const aufnr =
        item.aufnr?.trim()

      if (!aufnr) {
        return
      }


      const current =
        confirmedMap.get(
          aufnr,
        ) ?? []


      current.push(
        item,
      )


      confirmedMap.set(
        aufnr,
        current,
      )
    },
  )


  return rows.map(
    (row) => {

      const aufnr =
        row.aufnr?.trim()

      if (!aufnr) {
        return row
      }


      const confirmed =
        confirmedMap.get(
          aufnr,
        )


      if (
        !confirmed
        || confirmed.length === 0
      ) {
        return row
      }


      const nextRow: FacConfirmRow = {
        ...row,
      }


      confirmed.forEach(
        (item) => {

          if (!item.confirmFnTime) {
            return
          }


          switch (
          item.processGrp
          ) {

            // =============================================
            // ROUGH
            // =============================================

            case 'To Drill':
              nextRow.toDrill =
                item.confirmFnTime
              break


            case 'To Heat':
              nextRow.toHeat =
                item.confirmFnTime
              break


            // =============================================
            // HEAT
            // =============================================

            case 'Heat Start':
              nextRow.heatStart =
                item.confirmFnTime
              break


            case 'Heat Finish':
              nextRow.heatFinish =
                item.confirmFnTime
              break


            // =============================================
            // FINE
            // =============================================

            case 'To Packing':
              nextRow.toPk =
                item.confirmFnTime
              break


            default:
              break
          }
        },
      )


      return nextRow
    },
  )
}


// =========================================================
// HOOK
// =========================================================

export function useFacConfirmData(
  params: UseFacConfirmDataParams,
) {

  const {
    div,
    expD,
    procGrp,
    page,
    pageSize,
    excelFilters,
  } = params


  // =========================================================
  // STATE
  // =========================================================

  const [
    rows,
    setRows,
  ] =
    useState<
      FacConfirmRow[]
    >(
      [],
    )


  const [
    confirmedProcesses,
    setConfirmedProcesses,
  ] =
    useState<
      FacConfirmConfirmedProcess[]
    >(
      [],
    )


  const [
    processGroups,
    setProcessGroups,
  ] =
    useState<
      FacConfirmProcessGroupSummary[]
    >(
      [],
    )


  const [
    totalElements,
    setTotalElements,
  ] =
    useState(
      0,
    )


  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    )


  const [
    processGroupsLoading,
    setProcessGroupsLoading,
  ] =
    useState(
      false,
    )


  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null,
    )


  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState<
      Date | null
    >(
      null,
    )


  // =========================================================
  // DISPLAY ROWS
  //
  // rows từ Backlog API
  // +
  // confirmedProcesses từ F2_Backlog_Fac_Confirm
  // =========================================================

  const displayRows =
    useMemo(
      () =>
        mergeConfirmedProcesses(
          rows,
          confirmedProcesses,
        ),
      [
        rows,
        confirmedProcesses,
      ],
    )


  // =========================================================
  // LOAD MAIN TABLE
  // =========================================================

  const loadData =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {

        setLoading(
          true,
        )

        setError(
          null,
        )


        try {

          const request = {
            div,
            expD,
            procGrp,
            page,
            size:
              pageSize,
          }


          // =================================================
          // GET MAIN DATA
          // =================================================

          const result =
            excelFilters.length > 0
              ? await searchFacConfirm(
                {
                  ...request,

                  filters:
                    excelFilters,

                  logicOperator:
                    'and',
                },
                signal,
              )
              : await getFacConfirm(
                request,
                signal,
              )


          if (
            signal?.aborted
          ) {
            return
          }


          // =================================================
          // MAIN ROWS
          // =================================================

          setRows(
            result.content,
          )


          setTotalElements(
            result.totalElements,
          )


          // =================================================
          // GET AUFNR OF CURRENT PAGE
          // =================================================

          const aufnrs = [
            ...new Set(
              result.content
                .map(
                  (row) =>
                    row.aufnr
                      ?.trim(),
                )
                .filter(
                  (
                    aufnr,
                  ): aufnr is string =>
                    Boolean(
                      aufnr,
                    ),
                ),
            ),
          ]


          // =================================================
          // NO ROWS
          // =================================================

          if (
            aufnrs.length === 0
          ) {

            setConfirmedProcesses(
              [],
            )

            setLastUpdated(
              new Date(),
            )

            return
          }


          // =================================================
          // LOAD CONFIRMED PROCESSES
          // =================================================

          const confirmed =
            await getFacConfirmConfirmedProcesses(
              aufnrs,
              signal,
            )


          if (
            signal?.aborted
          ) {
            return
          }


          setConfirmedProcesses(
            confirmed,
          )


          setLastUpdated(
            new Date(),
          )


        } catch (
        requestError
        ) {

          // =================================================
          // ABORT
          // =================================================

          if (
            requestError instanceof DOMException
            && requestError.name === 'AbortError'
          ) {
            return
          }


          console.error(
            'Load Fac Confirm failed:',
            requestError,
          )


          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load Fac Confirm',
          )


        } finally {

          if (
            !signal?.aborted
          ) {
            setLoading(
              false,
            )
          }
        }
      },
      [
        div,
        expD,
        procGrp,
        page,
        pageSize,
        excelFilters,
      ],
    )


  // =========================================================
  // LOAD PROCESS GROUP SUMMARY
  // =========================================================

  const loadProcessGroups =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {

        setProcessGroupsLoading(
          true,
        )


        try {

          const result =
            await getFacConfirmProcessGroups(
              div,
              expD,
              signal,
            )


          if (
            signal?.aborted
          ) {
            return
          }


          setProcessGroups(
            result,
          )


        } catch (
        requestError
        ) {

          if (
            requestError instanceof DOMException
            && requestError.name === 'AbortError'
          ) {
            return
          }


          console.error(
            'Load process groups failed:',
            requestError,
          )


        } finally {

          if (
            !signal?.aborted
          ) {

            setProcessGroupsLoading(
              false,
            )
          }
        }
      },
      [
        div,
        expD,
      ],
    )


  // =========================================================
  // AUTO LOAD TABLE
  // =========================================================

  useEffect(
    () => {

      const controller =
        new AbortController()


      queueMicrotask(
        () => {

          if (
            !controller
              .signal
              .aborted
          ) {

            void loadData(
              controller.signal,
            )
          }
        },
      )


      return () =>
        controller.abort()

    },
    [
      loadData,
    ],
  )


  // =========================================================
  // AUTO LOAD PROCESS GROUPS
  // =========================================================

  useEffect(
    () => {

      const controller =
        new AbortController()


      queueMicrotask(
        () => {

          if (
            !controller
              .signal
              .aborted
          ) {

            void loadProcessGroups(
              controller.signal,
            )
          }
        },
      )


      return () =>
        controller.abort()

    },
    [
      loadProcessGroups,
    ],
  )


  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh =
    useCallback(
      () => {

        void loadData()

        void loadProcessGroups()

      },
      [
        loadData,
        loadProcessGroups,
      ],
    )


  // =========================================================
  // RETURN
  // =========================================================

  return {

    // rows đã merge ConfirmFnTime
    rows:
      displayRows,

    // giữ riêng để DataTable tô màu
    confirmedProcesses,

    processGroups,

    totalElements,

    loading,

    processGroupsLoading,

    error,

    lastUpdated,

    handleRefresh,
  }
}