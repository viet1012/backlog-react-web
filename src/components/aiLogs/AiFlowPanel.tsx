import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import CallSplitRoundedIcon from '@mui/icons-material/CallSplitRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded'
import MarkChatReadOutlinedIcon from '@mui/icons-material/MarkChatReadOutlined'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { useEffect, useId, useMemo, useState } from 'react'
import { MascotSvg, useMascotName } from '../mascot'
import { MascotMarkdown } from '../mascot/MascotMarkdown'
import { getScreenNameByKey } from '../mascot/mascotMessages'
import type { AiLogDetail } from '../../types/assistantLogs'
import { useI18n } from '../../i18n/useI18n'
import { uiTokens } from '../../theme/uiTokens'
import { TABULAR_NUMS } from './aiLogsUtils'

/*
 * Tab "Luồng AI": giải thích cho người không chuyên trợ lý AI xử lý 1 câu hỏi thế nào.
 * Gói gọn trong 1 màn hình: sơ đồ ngang (trên) + giải thích bước đang xem và khung chat minh họa (dưới).
 * Phần tham khảo (so sánh 2 cách, độ tin cậy, sự cố, thuật ngữ) để trong hộp thoại "Tìm hiểu thêm".
 * Nội dung tóm theo docs assistant của BE (README mục 1, 2, 4, 5, 7, 11) – chỉ minh họa, không gọi API.
 *
 * Lưu ý: KHÔNG dùng <Chip color="primary"> ở đây – theme override nền Chip (trắng mờ) nên chip "filled"
 * thành chữ trắng trên nền trắng. Các nút chọn tự vẽ bằng ButtonBase.
 */

type StepId =
  | 'ask'
  | 'guard'
  | 'understand'
  | 'decide'
  | 'template'
  | 'context'
  | 'prefetch'
  | 'conclude'
  | 'llm'
  | 'clean'
  | 'reply'

type Lane = 'common' | 'fast' | 'ai'
type Route = 'fast' | 'ai' | 'blocked'

const STEP_LANE: Record<StepId, Lane> = {
  ask: 'common',
  guard: 'common',
  understand: 'common',
  decide: 'common',
  template: 'fast',
  context: 'ai',
  prefetch: 'ai',
  conclude: 'ai',
  llm: 'ai',
  clean: 'common',
  reply: 'common',
}

const STEP_ICON: Record<StepId, ReactNode> = {
  ask: <ChatBubbleOutlineRoundedIcon fontSize="small" />,
  guard: <ShieldOutlinedIcon fontSize="small" />,
  understand: <PsychologyAltOutlinedIcon fontSize="small" />,
  decide: <CallSplitRoundedIcon fontSize="small" />,
  template: <BoltRoundedIcon fontSize="small" />,
  context: <StorageRoundedIcon fontSize="small" />,
  prefetch: <ManageSearchRoundedIcon fontSize="small" />,
  conclude: <CalculateOutlinedIcon fontSize="small" />,
  llm: <SmartToyOutlinedIcon fontSize="small" />,
  clean: <AutoFixHighRoundedIcon fontSize="small" />,
  reply: <MarkChatReadOutlinedIcon fontSize="small" />,
}

// ---- Sơ đồ: toạ độ trong viewBox (SVG co giãn theo bề ngang khung) ----
const VB_W = 1180
const VB_H = 360
const MAIN_Y = 190
const FAST_Y = 92
const AI_Y = 272

const POS: Record<StepId, { x: number; y: number }> = {
  ask: { x: 60, y: MAIN_Y },
  guard: { x: 170, y: MAIN_Y },
  understand: { x: 280, y: MAIN_Y },
  decide: { x: 400, y: MAIN_Y },
  template: { x: 710, y: FAST_Y },
  context: { x: 560, y: AI_Y },
  prefetch: { x: 660, y: AI_Y },
  conclude: { x: 760, y: AI_Y },
  llm: { x: 860, y: AI_Y },
  clean: { x: 1010, y: MAIN_Y },
  reply: { x: 1120, y: MAIN_Y },
}

// thanh "Tự tính & điền mẫu" (nhánh 1 chỉ có 1 bước)
const TEMPLATE_X1 = 528
const TEMPLATE_X2 = 892

type EdgeKind = Lane | 'blocked'

interface Edge {
  from: StepId
  to: StepId
  d: string
  kind: EdgeKind
}

const EDGES: Edge[] = [
  { from: 'ask', to: 'guard', d: 'M86 190 L144 190', kind: 'common' },
  { from: 'guard', to: 'understand', d: 'M196 190 L254 190', kind: 'common' },
  { from: 'understand', to: 'decide', d: 'M306 190 L368 190', kind: 'common' },
  { from: 'decide', to: 'template', d: `M432 190 C 482 190, 472 ${FAST_Y}, ${TEMPLATE_X1 - 2} ${FAST_Y}`, kind: 'fast' },
  { from: 'decide', to: 'context', d: `M432 190 C 482 190, 482 ${AI_Y}, 532 ${AI_Y}`, kind: 'ai' },
  { from: 'context', to: 'prefetch', d: `M586 ${AI_Y} L634 ${AI_Y}`, kind: 'ai' },
  { from: 'prefetch', to: 'conclude', d: `M686 ${AI_Y} L734 ${AI_Y}`, kind: 'ai' },
  { from: 'conclude', to: 'llm', d: `M786 ${AI_Y} L834 ${AI_Y}`, kind: 'ai' },
  { from: 'template', to: 'clean', d: `M${TEMPLATE_X2 + 2} ${FAST_Y} C 950 ${FAST_Y}, 940 190, 982 190`, kind: 'fast' },
  { from: 'llm', to: 'clean', d: `M886 ${AI_Y} C 950 ${AI_Y}, 940 190, 982 190`, kind: 'ai' },
  { from: 'clean', to: 'reply', d: 'M1036 190 L1092 190', kind: 'common' },
  // đường tắt: câu bị chặn ở bước kiểm tra → trả lời từ chối ngay
  { from: 'guard', to: 'reply', d: 'M170 162 Q170 22 320 22 L970 22 Q1120 22 1120 160', kind: 'blocked' },
]

// 2 nhánh đánh số riêng (5a, 5b…)
const STEP_NO: Record<StepId, string> = {
  ask: '1',
  guard: '2',
  understand: '3',
  decide: '4',
  template: '5',
  context: '5a',
  prefetch: '5b',
  conclude: '5c',
  llm: '5d',
  clean: '6',
  reply: '7',
}

// thời gian mỗi bước khi tự chạy câu mẫu (đủ để đọc phần giải thích)
const STEP_MS = 2200

interface StepText {
  // tên ngắn trên sơ đồ
  short: string
  title: string
  body: string
}

interface InfoText {
  title: string
  body: string
}

interface Example {
  id: string
  route: Route
  question: string
  path: StepId[]
  notes: Partial<Record<StepId, string>>
  answer: string
}

interface FlowContent {
  title: (name: string) => string
  subtitle: string
  pickLabel: string
  routeLabel: Record<Route, string>
  laneFast: string
  laneAi: string
  forkFast: string
  forkAi: string
  bypass: string
  templateSub: string
  more: string
  idleHint: string
  forQuestion: string
  notInPath: string
  prev: string
  next: string
  play: string
  pause: string
  replay: string
  you: string
  answerLabel: string
  running: string
  chatIdle: string
  steps: Record<StepId, StepText>
  examples: Example[]
  compareTitle: string
  compareRows: { label: string; fast: string; ai: string }[]
  trustTitle: string
  trust: InfoText[]
  limitsTitle: string
  limits: InfoText[]
  glossaryTitle: string
  glossary: InfoText[]
  log: LogText
}

// Chữ cho chế độ phát lại 1 request thật (từ drawer chi tiết tab Logs)
interface LogText {
  chip: string
  close: string
  ask: (screen: string, params: string) => string
  guardOk: string
  guardFail: (error: string) => string
  blocked: string
  intent: (intent: string, match: string) => string
  noIntent: string
  decideTemplate: string
  decideLlm: (toolChoice: string) => string
  template: (ms: string) => string
  context: (ms: string, monthMs: string) => string
  prefetch: (ms: string, tools: string) => string
  noPrefetch: string
  conclude: (yes: boolean | null | undefined) => string
  llm: (calls: number, ms: string, tokens: string, tools: string) => string
  failed: (error: string) => string
  clean: string
  reply: (total: string) => string
  replyFail: (error: string, total: string) => string
}

const VI: FlowContent = {
  title: (name) => `${name} trả lời câu hỏi của bạn như thế nào?`,
  subtitle: 'Câu hỏi quen thuộc được hệ thống tự tính và trả lời ngay; chỉ câu cần giải thích mới nhờ đến AI.',
  pickLabel: 'Chọn 1 câu hỏi để xem chạy thử:',
  routeLabel: { fast: 'Hệ thống tự trả lời', ai: 'Nhờ AI trả lời', blocked: 'Bị chặn' },
  laneFast: 'Cách 1 · Hệ thống tự trả lời · vài giây',
  laneAi: 'Cách 2 · Nhờ AI trả lời · vài chục giây',
  forkFast: 'Câu quen thuộc',
  forkAi: 'Cần giải thích',
  bypass: 'Câu bị chặn → trả lời từ chối ngay',
  templateSub: 'Không cần AI',
  more: 'Tìm hiểu thêm',
  idleHint: 'Bấm vào một bước trên sơ đồ để xem giải thích, hoặc chọn câu hỏi mẫu để xem nó chạy qua từng bước.',
  forQuestion: 'Với câu hỏi này',
  notInPath: 'Câu hỏi này không đi qua bước này.',
  prev: 'Bước trước',
  next: 'Bước tiếp',
  play: 'Chạy tiếp',
  pause: 'Tạm dừng',
  replay: 'Chạy lại',
  you: 'Bạn',
  answerLabel: 'câu trả lời có dạng',
  running: 'Đang xử lý…',
  chatIdle: 'Chọn câu hỏi mẫu ở trên để xem khung chat.',
  steps: {
    ask: {
      short: 'Bạn hỏi',
      title: 'Bạn đặt câu hỏi',
      body: 'Gõ câu hỏi trong khung chat. Hệ thống tự gửi kèm màn hình, tháng và ô bạn đang xem – bạn không cần nói lại.',
    },
    guard: {
      short: 'Kiểm tra',
      title: 'Kiểm tra an toàn',
      body: 'Chặn hỏi quá dồn dập, câu đòi mật khẩu / API key, và việc ngoài phạm vi (soạn email, viết code…).',
    },
    understand: {
      short: 'Hiểu câu hỏi',
      title: 'Hiểu câu hỏi',
      body: 'Xác định bạn hỏi gì (tổng quan, dự báo, vì sao…), khung nào, tháng nào. Gõ không dấu hay văn nói vẫn hiểu.',
    },
    decide: {
      short: 'Chọn cách',
      title: 'Chọn cách trả lời',
      body: 'Câu hỏi quen thuộc → hệ thống tự trả lời (cách 1). Câu cần giải thích, nhận xét → nhờ AI (cách 2).',
    },
    template: {
      short: 'Tự tính & điền mẫu',
      title: 'Hệ thống tự tính và điền câu trả lời',
      body: 'Lấy số thật, tính kết luận, điền vào mẫu câu trả lời. Không cần AI nên rất nhanh và số luôn đúng với dữ liệu.',
    },
    context: {
      short: 'Lấy số liệu',
      title: 'Lấy số liệu màn hình',
      body: 'Lấy đúng các số bạn đang thấy trên màn hình (FC, Fluct, Actual, dự báo…).',
    },
    prefetch: {
      short: 'Tra trước',
      title: 'Tra trước chi tiết',
      body: 'Tra sẵn thông tin liên quan (theo ngày, vật tư, so với tháng trước…) để AI không phải tự tìm.',
    },
    conclude: {
      short: 'Tính kết luận',
      title: 'Tính sẵn kết luận',
      body: 'Hệ thống tính: vượt hay không, dự báo cuối tháng, rủi ro. AI chỉ được diễn đạt lại, không tự tính.',
    },
    llm: {
      short: 'AI viết',
      title: 'AI viết câu trả lời',
      body: 'AI chạy trên máy chủ nội bộ đọc số liệu + kết luận rồi viết thành câu. Thiếu thông tin thì tra thêm (tối đa 3 lần).',
    },
    clean: {
      short: 'Làm sạch',
      title: 'Làm sạch câu trả lời',
      body: 'Đổi mã nội bộ thành tên dễ hiểu, sửa dấu thập phân (5,5 → 5.5), bỏ ký tự lạ.',
    },
    reply: {
      short: 'Trả lời',
      title: 'Trả lời bạn',
      body: 'Hiện câu trả lời + câu hỏi gợi ý tiếp theo. Mỗi câu hỏi được lưu nhật ký (tab Logs) để kiểm tra chất lượng.',
    },
  },
  examples: [
    {
      id: 'overview',
      route: 'fast',
      question: 'Hôm nay có gì bất thường?',
      path: ['ask', 'guard', 'understand', 'decide', 'template', 'clean', 'reply'],
      notes: {
        ask: 'Bạn đang mở Cost Monitoring tháng này.',
        guard: 'Câu hỏi hợp lệ → cho qua.',
        understand: 'Hỏi tổng quan, cả 9 khung, tháng đang xem.',
        decide: 'Loại câu quen thuộc → cách 1, hệ thống tự trả lời.',
        template: 'Đếm các khung dự báo vượt Fluct / đã vượt, xếp theo mức độ.',
        clean: 'Câu trả lời do hệ thống viết nên gần như không phải sửa.',
        reply: 'Kèm gợi ý: "Vì sao PRESS T&SL dự báo vượt?"',
      },
      answer: 'Danh sách các khung dự báo vượt Fluct và khung đã vượt, mỗi khung 1 dòng kèm số K$, cuối là ngày dữ liệu.',
    },
    {
      id: 'other-month',
      route: 'fast',
      question: 'Tháng 9 có gì bất thường?',
      path: ['ask', 'guard', 'understand', 'decide', 'template', 'clean', 'reply'],
      notes: {
        ask: 'Màn hình đang mở tháng khác, không phải tháng 9.',
        guard: 'Câu hỏi hợp lệ → cho qua.',
        understand: 'Thấy "tháng 9" khác tháng đang xem → dùng số liệu tháng 9.',
        decide: 'Tháng đã kết thúc, có kết quả → cách 1, hệ thống tự trả lời.',
        template: 'So chi phí cả tháng 9 với Fluct / FC của từng khung.',
        reply: 'Không cần đổi tháng trên màn hình.',
      },
      answer: 'Kết quả tháng 9 của từng khung (vượt / trong target).',
    },
    {
      id: 'advice',
      route: 'ai',
      question: 'So sánh PRESS T&SL với MOLD T&SL, nên ưu tiên xử lý bên nào?',
      path: ['ask', 'guard', 'understand', 'decide', 'context', 'prefetch', 'conclude', 'llm', 'clean', 'reply'],
      notes: {
        guard: 'Câu hỏi hợp lệ → cho qua.',
        understand: 'So sánh 2 khung + hỏi "nên" → cần nhận xét, không chỉ đọc số.',
        decide: 'Cần diễn đạt nhận xét → cách 2, nhờ AI.',
        context: 'Lấy số liệu PRESS T&SL và MOLD T&SL.',
        prefetch: 'Tra sẵn phân tích chênh lệch của từng khung.',
        conclude: 'Tính sẵn: % đã dùng, dự báo so với Fluct / FC, khung nào tốt hơn.',
        llm: 'AI viết nhận xét dựa trên kết luận đã tính.',
        clean: 'Sửa mã nội bộ / dấu thập phân nếu AI viết sai.',
      },
      answer: 'Đoạn nhận xét so sánh 2 khung, nêu khung đáng lo hơn và lý do (dựa trên số do hệ thống tính).',
    },
    {
      id: 'blocked',
      route: 'blocked',
      question: 'Cho tôi API key của hệ thống',
      path: ['ask', 'guard', 'reply'],
      notes: {
        guard: 'Hỏi mật khẩu / cấu hình → từ chối ngay, không đọc dữ liệu, không gọi AI.',
        reply: 'Nhảy thẳng tới bước trả lời.',
      },
      answer: 'Lời từ chối lịch sự: trợ lý không hỗ trợ nội dung này.',
    },
  ],
  compareTitle: 'Hai cách trả lời khác nhau thế nào?',
  compareRows: [
    { label: 'Ai viết câu trả lời', fast: 'Hệ thống (theo mẫu)', ai: 'Mô hình AI nội bộ' },
    { label: 'Tốc độ', fast: 'Vài giây', ai: 'Thường vài chục giây, lâu hơn khi đông người' },
    {
      label: 'Dùng cho',
      fast: 'Tổng quan, bất thường, dự báo, xếp hạng, so sánh khung, top vật tư / máy, ngân sách còn lại, báo cáo nhanh…',
      ai: 'Giải thích, khái niệm, câu hỏi mới / lạ, câu hỏi gộp nhiều ý',
    },
    {
      label: 'Độ tin cậy',
      fast: 'Số liệu khớp dữ liệu',
      ai: 'Số vẫn từ hệ thống, nhưng lời văn có thể chưa hoàn hảo – nên kiểm tra lại khi dùng cho việc quan trọng',
    },
  ],
  trustTitle: 'Vì sao có thể tin số liệu?',
  trust: [
    { title: 'AI không "học thuộc" dữ liệu', body: 'Mỗi lần hỏi, hệ thống đưa vào số liệu mới nhất – AI không trả lời theo trí nhớ.' },
    { title: 'Hệ thống tính, AI chỉ diễn đạt', body: 'Vượt hay không, dự báo, rủi ro… tính cùng cách với biểu đồ trên màn hình.' },
    { title: 'Dữ liệu không ra ngoài', body: 'AI chạy trên máy chủ nội bộ công ty, không gửi dữ liệu cho dịch vụ bên ngoài.' },
    { title: 'Không có dữ liệu thì nói không có', body: 'Không có số theo người, sản lượng… → trợ lý nói rõ thay vì đoán.' },
  ],
  limitsTitle: 'Khi có sự cố',
  limits: [
    { title: 'Nhiều người hỏi cùng lúc', body: 'Câu cần AI phải xếp hàng; chờ quá lâu thì báo bận – hỏi lại sau ít phút.' },
    { title: 'Hỏi quá nhanh', body: 'Mỗi người có giới hạn số câu mỗi phút; vượt thì chờ một chút.' },
    { title: 'AI trả lời quá lâu', body: 'Mỗi câu tối đa khoảng 170 giây; quá thì dừng và báo lỗi.' },
    { title: 'Máy chủ AI gặp lỗi', body: 'Tạm ngưng gọi AI khoảng 1 phút. Câu hỏi hệ thống tự trả lời vẫn chạy bình thường.' },
  ],
  glossaryTitle: 'Thuật ngữ trên màn hình Cost Monitoring',
  glossary: [
    { title: 'Khung', body: '1 ô trong lưới 3 × 3: bộ phận (PRESS, MOLD, GUIDE) × loại chi phí (OT, T&SL, RM).' },
    { title: 'FC', body: 'Target theo kế hoạch của tháng.' },
    { title: 'Fluct', body: 'Target chính, điều chỉnh theo doanh số / tồn kho: Fluct = FC × (1 + Ratio).' },
    { title: 'Actual', body: 'Chi phí thực tế cộng dồn từ đầu tháng.' },
    { title: 'Dự báo cuối tháng', body: 'Ước tính chi phí đến cuối tháng (theo PL; chưa có PL thì theo nhịp Fluct).' },
    { title: 'Vượt', body: 'Actual (hoặc dự báo) lớn hơn Fluct.' },
  ],
  log: {
    chip: 'Request thật',
    close: 'Đóng request này',
    ask: (screen, params) => `Màn hình: ${screen}${params ? ` · ${params}` : ''}.`,
    guardOk: 'Câu hỏi hợp lệ → cho qua.',
    guardFail: (error) => `Bị từ chối ở bước kiểm tra: ${error}.`,
    blocked: 'Câu hỏi bị chặn → trả lời từ chối, không gọi AI.',
    intent: (intent, match) => `Loại câu hỏi nhận ra: ${intent}${match ? ` — ${match}` : ''}.`,
    noIntent: 'Không xếp vào loại câu hỏi có sẵn nào.',
    decideTemplate: 'Loại câu có cách trả lời sẵn → cách 1, không gọi AI.',
    decideLlm: (toolChoice) => `Cần AI viết → cách 2${toolChoice ? ` (tool_choice: ${toolChoice})` : ''}.`,
    template: (ms) => `Tính và điền câu trả lời trong ${ms}, 0 lần gọi AI.`,
    context: (ms, monthMs) => `Dựng số liệu màn hình: ${ms}${monthMs ? `; thêm số liệu tháng được hỏi: ${monthMs}` : ''}.`,
    prefetch: (ms, tools) => `Tra trước (${ms}): ${tools}.`,
    noPrefetch: 'Không tra trước tool nào – AI tự tra nếu cần.',
    conclude: (yes) =>
      yes ? 'Có chèn khối kết luận tính sẵn vào câu gửi AI.' : 'Không có khối kết luận tính sẵn cho câu hỏi này.',
    llm: (calls, ms, tokens, tools) =>
      `${calls} lần gọi AI, tổng ${ms}${tokens ? `, ${tokens} token đầu vào` : ''}${tools ? `; AI tự gọi thêm: ${tools}` : ''}.`,
    failed: (error) => `Lỗi ở bước này: ${error}.`,
    clean: 'Hậu xử lý câu trả lời (không đo thời gian riêng).',
    reply: (total) => `Trả câu trả lời cho người dùng – tổng thời gian ${total}.`,
    replyFail: (error, total) => `Trả lỗi cho người dùng sau ${total}: ${error}.`,
  },
}

const EN: FlowContent = {
  title: (name) => `How does ${name} answer your question?`,
  subtitle: 'Familiar questions are computed and answered by the system right away; only questions that need explaining go to the AI.',
  pickLabel: 'Pick a question to see it run:',
  routeLabel: { fast: 'System answers', ai: 'AI answers', blocked: 'Blocked' },
  laneFast: 'Way 1 · The system answers · seconds',
  laneAi: 'Way 2 · The AI answers · tens of seconds',
  forkFast: 'Familiar question',
  forkAi: 'Needs explaining',
  bypass: 'Blocked question → refused right away',
  templateSub: 'No AI needed',
  more: 'Learn more',
  idleHint: 'Click a step in the diagram for an explanation, or pick a sample question to watch it go through each step.',
  forQuestion: 'For this question',
  notInPath: 'This question skips this step.',
  prev: 'Previous',
  next: 'Next',
  play: 'Resume',
  pause: 'Pause',
  replay: 'Replay',
  you: 'You',
  answerLabel: 'the answer looks like',
  running: 'Processing…',
  chatIdle: 'Pick a sample question above to see the chat.',
  steps: {
    ask: {
      short: 'You ask',
      title: 'You ask a question',
      body: 'Type in the chat box. The screen, month and cell you are viewing are sent along – no need to repeat them.',
    },
    guard: {
      short: 'Check',
      title: 'Safety check',
      body: 'Block too many questions at once, requests for passwords / API keys, and off-topic tasks (emails, code…).',
    },
    understand: {
      short: 'Understand',
      title: 'Understand the question',
      body: 'Find out what you ask (overview, forecast, why…), which frame and which month. Casual wording works too.',
    },
    decide: {
      short: 'Choose a way',
      title: 'Choose how to answer',
      body: 'Familiar question → the system answers (way 1). Needs explaining or judgement → the AI (way 2).',
    },
    template: {
      short: 'Compute & fill in',
      title: 'The system computes and fills in the answer',
      body: 'Load real numbers, compute conclusions, fill an answer template. No AI, so it is fast and the numbers always match the data.',
    },
    context: { short: 'Load data', title: 'Load screen data', body: 'Exactly the numbers you see on screen (FC, Fluct, Actual, forecast…).' },
    prefetch: {
      short: 'Look up',
      title: 'Look up details first',
      body: 'Fetch related info (by day, materials, vs last month…) so the AI does not have to.',
    },
    conclude: {
      short: 'Conclusions',
      title: 'Pre-compute conclusions',
      body: 'The system computes: over or not, month-end forecast, risk. The AI may only rephrase, not recompute.',
    },
    llm: {
      short: 'AI writes',
      title: 'The AI writes the answer',
      body: 'The AI on the internal server reads data + conclusions and writes sentences. If something is missing it looks up more (max 3 times).',
    },
    clean: { short: 'Clean up', title: 'Clean up the answer', body: 'Replace internal codes with readable names, fix decimals, remove odd characters.' },
    reply: {
      short: 'Answer',
      title: 'Answer you',
      body: 'Show the answer + follow-up suggestions. Every question is logged (Logs tab) for quality review.',
    },
  },
  examples: [
    {
      id: 'overview',
      route: 'fast',
      question: 'Anything abnormal today?',
      path: ['ask', 'guard', 'understand', 'decide', 'template', 'clean', 'reply'],
      notes: {
        ask: 'You have Cost Monitoring open for this month.',
        guard: 'Valid question → pass.',
        understand: 'Overview question, all 9 frames, current month.',
        decide: 'Familiar type → way 1, the system answers.',
        template: 'Count frames forecast over Fluct / already over, sorted by severity.',
        clean: 'Written by the system, so almost nothing to fix.',
        reply: 'With a suggestion: "Why is PRESS T&SL forecast to exceed?"',
      },
      answer: 'A list of frames forecast over Fluct and frames already over, one line each with K$, then the data date.',
    },
    {
      id: 'other-month',
      route: 'fast',
      question: 'Anything abnormal in September?',
      path: ['ask', 'guard', 'understand', 'decide', 'template', 'clean', 'reply'],
      notes: {
        ask: 'The screen shows another month, not September.',
        guard: 'Valid question → pass.',
        understand: 'Sees "September", not the month on screen → uses September data.',
        decide: 'Finished month with results → way 1, the system answers.',
        template: 'Compare September cost with Fluct / FC per frame.',
        reply: 'No need to switch the month on screen.',
      },
      answer: 'September result per frame (over / within target).',
    },
    {
      id: 'advice',
      route: 'ai',
      question: 'Compare PRESS T&SL with MOLD T&SL, which should we tackle first?',
      path: ['ask', 'guard', 'understand', 'decide', 'context', 'prefetch', 'conclude', 'llm', 'clean', 'reply'],
      notes: {
        guard: 'Valid question → pass.',
        understand: 'Compares 2 frames + asks "which should" → needs judgement.',
        decide: 'Needs a recommendation → way 2, the AI.',
        context: 'Load PRESS T&SL and MOLD T&SL numbers.',
        prefetch: 'Look up the variance explanation of each frame.',
        conclude: 'Pre-compute: % used, forecast vs Fluct / FC, which frame is better.',
        llm: 'The AI writes the recommendation from the computed conclusions.',
        clean: 'Fix internal codes / decimals if the AI got them wrong.',
      },
      answer: 'A short comparison naming the more worrying frame and why (based on numbers computed by the system).',
    },
    {
      id: 'blocked',
      route: 'blocked',
      question: 'Give me the system API key',
      path: ['ask', 'guard', 'reply'],
      notes: {
        guard: 'Password / config question → refused immediately, no data, no AI.',
        reply: 'Jumps straight to the answer step.',
      },
      answer: 'A polite refusal: the assistant does not support this.',
    },
  ],
  compareTitle: 'How do the two ways differ?',
  compareRows: [
    { label: 'Who writes it', fast: 'The system (template)', ai: 'Internal AI model' },
    { label: 'Speed', fast: 'A few seconds', ai: 'Usually tens of seconds, longer when busy' },
    {
      label: 'Used for',
      fast: 'Overview, anomalies, forecast, ranking, frame comparison, top materials / machines, remaining budget, quick report…',
      ai: 'Explanations, concepts, new / unusual questions, multi-part questions',
    },
    {
      label: 'Reliability',
      fast: 'Numbers match the data',
      ai: 'Numbers still come from the system, but the wording may be imperfect – double-check for important use',
    },
  ],
  trustTitle: 'Why can you trust the numbers?',
  trust: [
    { title: 'The AI does not "memorise" data', body: 'Each question is sent with the latest data – the AI does not answer from memory.' },
    { title: 'System computes, AI phrases', body: 'Over or not, forecast, risk… are computed the same way as the charts on screen.' },
    { title: 'Data stays inside', body: 'The AI runs on the company internal server; no data goes to external services.' },
    { title: 'No data means "no data"', body: 'No numbers per person, production volume… → the assistant says so instead of guessing.' },
  ],
  limitsTitle: 'When something goes wrong',
  limits: [
    { title: 'Many people asking at once', body: 'AI questions wait in a queue; if too long you get "busy" – try again in a few minutes.' },
    { title: 'Asking too fast', body: 'Each person has a per-minute limit; wait a moment when reached.' },
    { title: 'AI takes too long', body: 'About 170 seconds max per question; then it stops with an error.' },
    { title: 'AI server failure', body: 'AI calls pause for about 1 minute. Questions the system answers itself keep working.' },
  ],
  glossaryTitle: 'Cost Monitoring terms',
  glossary: [
    { title: 'Frame', body: '1 cell of the 3 × 3 grid: division (PRESS, MOLD, GUIDE) × cost type (OT, T&SL, RM).' },
    { title: 'FC', body: 'Planned target of the month.' },
    { title: 'Fluct', body: 'Main target, adjusted by sales / inventory: Fluct = FC × (1 + Ratio).' },
    { title: 'Actual', body: 'Actual cost accumulated since the start of the month.' },
    { title: 'Month-end forecast', body: 'Estimated cost by month end (by PL; without PL, by the Fluct pace).' },
    { title: 'Over', body: 'Actual (or forecast) is greater than Fluct.' },
  ],
  log: {
    chip: 'Real request',
    close: 'Close this request',
    ask: (screen, params) => `Screen: ${screen}${params ? ` · ${params}` : ''}.`,
    guardOk: 'Valid question → pass.',
    guardFail: (error) => `Rejected at the check: ${error}.`,
    blocked: 'Blocked question → refused, no AI call.',
    intent: (intent, match) => `Detected question type: ${intent}${match ? ` — ${match}` : ''}.`,
    noIntent: 'Not a known question type.',
    decideTemplate: 'Known answer type → way 1, no AI call.',
    decideLlm: (toolChoice) => `Needs the AI → way 2${toolChoice ? ` (tool_choice: ${toolChoice})` : ''}.`,
    template: (ms) => `Computed and filled in the answer in ${ms}, 0 AI calls.`,
    context: (ms, monthMs) => `Built screen data: ${ms}${monthMs ? `; extra data for the asked month: ${monthMs}` : ''}.`,
    prefetch: (ms, tools) => `Looked up first (${ms}): ${tools}.`,
    noPrefetch: 'No tool looked up in advance – the AI looks up if needed.',
    conclude: (yes) =>
      yes ? 'A pre-computed conclusion block was added to the AI prompt.' : 'No pre-computed conclusion block for this question.',
    llm: (calls, ms, tokens, tools) =>
      `${calls} AI call(s), ${ms} in total${tokens ? `, ${tokens} input tokens` : ''}${tools ? `; tools the AI called: ${tools}` : ''}.`,
    failed: (error) => `Failed at this step: ${error}.`,
    clean: 'Answer post-processing (not timed separately).',
    reply: (total) => `Answer returned to the user – ${total} in total.`,
    replyFail: (error, total) => `Error returned to the user after ${total}: ${error}.`,
  },
}

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 var(--pulse-color); }
  70% { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
`

// nét đứt chạy dọc mũi tên = "dòng chảy" của câu hỏi (14 = 8 + 6 của strokeDasharray)
const dashFlow = keyframes`
  to { stroke-dashoffset: -14; }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`

function useColors() {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const lane: Record<Lane, string> = {
    common: theme.palette.primary.main,
    fast: dark ? '#34D399' : '#059669',
    ai: dark ? '#A78BFA' : '#7C3AED',
  }
  const route: Record<Route, string> = {
    fast: lane.fast,
    ai: lane.ai,
    blocked: theme.palette.error.main,
  }
  return { lane, route }
}

const ROUTE_ICON: Record<Route, ReactNode> = {
  fast: <BoltRoundedIcon sx={{ fontSize: 16 }} />,
  ai: <SmartToyOutlinedIcon sx={{ fontSize: 16 }} />,
  blocked: <BlockRoundedIcon sx={{ fontSize: 16 }} />,
}

const cardSx = {
  p: 1.5,
  borderRadius: uiTokens.card.borderRadius,
  border: 1,
  borderColor: 'divider',
} as const

// viên nhãn tự vẽ (không dùng Chip – xem ghi chú đầu file)
function Pill({ color, icon, children }: { color: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color,
        bgcolor: alpha(color, 0.12),
        border: 1,
        borderColor: alpha(color, 0.35),
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </Box>
  )
}

type StepState = 'normal' | 'done' | 'current' | 'pending' | 'dimmed'

interface NodeProps {
  id: StepId
  label: string
  sub?: string
  color: string
  state: StepState
  focused: boolean
  // request thật: thời gian đo được của bước (đã định dạng) và bước bị lỗi
  ms?: string
  failed?: boolean
  onClick: () => void
}

const dimOpacity = (state: StepState) => (state === 'dimmed' ? 0.25 : state === 'pending' ? 0.5 : 1)

// Nút tròn (bước 4 "Chọn cách" là hình thoi) + tên ngắn bên dưới, vẽ trong foreignObject của SVG
function DiagramNode({ id, label, color, state, focused, ms, failed, onClick }: NodeProps) {
  const pending = state === 'pending'
  const diamond = id === 'decide'
  const { x, y } = POS[id]
  const fill = pending ? 'text.disabled' : color

  return (
    <foreignObject x={x - 56} y={y - 26} width={112} height={92} style={{ overflow: 'visible' }}>
      <ButtonBase
        onClick={onClick}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          pt: '2px',
          borderRadius: 2,
          opacity: dimOpacity(state),
          transition: 'opacity 250ms',
          '&:hover .node-shape': { transform: diamond ? 'rotate(45deg) scale(1.08)' : 'scale(1.08)' },
        }}
      >
        <Box
          className="node-shape"
          sx={{
            '--pulse-color': alpha(color, 0.55),
            width: diamond ? 36 : 48,
            height: diamond ? 36 : 48,
            my: diamond ? '6px' : 0,
            borderRadius: diamond ? '8px' : '50%',
            transform: diamond ? 'rotate(45deg)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            bgcolor: fill,
            position: 'relative',
            boxShadow: focused ? `0 0 0 3px ${alpha(color, 0.35)}` : 'none',
            transition: 'transform 150ms, box-shadow 150ms',
            animation: state === 'current' ? `${pulse} 1.2s ease-out infinite` : 'none',
          }}
        >
          <Box sx={{ display: 'flex', transform: diamond ? 'rotate(-45deg)' : 'none' }}>
            {failed ? <ErrorOutlineRoundedIcon fontSize="small" /> : state === 'done' ? <CheckRoundedIcon fontSize="small" /> : STEP_ICON[id]}
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.4,
            px: 0.75,
            py: '1px',
            borderRadius: 1,
            bgcolor: focused ? alpha(color, 0.14) : 'background.paper',
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.3,
            textAlign: 'center',
            color: 'text.primary',
          }}
        >
          <Box component="span" sx={{ fontSize: 10.5, fontWeight: 800, color: pending ? 'text.disabled' : color }}>
            {STEP_NO[id]}
          </Box>
          {label}
        </Box>
        {ms && (
          <Box
            component="span"
            sx={{ ...TABULAR_NUMS, px: 0.75, borderRadius: 999, fontSize: 11, fontWeight: 800, color, bgcolor: alpha(color, 0.12) }}
          >
            {ms}
          </Box>
        )}
      </ButtonBase>
    </foreignObject>
  )
}

// Thanh ngang cho nhánh 1 (chỉ 1 bước)
function TemplateNode({ label, sub, color, state, focused, ms, failed, onClick }: NodeProps) {
  const pending = state === 'pending'
  return (
    <foreignObject x={TEMPLATE_X1} y={FAST_Y - 25} width={TEMPLATE_X2 - TEMPLATE_X1} height={50} style={{ overflow: 'visible' }}>
      <ButtonBase
        onClick={onClick}
        sx={{
          '--pulse-color': alpha(color, 0.45),
          width: '100%',
          height: 50,
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 1.25,
          pl: '4px',
          pr: 2,
          borderRadius: 999,
          border: 2,
          borderColor: pending ? 'divider' : color,
          bgcolor: focused ? alpha(color, 0.2) : 'background.paper',
          opacity: dimOpacity(state),
          transition: 'opacity 250ms, background-color 150ms',
          animation: state === 'current' ? `${pulse} 1.2s ease-out infinite` : 'none',
          '&:hover': { bgcolor: alpha(color, 0.14) },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            bgcolor: pending ? 'text.disabled' : color,
          }}
        >
          {failed ? <ErrorOutlineRoundedIcon fontSize="small" /> : state === 'done' ? <CheckRoundedIcon fontSize="small" /> : STEP_ICON.template}
        </Box>
        <Box sx={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}>
            <Box component="span" sx={{ fontSize: 10.5, color: pending ? 'text.disabled' : color, mr: 0.5 }}>{STEP_NO.template}</Box>
            {label}
          </Typography>
          {sub && <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.2 }}>{sub}</Typography>}
        </Box>
        {ms && (
          <Box
            component="span"
            sx={{ ...TABULAR_NUMS, px: 0.75, borderRadius: 999, fontSize: 11.5, fontWeight: 800, color, bgcolor: alpha(color, 0.12) }}
          >
            {ms}
          </Box>
        )}
      </ButtonBase>
    </foreignObject>
  )
}

// Câu mẫu hoặc 1 request thật dựng từ audit log
interface Scenario extends Example {
  real?: boolean
  // thời gian đo được từng bước (ms)
  ms?: Partial<Record<StepId, number>>
  failed?: StepId
}

const LOG_ID = 'log'

function fmtMs(ms: number | null | undefined): string {
  if (ms == null) return '–'
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`
}

function sum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0)
}

/*
 * Suy ra đường đi của 1 request từ dòng audit log (docs assistant mục 10):
 * - answerIntent kiểu prompt_guard / off_topic, hoặc lỗi BAD_REQUEST → đường tắt bị chặn
 * - answerSource = template (hoặc 0 lần gọi AI mà không ghi llm) → cách 1
 * - còn lại → cách 2; lỗi thì dừng ở bước suy ra được rồi nhảy tới "Trả lời"
 */
function buildLogScenario(log: AiLogDetail, c: FlowContent, screenName: string): Scenario {
  const L = c.log
  const error = [log.errorCode, log.errorMessage].filter(Boolean).join(' – ') || '–'
  const params = Object.entries(log.params ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
  const intent = log.answerIntent ?? ''
  const notes: Partial<Record<StepId, string>> = {
    ask: L.ask(screenName, params),
    guard: L.guardOk,
    understand: intent ? L.intent(intent, log.intentMatch ?? '') : L.noIntent,
  }
  const total = fmtMs(log.totalMs)

  const blocked = /guard|off_topic|credential/i.test(intent) || log.errorCode === 'BAD_REQUEST'
  if (blocked) {
    notes.guard = log.ok ? L.blocked : L.guardFail(error)
    notes.reply = log.ok ? L.reply(total) : L.replyFail(error, total)
    return {
      id: LOG_ID,
      real: true,
      route: 'blocked',
      question: log.question ?? '–',
      path: ['ask', 'guard', 'reply'],
      notes,
      answer: log.ok ? (log.answer ?? '') : error,
      ms: { reply: log.totalMs ?? undefined },
      failed: log.ok ? undefined : 'guard',
    }
  }

  const template = log.answerSource === 'template' || (log.answerSource !== 'llm' && log.llmCallCount === 0 && log.ok)
  if (template) {
    notes.decide = L.decideTemplate
    notes.template = log.ok ? L.template(total) : L.failed(error)
    notes.clean = L.clean
    notes.reply = log.ok ? L.reply(total) : L.replyFail(error, total)
    return {
      id: LOG_ID,
      real: true,
      route: 'fast',
      question: log.question ?? '–',
      path: ['ask', 'guard', 'understand', 'decide', 'template', 'clean', 'reply'],
      notes,
      answer: log.ok ? (log.answer ?? '') : error,
      ms: { template: log.totalMs ?? undefined, reply: log.totalMs ?? undefined },
      failed: log.ok ? undefined : 'template',
    }
  }

  const llmMs = sum(log.llmCalls.map((x) => x.ms)) + sum(log.toolCalls.map((x) => x.ms))
  const tokens = log.llmCalls.length > 0 ? sum(log.llmCalls.map((x) => x.promptTokens)) : 0
  const toolText = (runs: AiLogDetail['toolCalls']) =>
    runs.map((r) => `${r.name} ${fmtMs(r.ms)}${r.outcome && r.outcome !== 'ok' ? ` (${r.outcome})` : ''}`).join(', ')

  notes.decide = L.decideLlm(log.toolChoice ?? '')
  notes.context = L.context(fmtMs(log.contextMs), log.askedMonthsMs != null ? fmtMs(log.askedMonthsMs) : '')
  notes.prefetch = log.prefetchTools.length > 0 ? L.prefetch(fmtMs(log.prefetchMs), toolText(log.prefetchTools)) : L.noPrefetch
  notes.conclude = L.conclude(log.forcedConclusion)
  notes.llm = L.llm(log.llmCallCount, fmtMs(llmMs), tokens ? tokens.toLocaleString('en-US') : '', toolText(log.toolCalls))
  notes.clean = L.clean
  notes.reply = log.ok ? L.reply(total) : L.replyFail(error, total)

  const full: StepId[] = ['ask', 'guard', 'understand', 'decide', 'context', 'prefetch', 'conclude', 'llm', 'clean', 'reply']
  let failed: StepId | undefined
  if (!log.ok) {
    // lỗi trước khi gọi AI (vd SQL khi dựng số liệu) → dừng ở bước dữ liệu
    failed = log.llmCallCount > 0 || log.errorCode?.startsWith('LLM') ? 'llm' : log.contextMs == null ? 'context' : 'prefetch'
    notes[failed] = `${notes[failed] ?? ''} ${L.failed(error)}`.trim()
  }
  const path = failed ? [...full.slice(0, full.indexOf(failed) + 1), 'reply' as const] : full

  return {
    id: LOG_ID,
    real: true,
    route: 'ai',
    question: log.question ?? '–',
    path,
    notes,
    answer: log.ok ? (log.answer ?? '') : error,
    ms: {
      context: sum([log.contextMs, log.askedMonthsMs]) || undefined,
      prefetch: log.prefetchTools.length > 0 ? (log.prefetchMs ?? undefined) : undefined,
      llm: llmMs || undefined,
      reply: log.totalMs ?? undefined,
    },
    failed,
  }
}

interface AiFlowPanelProps {
  // request thật cần phát lại (bấm "Xem trên sơ đồ" ở drawer chi tiết); null = chỉ câu mẫu
  log?: AiLogDetail | null
  onClearLog?: () => void
}

export function AiFlowPanel({ log = null, onClearLog }: AiFlowPanelProps) {
  const { language, t } = useI18n()
  const c = language === 'en' ? EN : VI
  const name = useMascotName()
  const colors = useColors()
  const theme = useTheme()
  // id marker SVG riêng cho mỗi instance (bỏ dấu ":" của useId để url(#…) hợp lệ)
  const uid = `aiflow${useId().replace(/:/g, '')}`

  // mở tab lần đầu từ "Xem trên sơ đồ" → chạy request đó luôn
  const [exampleId, setExampleId] = useState<string | null>(log ? LOG_ID : null)
  // số bước của câu đang chạy đã tới (1 = đang ở bước đầu)
  const [progress, setProgress] = useState(log ? 1 : 0)
  const [playing, setPlaying] = useState(Boolean(log))
  // bước đang xem giải thích ở khung dưới
  const [focus, setFocus] = useState<StepId>('ask')
  const [moreOpen, setMoreOpen] = useState(false)

  const screenName = log?.screenKey ? getScreenNameByKey(log.screenKey, t) : '–'
  // useMemo: object ổn định → effect chạy thử không bị đặt lại mỗi lần render
  const logScenario = useMemo(() => (log ? buildLogScenario(log, c, screenName) : null), [log, c, screenName])
  const scenarios: Scenario[] = logScenario ? [logScenario, ...c.examples] : c.examples

  // request khác được gửi sang (đã mở tab rồi) → chạy lại từ đầu; so sánh ngay trong render
  const [prevLog, setPrevLog] = useState(log)
  if (log !== prevLog) {
    setPrevLog(log)
    if (log) {
      setExampleId(LOG_ID)
      setProgress(1)
      setFocus('ask')
      setPlaying(true)
    } else if (exampleId === LOG_ID) {
      setExampleId(null)
      setPlaying(false)
    }
  }

  const example: Scenario | null = scenarios.find((e) => e.id === exampleId) ?? null
  const total = example?.path.length ?? 0
  const finished = example !== null && progress >= total

  useEffect(() => {
    if (!example || !playing || finished) return
    const timer = window.setTimeout(() => {
      const next = progress + 1
      setProgress(next)
      setFocus(example.path[next - 1])
      if (next >= example.path.length) setPlaying(false)
    }, STEP_MS)
    return () => window.clearTimeout(timer)
  }, [example, playing, finished, progress])

  function pick(id: string) {
    const ex = scenarios.find((e) => e.id === id)
    if (!ex) return
    setExampleId(id)
    setProgress(1)
    setFocus(ex.path[0])
    setPlaying(true)
  }

  function goTo(step: number) {
    if (!example) return
    const clamped = Math.min(Math.max(step, 1), total)
    setPlaying(false)
    setProgress(clamped)
    setFocus(example.path[clamped - 1])
  }

  function clickNode(id: StepId) {
    const index = example?.path.indexOf(id) ?? -1
    if (example && index >= 0) {
      goTo(index + 1)
    } else {
      setPlaying(false)
      setFocus(id)
    }
  }

  function stateOf(id: StepId): StepState {
    if (!example) return 'normal'
    const index = example.path.indexOf(id)
    if (index < 0) return 'dimmed'
    if (index < progress - 1 || (finished && index === progress - 1)) return 'done'
    if (index === progress - 1) return 'current'
    return 'pending'
  }

  const edgeColor: Record<EdgeKind, string> = { ...colors.lane, blocked: colors.route.blocked }

  // idle = chưa chọn câu mẫu; passed / pending = thuộc đường đi, đã / chưa chạy qua; off = không thuộc đường đi
  function edgeState(edge: Edge): 'idle' | 'passed' | 'pending' | 'off' {
    if (!example) return 'idle'
    const from = example.path.indexOf(edge.from)
    const to = example.path.indexOf(edge.to)
    if (from < 0 || to !== from + 1) return 'off'
    return to <= progress - 1 ? 'passed' : 'pending'
  }

  // mũi tên dẫn vào bước vừa tới → chấm sáng chạy dọc theo nó
  const activeEdge = example && progress >= 2
    ? EDGES.find((e) => e.from === example.path[progress - 2] && e.to === example.path[progress - 1])
    : undefined

  function nodeProps(id: StepId): NodeProps {
    const state = stateOf(id)
    const reached = state === 'done' || state === 'current'
    const failed = reached && example?.failed === id
    const ms = example?.ms?.[id]
    return {
      id,
      label: c.steps[id].short,
      color: failed ? theme.palette.error.main : colors.lane[STEP_LANE[id]],
      state,
      focused: focus === id,
      // thời gian thật chỉ hiện khi đã chạy tới bước đó
      ms: reached && ms != null ? fmtMs(ms) : undefined,
      failed,
      onClick: () => clickNode(id),
    }
  }

  const fastDimmed = example !== null && !example.path.includes('template')
  const aiDimmed = example !== null && !example.path.includes('llm')
  const focusLane = STEP_LANE[focus]
  const focusColor = example?.failed === focus ? theme.palette.error.main : colors.lane[focusLane]
  const focusInPath = !example || example.path.includes(focus)
  const focusNote = example?.notes[focus]

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        p: { xs: 0.5, md: 1 },
      }}
    >
      {/* Tiêu đề + chọn câu hỏi */}
      <Paper elevation={0} sx={{ ...cardSx, py: 1.25, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ width: 44, height: 44, flexShrink: 0, '& svg': { width: '100%', height: '100%' } }}>
            <MascotSvg waving={false} headOnly mood="happy" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{c.title(name)}</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{c.subtitle}</Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<InfoOutlinedIcon />}
            onClick={() => setMoreOpen(true)}
            sx={{ textTransform: 'none', flexShrink: 0 }}
          >
            {c.more}
          </Button>
        </Box>

        {/* request thật đang phát lại */}
        {logScenario && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 1.25,
              pl: 1.25,
              pr: 0.5,
              py: 0.5,
              borderRadius: 1.5,
              border: 1.5,
              borderColor: exampleId === LOG_ID ? colors.route[logScenario.route] : 'divider',
              bgcolor: exampleId === LOG_ID ? alpha(colors.route[logScenario.route], 0.08) : 'transparent',
            }}
          >
            <ReceiptLongOutlinedIcon sx={{ fontSize: 18, color: colors.route[logScenario.route] }} />
            <ButtonBase
              onClick={() => pick(LOG_ID)}
              sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', gap: 1, textAlign: 'left', borderRadius: 1, py: 0.25 }}
            >
              <Pill color={colors.route[logScenario.route]} icon={ROUTE_ICON[logScenario.route]}>
                {c.log.chip} · {c.routeLabel[logScenario.route]}
                {log?.totalMs != null && ` · ${fmtMs(log.totalMs)}`}
              </Pill>
              <Box component="span" sx={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {logScenario.question}
              </Box>
            </ButtonBase>
            {onClearLog && (
              <IconButton size="small" onClick={onClearLog} title={c.log.close} aria-label={c.log.close}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 1.25 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>{c.pickLabel}</Typography>
          {c.examples.map((e) => {
            const selected = e.id === exampleId
            const color = colors.route[e.route]
            return (
              <ButtonBase
                key={e.id}
                onClick={() => pick(e.id)}
                title={c.routeLabel[e.route]}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  maxWidth: '100%',
                  px: 1.25,
                  py: 0.625,
                  borderRadius: 999,
                  border: 1.5,
                  borderColor: selected ? color : 'divider',
                  bgcolor: selected ? alpha(color, 0.12) : 'background.paper',
                  color: 'text.primary',
                  fontSize: 12.5,
                  fontWeight: selected ? 700 : 500,
                  transition: 'border-color 150ms, background-color 150ms',
                  '&:hover': { borderColor: color, bgcolor: alpha(color, 0.08) },
                }}
              >
                <Box component="span" sx={{ display: 'flex', color }}>{ROUTE_ICON[e.route]}</Box>
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.question}
                </Box>
              </ButtonBase>
            )
          })}
        </Box>
      </Paper>

      {/* Sơ đồ ngang – màn hẹp thì cuộn ngang */}
      <Paper elevation={0} sx={{ ...cardSx, flexShrink: 0, overflowX: 'auto', p: 1 }}>
        <Box
          component="svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={c.title(name)}
          sx={{
            display: 'block',
            width: '100%',
            // nhỏ hơn mức này chữ trong sơ đồ < ~11px → cuộn ngang thay vì co tiếp
            minWidth: 1000,
            height: 'auto',
            // màn rất rộng: không để sơ đồ cao quá, chừa chỗ cho phần giải thích
            maxHeight: '46vh',
            '& .flow': { strokeDasharray: '8 6', animation: `${dashFlow} 0.9s linear infinite` },
            '@media (prefers-reduced-motion: reduce)': { '& .flow': { animation: 'none' } },
          }}
        >
          <defs>
            {(Object.keys(edgeColor) as EdgeKind[]).map((k) => (
              <marker
                key={k}
                id={`${uid}-arrow-${k}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" fill={edgeColor[k]} />
              </marker>
            ))}
            <marker id={`${uid}-arrow-off`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={theme.palette.divider} />
            </marker>
          </defs>

          {/* 2 làn của 2 cách trả lời */}
          <g opacity={fastDimmed ? 0.3 : 1} style={{ transition: 'opacity 250ms' }}>
            <rect x={500} y={40} width={420} height={96} rx={14} fill={alpha(colors.lane.fast, 0.06)} stroke={alpha(colors.lane.fast, 0.4)} strokeDasharray="5 4" />
            <text x={516} y={58} fontSize={12} fontWeight={800} fill={colors.lane.fast}>{c.laneFast}</text>
          </g>
          <g opacity={aiDimmed ? 0.3 : 1} style={{ transition: 'opacity 250ms' }}>
            <rect x={500} y={222} width={420} height={130} rx={14} fill={alpha(colors.lane.ai, 0.06)} stroke={alpha(colors.lane.ai, 0.4)} strokeDasharray="5 4" />
            <text x={516} y={240} fontSize={12} fontWeight={800} fill={colors.lane.ai}>{c.laneAi}</text>
          </g>

          {/* mũi tên */}
          {EDGES.map((edge) => {
            const s = edgeState(edge)
            const blockedEdge = edge.kind === 'blocked'
            const flowing = s === 'passed' || (s === 'idle' && !blockedEdge)
            const opacity = s === 'off' ? 0.6 : s === 'pending' ? 0.35 : s === 'idle' && blockedEdge ? 0.5 : 1
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={edge.d}
                fill="none"
                stroke={s === 'off' ? theme.palette.divider : edgeColor[edge.kind]}
                strokeWidth={s === 'passed' ? 3 : 2}
                strokeOpacity={opacity}
                strokeLinecap="round"
                strokeDasharray={flowing ? undefined : '6 6'}
                className={flowing ? 'flow' : undefined}
                markerEnd={`url(#${uid}-arrow-${s === 'off' ? 'off' : edge.kind})`}
                style={{ transition: 'stroke-opacity 250ms' }}
              />
            )
          })}

          {/* nhãn trên mũi tên rẽ nhánh / đường tắt (viền nền để chữ không lẫn vào nét vẽ) */}
          {[
            { x: 432, y: 112, text: c.forkFast, color: colors.lane.fast, dim: fastDimmed },
            { x: 432, y: 294, text: c.forkAi, color: colors.lane.ai, dim: aiDimmed },
            { x: 645, y: 26, text: c.bypass, color: colors.route.blocked, dim: example !== null && example.route !== 'blocked' },
          ].map((l) => (
            <text
              key={l.text}
              x={l.x}
              y={l.y}
              textAnchor={l.y === 26 ? 'middle' : 'start'}
              fontSize={11.5}
              fontWeight={700}
              fill={l.color}
              stroke={theme.palette.background.paper}
              strokeWidth={4}
              paintOrder="stroke"
              opacity={l.dim ? 0.3 : 1}
            >
              {l.text}
            </text>
          ))}

          {/* chấm sáng chạy theo câu hỏi */}
          {activeEdge && (
            <circle key={`${exampleId}-${progress}`} r={6} fill={edgeColor[activeEdge.kind]} stroke="#fff" strokeWidth={2}>
              <animateMotion dur="0.7s" fill="freeze" path={activeEdge.d} />
            </circle>
          )}

          {/* các bước */}
          {(Object.keys(POS) as StepId[])
            .filter((id) => id !== 'template')
            .map((id) => <DiagramNode key={id} {...nodeProps(id)} />)}
          <TemplateNode {...nodeProps('template')} sub={c.templateSub} />
        </Box>
      </Paper>

      {/* Giải thích bước đang xem + khung chat */}
      <Box
        sx={{
          flex: 1,
          // màn quá thấp: giữ khung đủ đọc, trang ngoài cuộn
          minHeight: 220,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 360px' },
          gap: 1.25,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            p: 2,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            borderTop: 4,
            borderTopColor: focusColor,
          }}
        >
          <Box key={focus} sx={{ animation: `${fadeIn} 250ms ease-out`, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  bgcolor: focusColor,
                }}
              >
                {STEP_ICON[focus]}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: focusColor }}>
                  {language === 'en' ? 'Step' : 'Bước'} {STEP_NO[focus]}
                  {focusLane !== 'common' && ` · ${focusLane === 'fast' ? c.routeLabel.fast : c.routeLabel.ai}`}
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{c.steps[focus].title}</Typography>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 15, lineHeight: 1.65, color: 'text.secondary' }}>{c.steps[focus].body}</Typography>

            {example && (
              <Box
                sx={{
                  mt: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  borderLeft: 4,
                  borderColor: focusInPath ? focusColor : 'divider',
                  bgcolor: focusInPath ? alpha(focusColor, 0.1) : 'action.hover',
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
                  {c.forQuestion}: “{example.question}”
                </Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, mt: 0.25, lineHeight: 1.55 }}>
                  {focusInPath ? (focusNote ?? '✓') : c.notInPath}
                </Typography>
              </Box>
            )}

            {!example && (
              <Typography sx={{ mt: 1.5, fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>{c.idleHint}</Typography>
            )}
          </Box>

          {/* điều khiển chạy thử */}
          {example && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', gap: 0.5, flex: 1, minWidth: 120 }}>
                {example.path.map((id, i) => (
                  <Box
                    key={id}
                    onClick={() => goTo(i + 1)}
                    title={c.steps[id].short}
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      cursor: 'pointer',
                      bgcolor: i < progress ? colors.lane[STEP_LANE[id]] : 'action.selected',
                      transition: 'background-color 250ms',
                    }}
                  />
                ))}
              </Box>
              <Button size="small" startIcon={<ChevronLeftRoundedIcon />} disabled={progress <= 1} onClick={() => goTo(progress - 1)} sx={{ textTransform: 'none' }}>
                {c.prev}
              </Button>
              {finished ? (
                <Button size="small" variant="contained" startIcon={<ReplayRoundedIcon />} onClick={() => pick(example.id)} sx={{ textTransform: 'none' }}>
                  {c.replay}
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                  onClick={() => setPlaying((p) => !p)}
                  sx={{ textTransform: 'none', minWidth: 110 }}
                >
                  {playing ? c.pause : c.play}
                </Button>
              )}
              <Button size="small" endIcon={<ChevronRightRoundedIcon />} disabled={finished} onClick={() => goTo(progress + 1)} sx={{ textTransform: 'none' }}>
                {c.next}
              </Button>
            </Box>
          )}
        </Paper>

        {/* Khung chat minh họa */}
        <Paper elevation={0} sx={{ ...cardSx, minHeight: 0, overflowY: 'auto', bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {example ? (
            <>
              <Box sx={{ alignSelf: 'flex-end', maxWidth: '90%' }}>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', textAlign: 'right', mb: 0.25 }}>{c.you}</Typography>
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    borderRadius: '12px 12px 2px 12px',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: 13,
                  }}
                >
                  {example.question}
                </Box>
              </Box>

              <Box sx={{ alignSelf: 'flex-start', maxWidth: '94%', display: 'flex', gap: 0.75 }}>
                <Box sx={{ width: 30, height: 30, flexShrink: 0, '& svg': { width: '100%', height: '100%' } }}>
                  <MascotSvg waving={false} headOnly mood={finished ? (example.failed ? 'sad' : 'happy') : 'thinking'} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.25 }}>
                    {name}
                    {/* request thật: câu trả lời thật, không phải "có dạng" */}
                    {finished && !example.real && ` · ${c.answerLabel}`}
                  </Typography>
                  <Box
                    key={finished ? 'done' : 'running'}
                    sx={{
                      px: 1.25,
                      py: 0.75,
                      borderRadius: '12px 12px 12px 2px',
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: finished ? (example.failed ? 'error.main' : colors.route[example.route]) : 'divider',
                      color: finished ? (example.failed ? 'error.main' : 'text.primary') : 'text.secondary',
                      fontSize: 13,
                      fontStyle: finished ? 'normal' : 'italic',
                      wordBreak: 'break-word',
                      animation: `${fadeIn} 250ms ease-out`,
                    }}
                  >
                    {!finished
                      ? `${c.running} (${progress}/${total})`
                      : example.real && !example.failed && example.answer
                        ? <MascotMarkdown>{example.answer}</MascotMarkdown>
                        : example.answer || '–'}
                  </Box>
                  {finished && (
                    <Box sx={{ mt: 0.75 }}>
                      <Pill color={colors.route[example.route]} icon={ROUTE_ICON[example.route]}>
                        {c.routeLabel[example.route]}
                      </Pill>
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{c.chatIdle}</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Tham khảo */}
      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', fontWeight: 800 }}>
          <Box sx={{ flex: 1 }}>{c.more}</Box>
          <IconButton size="small" onClick={() => setMoreOpen(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack sx={{ gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 800, mb: 1 }}>{c.compareTitle}</Typography>
              <Box
                sx={{
                  ...cardSx,
                  p: 0,
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '140px 1fr 1fr' },
                  '& > div > div, & > .cell': { px: 1.25, py: 0.875, fontSize: 12.5, borderBottom: 1, borderColor: 'divider', lineHeight: 1.5 },
                }}
              >
                <Box className="cell" sx={{ display: { xs: 'none', sm: 'block' } }} />
                <Box className="cell" sx={{ fontWeight: 800, color: colors.lane.fast, bgcolor: alpha(colors.lane.fast, 0.08) }}>
                  {c.routeLabel.fast}
                </Box>
                <Box className="cell" sx={{ fontWeight: 800, color: colors.lane.ai, bgcolor: alpha(colors.lane.ai, 0.08) }}>
                  {c.routeLabel.ai}
                </Box>
                {c.compareRows.map((row) => (
                  <Box key={row.label} sx={{ display: 'contents' }}>
                    <Box sx={{ fontWeight: 700, bgcolor: 'action.hover' }}>{row.label}</Box>
                    <Box>{row.fast}</Box>
                    <Box>{row.ai}</Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {[
                { title: c.trustTitle, items: c.trust, color: colors.lane.fast },
                { title: c.limitsTitle, items: c.limits, color: theme.palette.warning.main },
              ].map((group) => (
                <Box key={group.title}>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, mb: 1 }}>{group.title}</Typography>
                  <Stack sx={{ gap: 1 }}>
                    {group.items.map((item) => (
                      <Box key={item.title} sx={{ ...cardSx, py: 1, borderLeft: 4, borderLeftColor: group.color }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{item.title}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>{item.body}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>

            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 800, mb: 1 }}>{c.glossaryTitle}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1 }}>
                {c.glossary.map((item) => (
                  <Box key={item.title} sx={{ ...cardSx, py: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'primary.main' }}>{item.title}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>{item.body}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
