import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getAssistantInfo } from '../../services/assistantService'
import type { AssistantParams } from '../../services/assistantService'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import { MascotContext } from './mascotContext'
import type { MascotMonthControl, MascotStatus } from './mascotContext'

const NAME_KEY = 'mascot:name'
/** đang offline → tự kiểm tra lại sau mỗi khoảng này */
const OFFLINE_RETRY_MS = 30_000

function loadCachedName() {
  const stored = loadPreference(NAME_KEY)
  return typeof stored === 'string' && stored ? stored : null
}

export function MascotProvider({ children }: { children: ReactNode }) {
  // tên lần trước lưu ở localStorage → hiện ngay, không nháy tên mặc định rồi mới đổi
  const [name, setName] = useState<string | null>(loadCachedName)
  const [status, setStatus] = useState<MascotStatus>('loading')
  const [params, setParams] = useState<AssistantParams>({})
  const [monthControl, setMonthControlState] = useState<MascotMonthControl | null>(null)
  const [openChatSeq, setOpenChatSeq] = useState(0)
  const [elevated, setElevated] = useState(false)
  const infoAbort = useRef<AbortController | null>(null)

  // ổn định qua các render (trang đăng ký trong effect phụ thuộc hàm này);
  // bọc lại vì useState coi tham số là hàm thì gọi như updater
  const setMonthControl = useCallback(
    (control: MascotMonthControl | null) => setMonthControlState(() => control),
    [],
  )

  const openChat = useCallback(() => setOpenChatSeq((seq) => seq + 1), [])

  const fetchInfo = useCallback(() => {
    if (infoAbort.current) return // đang tải
    const controller = new AbortController()
    infoAbort.current = controller
    setStatus((prev) => (prev === 'offline' || prev === 'reconnecting' ? 'reconnecting' : 'loading'))
    getAssistantInfo(controller.signal)
      .then((info) => {
        if (info.name) {
          setName(info.name)
          savePreference(NAME_KEY, info.name)
        }
        setStatus('online')
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('offline')
      })
      .finally(() => {
        if (infoAbort.current === controller) infoAbort.current = null
      })
  }, [])

  const reportStatus = useCallback((next: 'online' | 'offline') => setStatus(next), [])

  useEffect(() => {
    fetchInfo()
    return () => {
      infoAbort.current?.abort()
      infoAbort.current = null
    }
  }, [fetchInfo])

  // offline → tự thử lại định kỳ và khi trình duyệt có mạng trở lại
  useEffect(() => {
    if (status !== 'offline') return
    const timer = window.setInterval(fetchInfo, OFFLINE_RETRY_MS)
    window.addEventListener('online', fetchInfo)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('online', fetchInfo)
    }
  }, [status, fetchInfo])

  const value = useMemo(
    () => ({
      name,
      status,
      retry: fetchInfo,
      reportStatus,
      params,
      setParams,
      monthControl,
      setMonthControl,
      openChatSeq,
      openChat,
      elevated,
      setElevated,
    }),
    [name, status, fetchInfo, reportStatus, params, monthControl, setMonthControl, openChatSeq, openChat, elevated],
  )

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
}
