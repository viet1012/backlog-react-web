import type { ReactNode } from 'react'
import { Box } from '@mui/material'

import { useI18n } from '../../../i18n/useI18n'
import { FactoryNoRowsOverlay } from '../FactoryNoRowsOverlay'
import { EmptyStateAction } from './EmptyStateAction'

/**
 * Trống VÌ BỘ LỌC (vd mở link cũ /backlog?q=4200002732 mà PO đó không còn):
 * nói rõ bộ lọc nào không khớp và luôn có nút "Xóa bộ lọc" để quay về dữ liệu.
 * Dùng làm noRowsOverlay của DataGrid hoặc thay cho cảnh trống của trang.
 */
interface FilteredEmptyStateProps {
  /** Mô tả bộ lọc đang bật, vd "Tìm: 4200002732 · Status: FINISHED" */
  summary?: string
  onClearFilters: () => void
  /** Nút thêm bên cạnh (vd "Về hôm nay") */
  extraAction?: ReactNode
  /** Tiêu đề / gợi ý riêng của trang (mặc định: "Không tìm thấy kết quả phù hợp") */
  title?: ReactNode
  hint?: ReactNode
  variant?: 'scene' | 'compact'
  minHeight?: number | string
}

export function FilteredEmptyState({
  summary,
  onClearFilters,
  extraAction,
  title,
  hint,
  variant,
  minHeight,
}: FilteredEmptyStateProps) {
  const { t } = useI18n()

  return (
    <FactoryNoRowsOverlay
      variant={variant}
      minHeight={minHeight}
      title={title ?? t.common.noMatchTitle}
      hint={hint ?? t.common.noMatchHint(summary ? `"${summary}"` : '')}
      action={(
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <EmptyStateAction onClearFilters={onClearFilters} />
          {extraAction}
        </Box>
      )}
    />
  )
}
