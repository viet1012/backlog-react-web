import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import SearchRoundedIcon
  from '@mui/icons-material/SearchRounded'

import CloseRoundedIcon
  from '@mui/icons-material/CloseRounded'

import {
  GlassPanel,
} from '../common/GlassPanel'

import {
  ClearButton,
} from '../common/ClearButton'

import type {
  ReportFilters,
} from '../../services/reportService'
import type { Messages } from '../../i18n/messages/en'
import { useI18n } from '../../i18n/useI18n'


function getFilterLabels(
  t: Messages,
): Record<keyof ReportFilters, string> {
  return {
    search: t.common.search,
    status: t.columns.status,
    div: t.columns.division,
    currentProcess: t.backlog.process,
    shipBy: t.columns.shipBy,
    productionDate: t.columns.productionDate,
  }
}


interface BacklogSelectOptions {
  status: string[]
  div: string[]
  currentProcess: string[]
  shipBy: string[]
}


interface BacklogFilterBarProps {
  filters:
  ReportFilters

  options:
  BacklogSelectOptions

  excelFilterCount:
  number

  summaryFilter: {
    status: string
    date: string
  } | null

  loading:
  boolean

  onFilterChange:
  (
    name:
      keyof ReportFilters,

    value:
      string,
  ) => void

  onClear:
  () => void
}


const SELECT_FIELDS = [
  'status',
  'div',
  'currentProcess',
  'shipBy',
] as const


export function BacklogFilterBar({
  filters,
  options,
  excelFilterCount,
  summaryFilter,
  loading,
  onFilterChange,
  onClear,
}: BacklogFilterBarProps) {

  const { t } = useI18n()

  const labels = getFilterLabels(t)

  const activeFilters =
    (
      Object.entries(
        filters,
      ) as Array<
        [
          keyof ReportFilters,
          string,
        ]
      >
    ).filter(
      (
        [, value],
      ) =>
        value.trim() !== '',
    )


  const hasAnyFilter =
    activeFilters.length > 0
    || excelFilterCount > 0
    || summaryFilter != null


  return (
    <GlassPanel
      sx={{
        mb:
          0,

        p:
          1.25,
      }}
    >
      <Box
        sx={{
          display:
            'grid',

          gridTemplateColumns:
            'minmax(280px, 2fr) repeat(4, minmax(135px, 1fr)) minmax(155px, 1fr) auto',

          gap:
            1.25,

          alignItems:
            'center',
        }}
      >
        <TextField
          placeholder={t.backlog.searchPlaceholder}

          size="small"

          value={
            filters.search
          }

          onChange={
            (
              event,
            ) =>
              onFilterChange(
                'search',
                event.target.value,
              )
          }

          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment
                  position="start"
                >
                  <SearchRoundedIcon
                    sx={{
                      fontSize:
                        19,
                    }}
                  />
                </InputAdornment>
              ),

              endAdornment:
                filters.search
                  ? (
                    <InputAdornment
                      position="end"
                    >
                      <IconButton
                        size="small"

                        onClick={
                          () =>
                            onFilterChange(
                              'search',
                              '',
                            )
                        }
                      >
                        <CloseRoundedIcon
                          sx={{
                            fontSize:
                              17,
                          }}
                        />
                      </IconButton>
                    </InputAdornment>
                  )
                  : null,
            },
          }}
        />


        {SELECT_FIELDS.map(
          (
            name,
          ) => (

            <FormControl
              key={
                name
              }

              size="small"

              disabled={
                loading
              }
            >
              <InputLabel
                id={`${name}-filter-label`}
              >
                {labels[name]}
              </InputLabel>


              <Select
                labelId={
                  `${name}-filter-label`
                }

                label={
                  labels[name]
                }

                value={
                  filters[name]
                }

                onChange={
                  (
                    event,
                  ) =>
                    onFilterChange(
                      name,
                      event.target.value,
                    )
                }
              >
                <MenuItem value="">
                  {t.common.all}
                </MenuItem>


                {options[
                  name
                ].map(
                  (
                    option,
                  ) => (

                    <MenuItem
                      key={
                        option
                      }

                      value={
                        option
                      }
                    >
                      {option || '(Blank)'}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>
          ),
        )}


        <TextField
          label={t.columns.productionDate}

          type="date"

          size="small"

          value={
            filters.productionDate
          }

          onChange={
            (
              event,
            ) =>
              onFilterChange(
                'productionDate',
                event.target.value,
              )
          }

          slotProps={{
            inputLabel: {
              shrink:
                true,
            },
          }}
        />


        <ClearButton
          disabled={
            !hasAnyFilter
          }

          onClick={
            onClear
          }
        />
      </Box>


      {hasAnyFilter && (

        <Stack
          direction="row"

          spacing={
            1
          }

          useFlexGap

          sx={{
            mt:
              1.25,

            alignItems:
              'center',

            flexWrap:
              'wrap',
          }}
        >
          <Typography
            variant="caption"

            color="text.secondary"
          >
            {t.backlog.activeFilters}
          </Typography>


          {activeFilters.map(
            (
              [name, value],
            ) => (

              <Chip
                key={
                  name
                }

                size="small"

                label={
                  `${labels[name]}: ${value}`
                }

                onDelete={
                  () =>
                    onFilterChange(
                      name,
                      '',
                    )
                }
              />
            ),
          )}


          {summaryFilter && (
            <>
              <Chip
                size="small"

                variant="outlined"

                label={`${t.columns.status}: ${summaryFilter.status}`}
              />

              <Chip
                size="small"

                variant="outlined"

                label={`${t.columns.exportDate}: ${summaryFilter.date}`}
              />
            </>
          )}


          {excelFilterCount > 0 && (

            <Chip
              size="small"

              variant="outlined"

              label={
                t.backlog.columnFilters(excelFilterCount)
              }
            />
          )}


          <ClearButton
            mode="clearAll"

            onClick={
              onClear
            }
          />
        </Stack>
      )}
    </GlassPanel>
  )
}
