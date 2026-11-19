import {
  Chip,
  Stack,
  Typography,
} from '@mui/material'

import {
  FilterBar,
  FilterDate,
  FilterSearch,
  FilterSelect,
} from '../common/filterBar'

import type {
  ReportFilters,
} from '../../services/reportService'
import { useI18n } from '../../i18n/useI18n'
import { getBacklogFilterLabels } from './backlogFilterLabels'

// Chờ ngừng gõ rồi mới lọc (trước đây mỗi phím gõ là một lần gọi API)
const SEARCH_DEBOUNCE_MS = 300


interface BacklogSelectOptions {
  status: string[]
  div: string[]
  currentProcess: string[]
  shipBy: string[]
}


interface BacklogFilterBarProps {
  filters: ReportFilters

  options: BacklogSelectOptions

  excelFilterCount: number

  summaryFilter: {
    status: string
    date: string
  } | null

  loading: boolean

  onFilterChange: (
    name: keyof ReportFilters,
    value: string,
  ) => void

  onClear: () => void
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

  const labels = getBacklogFilterLabels(t)

  const activeFilters =
    (
      Object.entries(filters) as Array<[keyof ReportFilters, string]>
    ).filter(
      ([, value]) => value.trim() !== '',
    )

  // ô Summary đang chọn tính là 1 bộ lọc (Status + ngày xuất)
  const activeCount =
    activeFilters.length
    + excelFilterCount
    + (summaryFilter ? 1 : 0)

  return (
    <FilterBar
      activeCount={activeCount}
      onClear={onClear}
      footer={activeCount > 0 && (
        // chip từng bộ lọc: bỏ riêng từng cái
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {t.backlog.activeFilters}
          </Typography>

          {activeFilters.map(([name, value]) => (
            <Chip
              key={name}
              size="small"
              label={`${labels[name]}: ${value}`}
              onDelete={() => onFilterChange(name, '')}
            />
          ))}

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
              label={t.backlog.columnFilters(excelFilterCount)}
            />
          )}
        </Stack>
      )}
    >
      <FilterSearch
        placeholder={t.backlog.searchPlaceholder}
        value={filters.search}
        debounceMs={SEARCH_DEBOUNCE_MS}
        width={{ sm: 280 }}
        onChange={(value) => onFilterChange('search', value)}
      />

      {SELECT_FIELDS.map((name) => (
        <FilterSelect
          key={name}
          label={labels[name]}
          value={filters[name]}
          options={
            // giá trị đang chọn (vd từ link) luôn có trong danh sách,
            // kể cả khi danh sách gợi ý chưa tải xong
            filters[name] && !options[name].includes(filters[name])
              ? [filters[name], ...options[name]]
              : options[name]
          }
          allOption
          blankLabel="(Blank)"
          disabled={loading}
          width={{ sm: 140 }}
          onChange={(value) => onFilterChange(name, value)}
        />
      ))}

      <FilterDate
        label={t.columns.productionDate}
        value={filters.productionDate}
        width={{ sm: 160 }}
        onChange={(value) => onFilterChange('productionDate', value)}
      />
    </FilterBar>
  )
}
