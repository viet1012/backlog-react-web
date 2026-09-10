import type {
  OdbfSummaryItem,
  OdbfSummaryMetric,
} from '../types/odbf'

export type OdbfDataRowType = 'completed' | 'progress'

export interface OdbfDateValue {
  completed: number
  progress: number
  ratio: number | null
}

export interface OdbfProductSummary {
  productGrp: string
  values: Map<string, OdbfDateValue>
}

export interface OdbfMatrix {
  dates: string[]
  products: OdbfProductSummary[]
}

const COMPLETED_STATUS = 'OK'
const ON_PROGRESS_STATUS = 'LATE'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function normalizeOdbfDateKey(value: string): string {
  return value.slice(0, 10)
}

export function formatOdbfDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  const monthLabel = MONTH_LABELS[Number(month) - 1]

  if (!monthLabel || !day) {
    return dateKey
  }

  return `${Number(day)}-${monthLabel}`
}

function getStatusType(
  status2: string,
): OdbfDataRowType | null {
  const normalizedStatus =
    status2.trim().toUpperCase()

  if (normalizedStatus === COMPLETED_STATUS) {
    return 'completed'
  }

  if (normalizedStatus === ON_PROGRESS_STATUS) {
    return 'progress'
  }

  return null
}

export function buildOdbfMatrix(
  items: OdbfSummaryItem[],
  metric: OdbfSummaryMetric,
): OdbfMatrix {
  const dateKeys = new Set<string>()
  const productsByName =
    new Map<string, OdbfProductSummary>()

  for (const item of items) {
    const statusType =
      getStatusType(item.status2)

    if (!statusType) {
      continue
    }

    const dateKey =
      normalizeOdbfDateKey(item.exportD)

    dateKeys.add(dateKey)

    let product =
      productsByName.get(item.productGrp)

    if (!product) {
      product = {
        productGrp: item.productGrp,
        values: new Map(),
      }

      productsByName.set(
        item.productGrp,
        product,
      )
    }

    let dateValue =
      product.values.get(dateKey)

    if (!dateValue) {
      dateValue = {
        completed: 0,
        progress: 0,
        ratio: null,
      }

      product.values.set(
        dateKey,
        dateValue,
      )
    }

    dateValue[statusType] +=
      item[metric]

    // =========================================
    // Ratio lấy trực tiếp từ API
    // =========================================

    dateValue.ratio =
      metric === 'countPo'
        ? item.poRatio
        : item.qtyRatio
  }

  return {
    dates: [...dateKeys].sort(
      (left, right) =>
        left.localeCompare(right),
    ),

    products: [
      ...productsByName.values(),
    ].sort(
      (left, right) =>
        left.productGrp.localeCompare(
          right.productGrp,
        ),
    ),
  }
}