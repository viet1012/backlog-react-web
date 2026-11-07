import { createContext, useContext, useEffect, useRef } from 'react'
import type { AssistantParams } from '../../services/assistantService'

/** Trang đăng ký để mascot đổi bộ lọc tháng (tháng dạng "YYYY.MM") */
export interface MascotMonthControl {
  /** tháng có trong bộ lọc của trang – lưu trong state nên panel tự vẽ lại khi đổi */
  months: string[]
  select: (month: string) => void
}

export interface MascotContextValue {
  /** context của trang hiện tại gửi kèm câu hỏi (vd month, simuWeek) */
  params: AssistantParams
  setParams: (params: AssistantParams) => void
  /** null → trang hiện tại không cho đổi tháng */
  monthControl: MascotMonthControl | null
  setMonthControl: (control: MascotMonthControl | null) => void
}

export const MascotContext = createContext<MascotContextValue>({
  params: {},
  setParams: () => {},
  monthControl: null,
  setMonthControl: () => {},
})

export function useMascotContext() {
  return useContext(MascotContext)
}

/**
 * Trang gọi để đưa params cho mascot; rời trang (unmount) thì tự xóa về {}.
 * So sánh theo nội dung (JSON) nên truyền object literal mỗi render không gây vòng lặp.
 */
export function useMascotParams(params: AssistantParams) {
  const { setParams } = useContext(MascotContext)
  const key = JSON.stringify(params)

  useEffect(() => {
    setParams(JSON.parse(key) as AssistantParams)
    return () => setParams({})
  }, [key, setParams])
}

/**
 * Trang đăng ký danh sách tháng + hàm đổi tháng cho mascot (nút "Xem tháng … trên màn hình");
 * unmount thì gỡ. Danh sách so theo nội dung → chỉ cập nhật state khi trang có danh sách mới;
 * select đọc qua ref nên truyền closure mới mỗi render không làm đăng ký lại.
 */
export function useMascotMonthControl({ months, select }: MascotMonthControl) {
  const { setMonthControl } = useContext(MascotContext)
  const selectRef = useRef(select)
  const monthsKey = JSON.stringify(months)

  useEffect(() => {
    selectRef.current = select
  })

  useEffect(() => {
    setMonthControl({
      months: JSON.parse(monthsKey) as string[],
      select: (month) => selectRef.current(month),
    })
  }, [monthsKey, setMonthControl])

  useEffect(() => () => setMonthControl(null), [setMonthControl])
}
