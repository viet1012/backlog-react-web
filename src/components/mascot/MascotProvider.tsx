import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getAssistantInfo } from '../../services/assistantService'
import type { AssistantParams } from '../../services/assistantService'
import { MascotContext } from './mascotContext'
import type { MascotMonthControl } from './mascotContext'

export function MascotProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null)
  const [params, setParams] = useState<AssistantParams>({})
  const [monthControl, setMonthControlState] = useState<MascotMonthControl | null>(null)
  const [openChatSeq, setOpenChatSeq] = useState(0)
  const [elevated, setElevated] = useState(false)

  // ổn định qua các render (trang đăng ký trong effect phụ thuộc hàm này);
  // bọc lại vì useState coi tham số là hàm thì gọi như updater
  const setMonthControl = useCallback(
    (control: MascotMonthControl | null) => setMonthControlState(() => control),
    [],
  )

  const openChat = useCallback(() => setOpenChatSeq((seq) => seq + 1), [])

  // tên mascot lấy 1 lần khi mount; lỗi / không có tên → giữ null (dùng tên mặc định)
  useEffect(() => {
    const controller = new AbortController()
    getAssistantInfo(controller.signal)
      .then((info) => {
        if (info.name) setName(info.name)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const value = useMemo(
    () => ({ name, params, setParams, monthControl, setMonthControl, openChatSeq, openChat, elevated, setElevated }),
    [name, params, monthControl, setMonthControl, openChatSeq, openChat, elevated],
  )

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
}
