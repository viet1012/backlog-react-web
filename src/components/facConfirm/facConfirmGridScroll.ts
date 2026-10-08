import type {
  GridApi,
} from '@mui/x-data-grid'


// =========================================================
// CUỘN NGANG TỚI CỤM CỘT
//
// Dùng chung cho tour (Bước 9) và khi đổi công đoạn.
// - Cụm vừa màn hình: cuộn để cả cụm hiện ra.
// - Cụm rộng hơn màn hình: cuộn tới cột đầu.
// =========================================================

interface ScrollToFieldsOptions {
  // Chỉ cuộn khi cụm cột đang (một phần) nằm ngoài vùng nhìn thấy
  onlyIfHidden?: boolean

  behavior?: ScrollBehavior
}

const EDGE_PADDING = 24

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export function scrollToFieldCluster(
  api: GridApi,
  fields: readonly string[],
  {
    onlyIfHidden = false,
    behavior = 'auto',
  }: ScrollToFieldsOptions = {},
): void {

  const scroller =
    api.rootElementRef?.current?.querySelector<HTMLElement>(
      '.MuiDataGrid-virtualScroller',
    )

  if (!scroller) {
    return
  }

  const ranges = fields
    .map((field) => {
      const column = api.getColumn(field)

      if (
        !column
        || api.getColumnIndex(field, true) < 0
      ) {
        return null
      }

      const left = api.getColumnPosition(field)

      return {
        left,
        right: left + (column.computedWidth ?? column.width ?? 0),
      }
    })
    .filter((range): range is { left: number, right: number } => range != null)

  if (ranges.length === 0) {
    return
  }

  const clusterLeft = Math.min(...ranges.map((range) => range.left))
  const clusterRight = Math.max(...ranges.map((range) => range.right))

  const viewLeft = scroller.scrollLeft
  const viewRight = viewLeft + scroller.clientWidth

  if (
    onlyIfHidden
    && clusterLeft >= viewLeft
    && clusterRight <= viewRight
  ) {
    return
  }

  const fitsInView =
    clusterRight - clusterLeft + EDGE_PADDING * 2 <= scroller.clientWidth

  // Vừa màn hình: canh sao cho cụm hiện trọn, ưu tiên ít cuộn nhất
  const nextLeft = fitsInView
    ? clusterLeft < viewLeft
      ? clusterLeft - EDGE_PADDING
      : clusterRight + EDGE_PADDING - scroller.clientWidth
    : clusterLeft - EDGE_PADDING

  scroller.scrollTo({
    left: Math.max(0, nextLeft),
    behavior: prefersReducedMotion() ? 'auto' : behavior,
  })
}
