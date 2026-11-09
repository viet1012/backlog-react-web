import { createContext, useContext, useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { AssistantParams } from '../../services/assistantService'

/** Trang đăng ký để mascot đổi bộ lọc tháng (tháng dạng "YYYY.MM") */
export interface MascotMonthControl {
  /** tháng có trong bộ lọc của trang – lưu trong state nên panel tự vẽ lại khi đổi */
  months: string[]
  select: (month: string) => void
}

export interface MascotContextValue {
  /** tên mascot từ GET /api/assistant/info; null → đang tải / lỗi (dùng tên mặc định trong i18n) */
  name: string | null
  /** context của trang hiện tại gửi kèm câu hỏi (vd month, simuWeek) */
  params: AssistantParams
  setParams: (params: AssistantParams) => void
  /** null → trang hiện tại không cho đổi tháng */
  monthControl: MascotMonthControl | null
  setMonthControl: (control: MascotMonthControl | null) => void
  /** tăng mỗi lần trang yêu cầu mở chat (vd nút "Hỏi … về khung này") */
  openChatSeq: number
  openChat: () => void
  /** true: mascot nổi trên Drawer/Modal của MUI (đang mở drawer có nút hỏi mascot) */
  elevated: boolean
  setElevated: (elevated: boolean) => void
}

export const MascotContext = createContext<MascotContextValue>({
  name: null,
  params: {},
  setParams: () => {},
  monthControl: null,
  setMonthControl: () => {},
  openChatSeq: 0,
  openChat: () => {},
  elevated: false,
  setElevated: () => {},
})

/** Trả hàm mở chat của mascot (bỏ thu nhỏ nếu đang thu nhỏ) */
export function useMascotOpenChat() {
  return useContext(MascotContext).openChat
}

/** Khi active: mascot nổi trên Drawer để chat được trong lúc drawer mở; unmount → hạ lại */
export function useMascotElevated(active: boolean) {
  const { setElevated } = useContext(MascotContext)

  useEffect(() => {
    setElevated(active)
    return () => setElevated(false)
  }, [active, setElevated])
}

/** Tên mascot để truyền vào i18n: tên từ API, chưa có / lỗi → tên mặc định theo ngôn ngữ */
export function useMascotName() {
  const { name } = useContext(MascotContext)
  const { t } = useI18n()
  return name ?? t.mascot.defaultName
}

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
