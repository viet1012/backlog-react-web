import { Box } from '@mui/material'

import type {
  FacConfirmClassify,
  FacConfirmHeatType,
  FacConfirmProcessGroup,
  FacConfirmProcessGroupSummary,
} from '../../types/facConfirm'

import {
  FilterBar,
  FilterDate,
  FilterSearch,
  FilterSelect,
} from '../common/filterBar'
import { FacConfirmClassifyControl } from './FacConfirmClassifyControl'
import { FacConfirmProcessGroupStrip } from './FacConfirmProcessGroupStrip'
import { FAC_CONFIRM_DIVS, getHeatTypeOptions } from './facConfirmFilters'
import { useI18n } from '../../i18n/useI18n'

// Chờ người dùng ngừng gõ rồi mới gọi API
const SEARCH_DEBOUNCE_MS = 300

interface FacConfirmFilterBarProps {
  div: string
  expD: string
  procGrp: FacConfirmProcessGroup
  classify: FacConfirmClassify[]
  heatType: FacConfirmHeatType
  search: string
  processGroups: FacConfirmProcessGroupSummary[]
  loading: boolean

  // Đang tải số liệu thẻ công đoạn
  summaryLoading: boolean

  // Số bộ lọc đang bật (tìm, loại hàng, Heat Type, lọc cột) + xóa hết
  activeCount: number
  onClear: () => void

  onDivChange: (value: string) => void
  onDateChange: (value: string) => void
  onProcessGroupChange: (
    value: FacConfirmProcessGroup
  ) => void
  onClassifyChange: (
    value: FacConfirmClassify[]
  ) => void
  onHeatTypeChange: (
    value: FacConfirmHeatType
  ) => void
  // Đã debounce
  onSearchChange: (value: string) => void
}

export function FacConfirmFilterBar({
  div,
  expD,
  procGrp,
  classify,
  heatType,
  search,
  processGroups,
  loading,
  summaryLoading,
  activeCount,
  onClear,
  onDivChange,
  onDateChange,
  onProcessGroupChange,
  onClassifyChange,
  onHeatTypeChange,
  onSearchChange,
}: FacConfirmFilterBarProps) {

  const { t } = useI18n()

  return (
    // compact: thanh này đã chật vì dải công đoạn – không lọc thì bố cục y như cũ,
    // có lọc thì chỉ thêm 1 nút icon nhỏ
    <FilterBar
      compact
      activeCount={activeCount}
      onClear={onClear}
    >
      <FilterSelect
        tour="fac-div"
        label={t.columns.division}
        value={div}
        options={FAC_CONFIRM_DIVS}
        disabled={loading}
        width={{ sm: 125 }}
        onChange={onDivChange}
      />

      <FilterDate
        tour="fac-date"
        label={t.columns.exportDate}
        value={expD}
        disabled={loading}
        width={{ sm: 158 }}
        onChange={onDateChange}
      />

      <Box
        data-tour="fac-classify"
        sx={{
          display: 'flex',
          flexShrink: 0,
        }}
      >
        <FacConfirmClassifyControl
          value={classify}
          disabled={loading}
          onChange={onClassifyChange}
        />
      </Box>

      <FilterSelect<FacConfirmHeatType>
        tour="fac-heat"
        label={t.facConfirm.heatType}
        value={heatType}
        options={getHeatTypeOptions(div)}
        disabled={loading}
        onChange={onHeatTypeChange}
      />

      <FilterSearch
        tour="fac-search"
        placeholder={t.facConfirm.searchPlaceholder}
        value={search}
        debounceMs={SEARCH_DEBOUNCE_MS}
        onChange={onSearchChange}
      />

      <Box
        data-tour="fac-procgrp"
        sx={{
          display: 'flex',
          flex: '1 1 420px',
          minWidth: 0,
        }}
      >
        <FacConfirmProcessGroupStrip
          value={procGrp}
          items={processGroups}
          loading={summaryLoading}
          onChange={onProcessGroupChange}
        />
      </Box>
    </FilterBar>
  )
}
