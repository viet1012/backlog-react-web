import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { BUILTIN_CASES, CORE_SUITE_ID, withSuite } from '../components/aiLogs/aiTestSuiteRegistry'
import { isCaseLike, isCostScreen, normalizeCase } from '../components/aiLogs/aiTestUtils'
import { useI18n } from '../i18n/useI18n'
import {
  AssistantApiError,
  postAssistantChat,
  type AssistantParams,
} from '../services/assistantService'
import {
  type AiTestCase,
  type AiTestRun,
  type AiTestRunConfig,
  type AiTestSuiteFile,
  type AiTestSuiteState,
  type AiTestVerdict,
} from '../types/aiTestSuite'

// =========================================================
// Bộ test trợ lý AI – lưu localStorage của trình duyệt (chưa có API BE)
// =========================================================

// giữ nguyên key khi thêm screenKey – migrate tại chỗ để không mất dữ liệu cũ
const STORAGE_KEY = 'aiTestSuite.v1'

// dạng lưu localStorage: state + id các câu dựng sẵn đã từng nạp
// (câu dựng sẵn mới – file JSON mới trong src/data/aiTestSuites – được tự thêm; câu đã xóa không quay lại)
interface StoredState extends AiTestSuiteState {
  seenBuiltin?: string[]
}

const BUILTIN_IDS = BUILTIN_CASES.map((c) => c.id)

interface LoadResult {
  state: AiTestSuiteState
  // số câu dựng sẵn mới được tự thêm lúc mở
  autoAdded: number
}

function loadState(): LoadResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>
      if (Array.isArray(parsed.cases)) {
        const cases = parsed.cases.filter(isCaseLike).map(normalizeCase).map(withSuite)
        const existing = new Set(cases.map((c) => c.id))
        // dữ liệu cũ chưa có seenBuiltin → coi bộ Cơ bản là đã nạp (giữ nguyên câu người dùng đã xóa)
        const seen = new Set(parsed.seenBuiltin ?? BUILTIN_CASES.filter((c) => c.suite === CORE_SUITE_ID).map((c) => c.id))
        const added = BUILTIN_CASES.filter((c) => !seen.has(c.id) && !existing.has(c.id))
        return { state: { cases: [...cases, ...added], runs: parsed.runs ?? {} }, autoAdded: added.length }
      }
    }
  } catch {
    // localStorage bị chặn / JSON hỏng → dùng mặc định
  }
  return { state: { cases: BUILTIN_CASES, runs: {} }, autoAdded: 0 }
}

function saveState(state: AiTestSuiteState) {
  try {
    const stored: StoredState = { ...state, seenBuiltin: BUILTIN_IDS }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // hết quota / bị chặn → chỉ giữ trong phiên
  }
}

export function newCaseId() {
  return `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// Lỗi định dạng → ném Error
export function parseSuiteFile(text: string): AiTestSuiteState {
  const data = JSON.parse(text) as Partial<AiTestSuiteFile> | unknown[]
  const list: unknown = Array.isArray(data) ? data : data.cases
  if (!Array.isArray(list) || !list.every(isCaseLike)) throw new Error('Invalid test suite file')

  const cases = list.map(normalizeCase).map(withSuite)
  const runs = !Array.isArray(data) && data.runs ? data.runs : {}
  return { cases, runs }
}

function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function buildParams(testCase: AiTestCase, config: AiTestRunConfig): AssistantParams {
  // simuWeek / drawer (factory + category) chỉ có ở Cost Monitoring; màn hình khác chỉ gửi month
  const cost = isCostScreen(testCase.screenKey)
  return {
    month: config.month || null,
    // '' = mới nhất → không gửi key simuWeek (giống CostMonitoringPage)
    ...(cost && config.simuWeek ? { simuWeek: config.simuWeek } : {}),
    ...(cost && testCase.drawer ? { factory: testCase.drawer.div, category: testCase.drawer.cost } : {}),
  }
}

// =========================================================
// Chống RATE_LIMITED – BE (AssistantRateLimiter): fixed window 10 request / 60 s theo IP
// 1. Giãn nhịp phía client: cửa sổ trượt ≤ perMinute request / 60 s (+ biên độ trễ mạng)
//    → mọi fixed window 60 s của BE cũng ≤ perMinute
// 2. Vẫn dính 429 (mascot / người khác cùng IP) → đợi Retry-After (thiếu → 60 s) rồi thử lại
// 3. 503 LLM_BUSY (vượt maxConcurrent) → đợi tăng dần rồi thử lại
// =========================================================

const WINDOW_MS = 60_000
const WINDOW_MARGIN_MS = 1_500
export const DEFAULT_PER_MINUTE = 8
export const MAX_PER_MINUTE = 10
const MAX_RETRIES = 2
const RATE_LIMIT_FALLBACK_SEC = 60
const BUSY_WAIT_MS = 10_000

export type AiTestWaitReason = 'throttle' | 'rateLimited' | 'busy'

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const done = () => {
      window.clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    const timer = window.setTimeout(done, ms)
    signal.addEventListener('abort', done)
  })
}

// ms cần đợi để gửi thêm 1 request mà không vượt perMinute; bỏ mốc đã ra khỏi cửa sổ
function throttleDelay(sentAt: number[], perMinute: number, now: number) {
  const span = WINDOW_MS + WINDOW_MARGIN_MS
  while (sentAt.length > 0 && now - sentAt[0] >= span) sentAt.shift()
  if (sentAt.length < perMinute) return 0
  return sentAt[sentAt.length - perMinute] + span - now
}

// null = bị hủy
async function runCase(
  testCase: AiTestCase,
  config: AiTestRunConfig,
  previousNote: string,
  lang: string,
  signal: AbortSignal,
): Promise<{ run: AiTestRun; retryAfterSec?: number } | null> {
  const start = performance.now()
  const base = {
    caseId: testCase.id,
    at: new Date().toISOString(),
    verdict: null,
    note: previousNote,
  }

  try {
    const res = await postAssistantChat(
      {
        screenKey: testCase.screenKey,
        params: buildParams(testCase, config),
        question: testCase.question,
        history: [],
        lang,
      },
      signal,
    )
    return {
      run: {
        ...base,
        ok: true,
        answer: res.answer,
        sources: res.sources,
        errorCode: null,
        errorMessage: null,
        ms: Math.round(performance.now() - start),
      },
    }
  } catch (err) {
    if (signal.aborted) return null
    const apiError = err instanceof AssistantApiError ? err : null
    return {
      run: {
        ...base,
        ok: false,
        answer: null,
        sources: [],
        errorCode: apiError?.code ?? 'INTERNAL',
        errorMessage: apiError?.detail.message ?? (err instanceof Error ? err.message : String(err)),
        ms: Math.round(performance.now() - start),
      },
      retryAfterSec: apiError?.detail.retryAfterSec,
    }
  }
}

export interface AiTestProgress {
  currentId: string | null
  queued: string[]
  done: number
  total: number
  // đang đợi trước khi gửi (giãn nhịp / 429 / 503); null = đang gọi API
  wait: { until: number; reason: AiTestWaitReason } | null
  // lần thử lại thứ mấy của câu hiện tại (0 = lần đầu)
  attempt: number
}

export function useAiTestSuite() {
  const { language } = useI18n()
  const [initial] = useState(loadState)
  const [state, setState] = useState<AiTestSuiteState>(initial.state)
  const [config, setConfig] = useState<AiTestRunConfig>(() => ({
    month: dayjs().format('YYYY-MM'),
    simuWeek: '',
    perMinute: DEFAULT_PER_MINUTE,
  }))
  const [progress, setProgress] = useState<AiTestProgress | null>(null)

  // vòng chạy async đọc bản mới nhất (case bị sửa / xóa giữa chừng)
  const stateRef = useRef(state)
  const abortRef = useRef<AbortController | null>(null)
  // mốc gửi request gần đây – giữ qua nhiều lượt chạy để bấm "Chạy" liên tục vẫn giãn nhịp
  const sentAtRef = useRef<number[]>([])

  useEffect(() => {
    stateRef.current = state
    saveState(state)
  }, [state])

  // rời trang → hủy lượt chạy đang dở
  useEffect(() => () => abortRef.current?.abort(), [])

  function saveCase(testCase: AiTestCase) {
    setState((prev) => {
      const exists = prev.cases.some((c) => c.id === testCase.id)
      return {
        ...prev,
        cases: exists
          ? prev.cases.map((c) => (c.id === testCase.id ? testCase : c))
          : [...prev.cases, testCase],
      }
    })
  }

  function deleteCase(id: string) {
    setState((prev) => {
      const runs = { ...prev.runs }
      delete runs[id]
      return { cases: prev.cases.filter((c) => c.id !== id), runs }
    })
  }

  function updateRun(id: string, patch: Partial<Pick<AiTestRun, 'verdict' | 'note'>>) {
    setState((prev) => {
      const run = prev.runs[id]
      return run ? { ...prev, runs: { ...prev.runs, [id]: { ...run, ...patch } } } : prev
    })
  }

  function setVerdict(id: string, verdict: AiTestVerdict | null) {
    updateRun(id, { verdict })
  }

  function setNote(id: string, note: string) {
    updateRun(id, { note })
  }

  // chạy tuần tự (tránh LLM_BUSY) + giãn nhịp / thử lại (tránh RATE_LIMITED)
  async function run(ids: string[]) {
    if (abortRef.current || ids.length === 0) return
    const controller = new AbortController()
    const { signal } = controller
    abortRef.current = controller
    const perMinute = Math.min(Math.max(1, Math.round(config.perMinute) || DEFAULT_PER_MINUTE), MAX_PER_MINUTE)

    async function wait(ms: number, reason: AiTestWaitReason) {
      if (ms <= 0) return
      setProgress((p) => p && { ...p, wait: { until: Date.now() + ms, reason } })
      await sleep(ms, signal)
      setProgress((p) => p && { ...p, wait: null })
    }

    try {
      for (let i = 0; i < ids.length; i++) {
        if (signal.aborted) break
        const testCase = stateRef.current.cases.find((c) => c.id === ids[i])
        if (!testCase) continue

        setProgress({
          currentId: testCase.id,
          queued: ids.slice(i + 1),
          done: i,
          total: ids.length,
          wait: null,
          attempt: 0,
        })

        let result: AiTestRun | null = null
        for (let attempt = 0; ; attempt++) {
          await wait(throttleDelay(sentAtRef.current, perMinute, Date.now()), 'throttle')
          if (signal.aborted) break

          sentAtRef.current.push(Date.now())
          setProgress((p) => p && { ...p, attempt })
          const outcome = await runCase(
            testCase,
            config,
            stateRef.current.runs[testCase.id]?.note ?? '',
            language,
            signal,
          )
          if (!outcome) break

          const code = outcome.run.errorCode
          if ((code !== 'RATE_LIMITED' && code !== 'LLM_BUSY') || attempt >= MAX_RETRIES) {
            result = outcome.run
            break
          }

          if (code === 'RATE_LIMITED') {
            await wait((outcome.retryAfterSec ?? RATE_LIMIT_FALLBACK_SEC) * 1000 + WINDOW_MARGIN_MS, 'rateLimited')
          } else {
            await wait(BUSY_WAIT_MS * (attempt + 1), 'busy')
          }
        }

        if (!result) break
        const finished = result
        setState((prev) => ({ ...prev, runs: { ...prev.runs, [testCase.id]: finished } }))
      }
    } finally {
      abortRef.current = null
      setProgress(null)
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  function clearRuns() {
    setState((prev) => ({ ...prev, runs: {} }))
  }

  function resetToDefaults() {
    setState({ cases: BUILTIN_CASES, runs: {} })
  }

  // thêm câu mặc định chưa có (theo id) – giữ nguyên câu đã sửa / kết quả cũ; trả số câu đã thêm
  function mergeDefaults() {
    const existing = new Set(stateRef.current.cases.map((c) => c.id))
    const missing = BUILTIN_CASES.filter((c) => !existing.has(c.id))
    if (missing.length > 0) setState((prev) => ({ ...prev, cases: [...prev.cases, ...missing] }))
    return missing.length
  }

  function importState(next: AiTestSuiteState) {
    setState(next)
  }

  function exportSuite(includeRuns: boolean) {
    const file: AiTestSuiteFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cases: state.cases,
      ...(includeRuns ? { runs: state.runs } : {}),
    }
    downloadJson(`ai-test-suite_${dayjs().format('YYYYMMDD_HHmm')}.json`, file)
  }

  return {
    cases: state.cases,
    runs: state.runs,
    // số câu từ file JSON mới được tự thêm lúc mở tab
    autoAdded: initial.autoAdded,
    config,
    setConfig,
    progress,
    running: progress !== null,
    saveCase,
    deleteCase,
    setVerdict,
    setNote,
    run,
    stop,
    clearRuns,
    resetToDefaults,
    mergeDefaults,
    importState,
    exportSuite,
  }
}
