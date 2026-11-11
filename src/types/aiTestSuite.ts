// =========================================================
// AI TEST SUITE – bộ câu hỏi kiểm thử trợ lý AI (tab "Bộ test" trong AI Logs)
// Chưa có API BE → lưu localStorage, chia sẻ bằng xuất / nhập JSON.
// =========================================================

import type { AssistantErrorCode, AssistantSource } from '../services/assistantService'
import type { CostChartType, CostDiv } from './costMonitoring'

// màn hình mặc định của câu test – dữ liệu cũ (chưa có screenKey) đều thuộc Cost Monitoring
export const DEFAULT_TEST_SCREEN_KEY = 'cost-monitoring'

export interface AiTestCase {
  id: string
  // screenKey gửi lên /api/assistant/chat (khớp ASSISTANT_SCREENS trong mascotMessages.ts)
  screenKey: string
  // nhóm hiển thị, vd "1. Top máy / cost center"
  group: string
  question: string
  // mô tả kết quả mong đợi – người test đối chiếu và chấm Đạt / Không đạt
  expected: string
  // drawer đang mở trên Cost Monitoring → gửi params div + cost; null = không mở drawer
  // (chỉ dùng khi screenKey = cost-monitoring)
  drawer: { div: CostDiv; cost: CostChartType } | null
  // thời gian tối đa (giây); vượt → cảnh báo; null = không giới hạn
  maxSec: number | null
  // bộ test (tab con trong màn hình) – "<screenKey>/<tên file>" của src/data/aiTestSuites;
  // undefined = câu tự thêm / nhập từ file ngoài
  suite?: string
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
  // '' = mới nhất; chỉ gửi cho màn hình Cost Monitoring
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
