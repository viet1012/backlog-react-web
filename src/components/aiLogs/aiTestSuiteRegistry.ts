import { DEFAULT_TEST_SCREEN_KEY, type AiTestCase } from '../../types/aiTestSuite'
import { DEFAULT_AI_TEST_CASES as CORE_CASES } from './aiTestDefaults'
import { isCaseLike, normalizeCase } from './aiTestUtils'

// =========================================================
// Bộ test dựng sẵn trong code – mỗi file JSON ở src/data/aiTestSuites/<screenKey>/*.json là 1 bộ
// (xem src/data/aiTestSuites/README.md). Thêm file → build lại → tự hiện tab bộ test mới.
// =========================================================

export interface AiTestSuiteDef {
  // "<screenKey>/<tên file>" – lưu trong AiTestCase.suite
  id: string
  screenKey: string
  // null = dùng nhãn i18n (bộ Cơ bản)
  title: string | null
  order: number
  cases: AiTestCase[]
}

// câu người dùng tự thêm / nhập từ file ngoài (suite rỗng hoặc không khớp bộ nào)
export const CUSTOM_SUITE_ID = 'custom'
export const CORE_SUITE_ID = `${DEFAULT_TEST_SCREEN_KEY}/core`

interface SuiteJson {
  title?: unknown
  order?: unknown
  cases?: unknown
}

const files = import.meta.glob<SuiteJson | unknown[]>('../../data/aiTestSuites/*/*.json', {
  eager: true,
  import: 'default',
})

function buildSuites(): AiTestSuiteDef[] {
  const suites: AiTestSuiteDef[] = [{
    id: CORE_SUITE_ID,
    screenKey: DEFAULT_TEST_SCREEN_KEY,
    title: null,
    order: 0,
    cases: CORE_CASES.map((c) => ({ ...c, suite: CORE_SUITE_ID })),
  }]
  const seen = new Set(suites[0].cases.map((c) => c.id))

  // sort theo đường dẫn → thứ tự ổn định khi file không khai báo order
  for (const path of Object.keys(files).sort()) {
    const match = /aiTestSuites\/([^/]+)\/([^/]+)\.json$/.exec(path)
    if (!match) continue
    const [, screenKey, fileName] = match
    const data = files[path]
    const list = Array.isArray(data) ? data : data?.cases
    if (!Array.isArray(list)) {
      console.warn(`[aiTestSuites] ${path}: thiếu mảng "cases" – bỏ qua`)
      continue
    }

    const id = `${screenKey}/${fileName}`
    const meta = Array.isArray(data) ? {} : data
    const cases: AiTestCase[] = []
    for (const raw of list) {
      if (!isCaseLike(raw)) {
        console.warn(`[aiTestSuites] ${path}: câu thiếu id / question / expected – bỏ qua`, raw)
        continue
      }
      if (seen.has(raw.id)) {
        console.warn(`[aiTestSuites] ${path}: trùng id "${raw.id}" – bỏ qua`)
        continue
      }
      seen.add(raw.id)
      cases.push(normalizeCase({ screenKey, ...raw, suite: id }))
    }

    suites.push({
      id,
      screenKey,
      title: typeof meta.title === 'string' && meta.title.trim() ? meta.title.trim() : fileName,
      order: typeof meta.order === 'number' ? meta.order : 1000 + suites.length,
      cases,
    })
  }

  return suites.sort((a, b) => a.order - b.order)
}

export const BUILTIN_SUITES = buildSuites()

// toàn bộ câu dựng sẵn (bộ mặc định khi mở lần đầu / "Khôi phục mặc định")
export const BUILTIN_CASES: AiTestCase[] = BUILTIN_SUITES.flatMap((s) => s.cases)

const suiteByCaseId = new Map(BUILTIN_CASES.map((c) => [c.id, c.suite as string]))
const suiteIds = new Set(BUILTIN_SUITES.map((s) => s.id))

// bộ của 1 câu: suite đã lưu (nếu còn tồn tại) → theo id câu dựng sẵn → Tự thêm
export function suiteOf(testCase: AiTestCase): string {
  if (testCase.suite && suiteIds.has(testCase.suite)) return testCase.suite
  return suiteByCaseId.get(testCase.id) ?? CUSTOM_SUITE_ID
}

// gán suite cho dữ liệu cũ (localStorage / file nhập chưa có trường suite)
export function withSuite(testCase: AiTestCase): AiTestCase {
  const suite = suiteOf(testCase)
  return suite === CUSTOM_SUITE_ID ? { ...testCase, suite: undefined } : { ...testCase, suite }
}
