import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AssistantParams } from '../../services/assistantService'
import { MascotContext } from './mascotContext'
import type { MascotMonthControl } from './mascotContext'

export function MascotProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<AssistantParams>({})
  const [monthControl, setMonthControlState] = useState<MascotMonthControl | null>(null)

  // ổn định qua các render (trang đăng ký trong effect phụ thuộc hàm này);
  // bọc lại vì useState coi tham số là hàm thì gọi như updater
  const setMonthControl = useCallback(
    (control: MascotMonthControl | null) => setMonthControlState(() => control),
    [],
  )

  const value = useMemo(
    () => ({ params, setParams, monthControl, setMonthControl }),
    [params, monthControl, setMonthControl],
  )

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
}
