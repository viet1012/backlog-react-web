import { COST_COLUMNS, COST_ROWS } from '../costMonitoring/costChartConfig'
import { DEFAULT_TEST_SCREEN_KEY, type AiTestCase, type AiTestRun } from '../../types/aiTestSuite'
import type { CostChartType, CostDiv } from '../../types/costMonitoring'

// drawer (div/cost) và simuWeek chỉ có ý nghĩa ở màn hình Cost Monitoring
export function isCostScreen(screenKey: string) {
  return screenKey === DEFAULT_TEST_SCREEN_KEY
}

type CaseLike = Partial<AiTestCase> & Pick<AiTestCase, 'id' | 'question' | 'expected'>

// chỉ kiểm tra trường bắt buộc; trường thiếu (screenKey, group…) do normalizeCase bù
export function isCaseLike(value: unknown): value is CaseLike {
  const c = value as Partial<AiTestCase> | null
  return typeof c === 'object' && c !== null
    && typeof c.id === 'string'
    && typeof c.question === 'string'
    && typeof c.expected === 'string'
}

// dữ liệu cũ / file JSON chưa có screenKey → thuộc Cost Monitoring
export function normalizeCase(c: CaseLike): AiTestCase {
  return {
    ...c,
    screenKey: typeof c.screenKey === 'string' && c.screenKey.trim() ? c.screenKey : DEFAULT_TEST_SCREEN_KEY,
    group: c.group ?? '',
    drawer: c.drawer ?? null,
    maxSec: c.maxSec ?? null,
    suite: typeof c.suite === 'string' && c.suite ? c.suite : undefined,
  }
}

// drawer lưu dạng "div|cost" trong ô select; '' = không mở drawer
export const DRAWER_OPTIONS = COST_ROWS.flatMap((row) =>
  COST_COLUMNS.map((cost) => ({ value: `${row.div}|${cost}`, label: `${row.label} ${cost}` })),
)

export function drawerValue(drawer: AiTestCase['drawer']) {
  return drawer ? `${drawer.div}|${drawer.cost}` : ''
}

export function parseDrawer(value: string): AiTestCase['drawer'] {
  if (!value) return null
  const [div, cost] = value.split('|')
  return { div: div as CostDiv, cost: cost as CostChartType }
}

export function drawerLabel(drawer: AiTestCase['drawer']) {
  if (!drawer) return null
  const value = drawerValue(drawer)
  return DRAWER_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function isOverLimit(testCase: AiTestCase, run: AiTestRun | undefined) {
  return run != null && testCase.maxSec != null && run.ms > testCase.maxSec * 1000
}

// giữ thứ tự xuất hiện đầu tiên của từng nhóm
export function groupCases(cases: AiTestCase[]) {
  const groups = new Map<string, AiTestCase[]>()
  for (const c of cases) {
    const list = groups.get(c.group)
    if (list) list.push(c)
    else groups.set(c.group, [c])
  }
  return [...groups.entries()].map(([group, items]) => ({ group, items }))
}
