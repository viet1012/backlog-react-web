import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getAssistantInfo } from '../../services/assistantService'
import type { AssistantParams } from '../../services/assistantService'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import { MascotContext } from './mascotContext'
import type { MascotMonthControl, MascotStatus } from './mascotContext'
import { DEFAULT_SKIN, normalizeSkin } from './mascotSkin'
import type { MascotSkin } from './mascotSkin'

const NAME_KEY = 'mascot:name'
const SKIN_KEY = 'mascot:skin'
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
  // skin lần trước lưu ở localStorage → hiện đúng trang phục ngay, không nháy skin mặc định
  const [skin, setSkin] = useState<MascotSkin>(() => {
    const stored = loadPreference(SKIN_KEY)
    return stored ? normalizeSkin(stored) : DEFAULT_SKIN
  })

  const applySkin = useCallback((next: MascotSkin) => {
    setSkin(next)
    savePreference(SKIN_KEY, next)
  }, [])
  // offline → mốc thời gian (ms) tự gọi lại, để UI hiện đếm ngược
  const [nextRetryAt, setNextRetryAt] = useState<number | null>(null)
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

  const goOffline = useCallback(() => {
    setStatus('offline')
    setNextRetryAt(Date.now() + OFFLINE_RETRY_MS)
  }, [])

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
        if (info.skin) applySkin(info.skin)
        setStatus('online')
      })
      .catch(() => {
        if (!controller.signal.aborted) goOffline()
      })
      .finally(() => {
        if (infoAbort.current === controller) infoAbort.current = null
      })
  }, [goOffline, applySkin])

  const reportStatus = useCallback((next: 'online' | 'offline') => {
    if (next === 'offline') goOffline()
    else setStatus('online')
  }, [goOffline])

  useEffect(() => {
    fetchInfo()
    return () => {
      infoAbort.current?.abort()
      infoAbort.current = null
    }
  }, [fetchInfo])

  // offline → tự thử lại đúng mốc nextRetryAt (mỗi lần lỗi lại đặt mốc mới) và khi trình duyệt có mạng trở lại
  useEffect(() => {
    if (status !== 'offline' || nextRetryAt === null) return
    const timer = window.setTimeout(fetchInfo, Math.max(0, nextRetryAt - Date.now()))
    window.addEventListener('online', fetchInfo)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('online', fetchInfo)
    }
  }, [status, nextRetryAt, fetchInfo])

  const value = useMemo(
    () => ({
      name,
      status,
      skin,
      applySkin,
      nextRetryAt: status === 'offline' ? nextRetryAt : null,
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
    [name, status, skin, applySkin, nextRetryAt, fetchInfo, reportStatus, params, monthControl, setMonthControl, openChatSeq, openChat, elevated],
  )

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
}
