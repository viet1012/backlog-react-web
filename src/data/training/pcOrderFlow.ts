import type { OrderFlowNode } from '../../types/pcTraining'

export const primaryOrderFlow: OrderFlowNode[] = [
  { id: 'lot', label: 'LOT', caption: 'Một LOT chỉ tạo một 41*' },
  { id: '41', label: '41*', caption: 'Đơn hàng gia công' },
  { id: '101', label: '101*', caption: 'Số PIER' },
  { id: '52', label: '52*', caption: 'Một hoặc nhiều MNF theo MaxLot' },
]

export const replacementBranch: OrderFlowNode = {
  id: '42', label: '42*', caption: 'Đơn hàng bù Nocom',
}

export const TODO_SOURCE_CONFIRMATION = [
  '62*/82*: xuất hiện trong dữ liệu Manufa — cần xác nhận định nghĩa.',
] as const
