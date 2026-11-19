import { urlParam, type UrlParams } from '../../hooks/useUrlFilters'
import type {
  FacConfirmClassify,
  FacConfirmHeatType,
  FacConfirmProcessGroup,
} from '../../types/facConfirm'

// =========================================================
// BỘ LỌC FAC CONFIRM: danh sách giá trị + tham số URL
// =========================================================

export const FAC_CONFIRM_PATH = '/fac-confirm'

export const FAC_CONFIRM_DIVS = [
  { value: 'PR', label: 'PRESS' },
  { value: 'PR-RET', label: 'PRESS Retainer' },
  { value: 'MO', label: 'MOLD' },
  { value: 'GU', label: 'GUIDE' },
] as const

const DIV_VALUES = FAC_CONFIRM_DIVS.map((div) => div.value)

const PROCESS_GROUPS: readonly FacConfirmProcessGroup[] = ['Rough', 'Heat', 'Fine']

const CLASSIFY_VALUES: readonly FacConfirmClassify[] = ['Sale', 'Stock']

export const ALL_CLASSIFY: FacConfirmClassify[] = ['Sale', 'Stock']

const HEAT_TYPES: readonly FacConfirmHeatType[] = ['All', 'Normal', 'DC53', 'TD', 'Molypden']

// Heat Type theo Division
export function getHeatTypeOptions(div: string): FacConfirmHeatType[] {
  switch (div) {
    case 'MO':
      return ['All']

    case 'GU':
      return ['All', 'Normal', 'Molypden']

    case 'PR':
    case 'PR-RET':
    default:
      return ['All', 'Normal', 'DC53', 'TD']
  }
}

// Heat Type không có ở Division mới -> All
export function normalizeHeatType(div: string, heatType: FacConfirmHeatType): FacConfirmHeatType {
  return getHeatTypeOptions(div).includes(heatType) ? heatType : 'All'
}

export interface FacConfirmUrlFilters {
  div: string
  expD: string
  procGrp: FacConfirmProcessGroup
  classify: FacConfirmClassify[]
  heatType: FacConfirmHeatType
  search: string
}

// ?div=PR&expD=2026-11-19&procGrp=Rough[&classify=Sale][&heat=DC53][&q=…]
// Division / ngày / công đoạn luôn có trên link => người nhận mở đúng màn hình
// (không phụ thuộc Division họ đã chọn lần trước)
export const FAC_CONFIRM_URL_PARAMS: UrlParams<FacConfirmUrlFilters> = {
  div: urlParam.oneOf<string>('div', DIV_VALUES),
  expD: urlParam.date('expD'),
  procGrp: urlParam.oneOf('procGrp', PROCESS_GROUPS),
  classify: urlParam.list('classify', CLASSIFY_VALUES, ALL_CLASSIFY),
  heatType: urlParam.oneOf('heat', HEAT_TYPES, 'All'),
  search: urlParam.text('q'),
}
