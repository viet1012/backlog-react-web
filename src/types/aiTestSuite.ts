// =========================================================
// AI TEST SUITE – bộ câu hỏi kiểm thử trợ lý AI (tab "Bộ test" trong AI Logs)
// Chưa có API BE → lưu localStorage, chia sẻ bằng xuất / nhập JSON.
// =========================================================

import type { AssistantErrorCode, AssistantSource } from '../services/assistantService'
import type { CostChartType, CostDiv } from './costMonitoring'

export interface AiTestCase {
  id: string
  // nhóm hiển thị, vd "1. Top máy / cost center"
  group: string
  question: string
  // mô tả kết quả mong đợi – người test đối chiếu và chấm Đạt / Không đạt
  expected: string
  // drawer đang mở trên Cost Monitoring → gửi params div + cost; null = không mở drawer
  drawer: { div: CostDiv; cost: CostChartType } | null
  // thời gian tối đa (giây); vượt → cảnh báo; null = không giới hạn
  maxSec: number | null
}

export type AiTestVerdict = 'pass' | 'fail'

export interface AiTestRun {
  caseId: string
  // ISO
  at: string
  ok: boolean
  answer: string | null
  sources: AssistantSource[]
  errorCode: AssistantErrorCode | null
  errorMessage: string | null
  ms: number
  // người test chấm tay; null = chưa chấm
  verdict: AiTestVerdict | null
  note: string
}

export interface AiTestRunConfig {
  // "YYYY-MM"
  month: string
  // '' = mới nhất
  simuWeek: string
  // số request tối đa / 60 s phía client; BE cho 10 / phút / IP (AssistantRateLimiter) → chừa chỗ cho mascot
  perMinute: number
}

export interface AiTestSuiteState {
  cases: AiTestCase[]
  // lần chạy gần nhất của mỗi case
  runs: Record<string, AiTestRun>
}

// file xuất / nhập
export interface AiTestSuiteFile {
  version: 1
  exportedAt: string
  cases: AiTestCase[]
  runs?: Record<string, AiTestRun>
}
