import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import KeyRoundedIcon from '@mui/icons-material/KeyRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import { Box, Button, ButtonBase, Paper, Typography, useTheme } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import { useEffect, useId, useState, type ReactNode } from 'react'

import { useI18n } from '../../i18n/useI18n'
import { uiTokens } from '../../theme/uiTokens'
import { codeFontFamily } from '../machineLocator/machineLocatorColors'

/*
 * Tab con "Cách hoạt động" của Phân quyền – cùng cách trình bày với tab "Luồng AI":
 * sơ đồ SVG 3 làn (Đăng nhập · Mỗi lần gọi API · Quyền tính từ DB) + chọn tình huống
 * để chạy từng bước + khung giải thích bước đang xem + khung kết quả. Chỉ minh họa, không gọi API.
 */

type StepId =
  | 'l1' | 'l2' | 'l3' | 'l4' | 'l5'
  | 'session'
  | 'r1' | 'r2' | 'r3' | 'r4' | 'r5'
  | 'd1' | 'd2' | 'd3' | 'd4'

type Lane = 'login' | 'request' | 'data' | 'db'
type Outcome = 'ok' | 'fail' | 'info'

const STEP_LANE: Record<StepId, Lane> = {
  l1: 'login', l2: 'login', l3: 'login', l4: 'login', l5: 'login',
  session: 'db',
  r1: 'request', r2: 'request', r3: 'request', r4: 'request', r5: 'request',
  d1: 'data', d2: 'data', d3: 'data', d4: 'db',
}

const STEP_ICON: Record<StepId, ReactNode> = {
  l1: <LoginRoundedIcon fontSize="small" />,
  l2: <KeyRoundedIcon fontSize="small" />,
  l3: <VerifiedUserOutlinedIcon fontSize="small" />,
  l4: <PersonSearchOutlinedIcon fontSize="small" />,
  l5: <MenuRoundedIcon fontSize="small" />,
  session: <StorageRoundedIcon fontSize="small" />,
  r1: <SendRoundedIcon fontSize="small" />,
  r2: <FilterAltOutlinedIcon fontSize="small" />,
  r3: <BadgeOutlinedIcon fontSize="small" />,
  r4: <ShieldOutlinedIcon fontSize="small" />,
  r5: <TaskAltRoundedIcon fontSize="small" />,
  d1: <GroupsOutlinedIcon fontSize="small" />,
  d2: <ManageAccountsOutlinedIcon fontSize="small" />,
  d3: <AccountTreeOutlinedIcon fontSize="small" />,
  d4: <StorageRoundedIcon fontSize="small" />,
}

// Số thứ tự trong làn (DB không đánh số)
const STEP_NO: Partial<Record<StepId, string>> = {
  l1: '1', l2: '2', l3: '3', l4: '4', l5: '5',
  r1: '1', r2: '2', r3: '3', r4: '4', r5: '5',
  d1: '1', d2: '2', d3: '3', d4: '4',
}

// ---- Sơ đồ: toạ độ trong viewBox ----
const VB_W = 1100
const VB_H = 530
const LOGIN_Y = 72
const SESSION_Y = 190
const REQ_Y = 300
const DATA_Y = 444

const POS: Record<StepId, { x: number; y: number }> = {
  l1: { x: 100, y: LOGIN_Y },
  l2: { x: 280, y: LOGIN_Y },
  l3: { x: 460, y: LOGIN_Y },
  l4: { x: 640, y: LOGIN_Y },
  l5: { x: 820, y: LOGIN_Y },
  session: { x: 460, y: SESSION_Y },
  r1: { x: 280, y: REQ_Y },
  r2: { x: 460, y: REQ_Y },
  r3: { x: 640, y: REQ_Y },
  r4: { x: 820, y: REQ_Y },
  r5: { x: 1000, y: REQ_Y },
  d1: { x: 280, y: DATA_Y },
  d2: { x: 460, y: DATA_Y },
  d3: { x: 640, y: DATA_Y },
  d4: { x: 820, y: DATA_Y },
}

interface Edge {
  from: StepId
  to: StepId
  d: string
  kind: Lane
}

const h = (a: StepId, b: StepId, kind: Lane): Edge => ({
  from: a,
  to: b,
  d: `M${POS[a].x + 30} ${POS[a].y} L${POS[b].x - 30} ${POS[b].y}`,
  kind,
})

const EDGES: Edge[] = [
  h('l1', 'l2', 'login'), h('l2', 'l3', 'login'), h('l3', 'l4', 'login'), h('l4', 'l5', 'login'),
  h('r1', 'r2', 'request'), h('r2', 'r3', 'request'), h('r3', 'r4', 'request'), h('r4', 'r5', 'request'),
  h('d1', 'd2', 'data'), h('d2', 'd3', 'data'), h('d3', 'd4', 'data'),
  // đăng nhập ghi Session, mỗi request đọc Session; @RequirePerm đọc EmpPerm
  { from: 'l3', to: 'session', d: `M460 ${LOGIN_Y + 48} L460 ${SESSION_Y - 24}`, kind: 'db' },
  { from: 'session', to: 'r2', d: `M460 ${SESSION_Y + 44} L460 ${REQ_Y - 28}`, kind: 'db' },
  { from: 'd4', to: 'r4', d: `M820 ${DATA_Y - 28} L820 ${REQ_Y + 62}`, kind: 'db' },
]

const STEP_MS = 1800

interface StepText {
  short: string
  sub?: string
  title: string
  body: string
}

interface Scenario {
  id: string
  outcome: Outcome
  label: string
  path: StepId[]
  /** Bước đọc / ghi bảng DB: tới bước đó thì bảng cũng sáng */
  uses?: Partial<Record<StepId, StepId>>
  failed?: StepId
  notes: Partial<Record<StepId, string>>
  request: string
  status: string
  message: string
}

interface FlowContent {
  title: string
  subtitle: string
  pickLabel: string
  lanes: Record<'login' | 'request' | 'data', string>
  idleHint: string
  forScenario: string
  notInPath: string
  step: string
  dbLabel: string
  prev: string
  next: string
  play: string
  pause: string
  replay: string
  result: string
  running: string
  resultIdle: string
  steps: Record<StepId, StepText>
  scenarios: Scenario[]
}

const LOGIN_URL = 'POST /api/production-control/auth/login'
const API_URL = 'GET /api/production-control/backlog'

const VI: FlowContent = {
  title: 'Phân quyền hoạt động thế nào?',
  subtitle: 'Chọn một tình huống để xem từng bước. Bấm vào ô bất kỳ trên sơ đồ để đọc giải thích.',
  pickLabel: 'Thử:',
  lanes: { login: 'ĐĂNG NHẬP · 1 LẦN', request: 'MỖI LẦN GỌI API', data: 'QUYỀN TÍNH TỪ DB' },
  idleHint: 'Chọn một tình huống ở trên để chạy thử.',
  forScenario: 'Trong tình huống',
  notInPath: 'Tình huống này không đi qua bước này.',
  step: 'Bước',
  dbLabel: 'Bảng DB',
  prev: 'Trước',
  next: 'Tiếp',
  play: 'Chạy',
  pause: 'Dừng',
  replay: 'Chạy lại',
  result: 'Kết quả',
  running: 'Đang xử lý…',
  resultIdle: 'Kết quả của tình huống sẽ hiện ở đây.',
  steps: {
    l1: { short: 'Nhập MSNV', title: 'Nhập MSNV + mật khẩu', body: 'Người dùng đăng nhập bằng tài khoản S-Patrol.' },
    l2: { short: 'Kiểm tra', sub: 'HSE_Patrol_Account', title: 'Kiểm tra tài khoản', body: 'BE so MSNV + mật khẩu với bảng HSE_Patrol_Account (dùng chung S-Patrol). Sai thì dừng ở đây.' },
    l3: { short: 'Tạo Session', title: 'Tạo Session, trả token', body: 'BE ghi 1 dòng vào bảng Session và trả token cho FE. FE lưu token để gửi kèm mọi request sau.' },
    l4: { short: '/me', title: 'FE gọi /me', body: 'Lấy tên, bộ phận, roles và perms của người đang đăng nhập.' },
    l5: { short: 'Menu', title: 'Menu và route theo perms', body: 'Sidebar và route sinh từ perms: không có quyền xem thì không thấy menu.' },
    session: { short: 'Session', title: 'Bảng Session', body: 'Phiên đăng nhập: chỉ lưu SHA-256 của token (không lưu token gốc), giờ theo UTC. Đăng nhập thì ghi, mỗi request thì đọc.' },
    r1: { short: 'Gửi token', sub: 'Bearer', title: 'FE gửi token', body: 'Mọi request kèm header Authorization: Bearer <token>.' },
    r2: { short: 'Tra Session', sub: 'Filter', title: 'Filter tra Session', body: 'Băm token rồi tìm trong Session. Không thấy, hết hạn hoặc bị thu hồi → 401.' },
    r3: { short: 'EmpCode', title: 'Lấy EmpCode', body: 'Từ dòng Session hợp lệ, BE biết ai đang gọi.' },
    r4: { short: 'Kiểm quyền', sub: '@RequirePerm', title: '@RequirePerm kiểm quyền', body: 'Endpoint khai báo feature + action (vd BACKLOG, V). BE tra view EmpPerm, thiếu quyền → 403. Khi auth.enforce=false thì chỉ ghi log "would-deny", chưa chặn thật.' },
    r5: { short: 'Xử lý', title: 'Xử lý request', body: 'Đủ quyền thì chạy và trả dữ liệu (200).' },
    d1: { short: 'Nhân sự', sub: 'DATASPC + ExtEmployee', title: 'Ai là nhân viên?', body: 'View Employee gộp DATASPC (HR) và ExtEmployee (người ngoài HR, vd chuyên gia Nhật), tính BandNo. Đã nghỉ việc → IsActive = 0, mất quyền.' },
    d2: { short: 'Assign', title: 'Assign: ai nhận vai trò nào', body: 'Trong 1 dòng, các cột có giá trị phải khớp hết (AND), cột NULL không xét. Khớp nhiều dòng thì cộng dồn vai trò (OR). Không có cơ chế cấm.' },
    d3: { short: 'RolePerm', title: 'RolePerm: vai trò được làm gì', body: "Mỗi dòng = app + vai trò + feature + actions, vd ('PCW', 'PC', 'BACKLOG', 'V,X'). V xem · C thêm · E sửa · D xóa · X xuất/nhập · * tất cả." },
    d4: { short: 'EmpPerm', sub: 'view', title: 'View EmpPerm: quyền hiệu lực', body: 'Gộp các bảng trên thành quyền của từng nhân viên. BE chỉ đọc view này.' },
  },
  scenarios: [
    {
      id: 'login-ok',
      outcome: 'ok',
      label: 'Đăng nhập',
      path: ['l1', 'l2', 'l3', 'l4', 'l5'],
      uses: { l3: 'session' },
      notes: { l2: 'MSNV + mật khẩu đúng.', l3: 'Ghi Session, FE nhận token.', l5: 'Menu chỉ hiện màn hình có quyền V.' },
      request: LOGIN_URL,
      status: '200 OK',
      message: 'Đăng nhập thành công, menu hiện theo perms.',
    },
    {
      id: 'login-fail',
      outcome: 'fail',
      label: 'Sai mật khẩu',
      path: ['l1', 'l2'],
      failed: 'l2',
      notes: { l2: 'Không khớp HSE_Patrol_Account → dừng, không tạo Session.' },
      request: LOGIN_URL,
      status: 'Lỗi đăng nhập',
      message: 'Sai MSNV hoặc mật khẩu.',
    },
    {
      id: 'api-ok',
      outcome: 'ok',
      label: 'Gọi API đủ quyền',
      path: ['r1', 'r2', 'r3', 'r4', 'r5'],
      uses: { r2: 'session', r4: 'd4' },
      notes: { r2: 'Token còn hạn.', r4: 'EmpPerm có BACKLOG · V.' },
      request: API_URL,
      status: '200 OK',
      message: 'Trả dữ liệu Backlog.',
    },
    {
      id: 'api-401',
      outcome: 'fail',
      label: 'Token hết hạn',
      path: ['r1', 'r2'],
      uses: { r2: 'session' },
      failed: 'r2',
      notes: { r2: 'Session đã hết hạn → dừng tại filter.' },
      request: API_URL,
      status: '401 Unauthorized',
      message: 'Đăng nhập lại để lấy token mới.',
    },
    {
      id: 'api-403',
      outcome: 'fail',
      label: 'Thiếu quyền',
      path: ['r1', 'r2', 'r3', 'r4'],
      uses: { r2: 'session', r4: 'd4' },
      failed: 'r4',
      notes: { r4: 'EmpPerm không có BACKLOG · V → chặn.' },
      request: API_URL,
      status: '403 Forbidden',
      message: 'Thiếu dòng RolePerm / Assign, hoặc lệch tên feature.',
    },
    {
      id: 'calc',
      outcome: 'info',
      label: 'Quyền được tính',
      path: ['d1', 'd2', 'd3', 'd4', 'r4'],
      notes: { d1: 'Nhân viên PC, Band 4, đang làm việc.', d2: 'Khớp dòng "KP PC" → vai trò PC (+ USER cho mọi người).', d3: "PC có ('PCW', 'PC', 'BACKLOG', 'V,X').", d4: 'EmpPerm: BACKLOG → V, X.', r4: 'Mọi API kiểm quyền bằng view này.' },
      request: 'vw_F2_ProductionControl_EmpPerm',
      status: 'BACKLOG · V, X',
      message: 'Được xem và xuất / nhập file Backlog.',
    },
  ],
}

const EN: FlowContent = {
  title: 'How do permissions work?',
  subtitle: 'Pick a scenario to walk through it step by step. Click any box on the diagram to read about it.',
  pickLabel: 'Try:',
  lanes: { login: 'LOGIN · ONCE', request: 'EVERY API CALL', data: 'ACCESS COMPUTED IN DB' },
  idleHint: 'Pick a scenario above to run it.',
  forScenario: 'In scenario',
  notInPath: 'This scenario does not go through this step.',
  step: 'Step',
  dbLabel: 'DB table',
  prev: 'Back',
  next: 'Next',
  play: 'Play',
  pause: 'Pause',
  replay: 'Replay',
  result: 'Result',
  running: 'Processing…',
  resultIdle: 'The scenario result shows here.',
  steps: {
    l1: { short: 'Enter ID', title: 'Enter ID + password', body: 'The user signs in with their S-Patrol account.' },
    l2: { short: 'Verify', sub: 'HSE_Patrol_Account', title: 'Verify the account', body: 'BE checks ID + password against HSE_Patrol_Account (shared with S-Patrol). Stops here if wrong.' },
    l3: { short: 'Create Session', title: 'Create Session, return token', body: 'BE writes a row to Session and returns a token. FE keeps it and sends it with every request.' },
    l4: { short: '/me', title: 'FE calls /me', body: 'Gets the name, department, roles and perms of the signed-in user.' },
    l5: { short: 'Menu', title: 'Menu and routes from perms', body: 'Sidebar and routes are built from perms: no view permission, no menu item.' },
    session: { short: 'Session', title: 'Session table', body: 'Login sessions: only the SHA-256 of the token is stored (never the token), times in UTC. Written at login, read on every request.' },
    r1: { short: 'Send token', sub: 'Bearer', title: 'FE sends the token', body: 'Every request carries Authorization: Bearer <token>.' },
    r2: { short: 'Check Session', sub: 'Filter', title: 'Filter checks Session', body: 'Hashes the token and looks it up in Session. Missing, expired or revoked → 401.' },
    r3: { short: 'EmpCode', title: 'Get EmpCode', body: 'From the valid Session row, BE knows who is calling.' },
    r4: { short: 'Check access', sub: '@RequirePerm', title: '@RequirePerm checks access', body: 'The endpoint declares feature + action (e.g. BACKLOG, V). BE looks it up in the EmpPerm view; missing → 403. With auth.enforce=false it only logs "would-deny" and does not block.' },
    r5: { short: 'Handle', title: 'Handle the request', body: 'Allowed → run and return data (200).' },
    d1: { short: 'People', sub: 'DATASPC + ExtEmployee', title: 'Who is an employee?', body: 'The Employee view merges DATASPC (HR) and ExtEmployee (people outside HR, e.g. Japanese experts) and computes BandNo. Left the company → IsActive = 0, no access.' },
    d2: { short: 'Assign', title: 'Assign: who gets which role', body: 'Within a row, filled columns must all match (AND); NULL columns are ignored. Matching several rows adds roles up (OR). There is no deny rule.' },
    d3: { short: 'RolePerm', title: 'RolePerm: what a role can do', body: "Each row = app + role + feature + actions, e.g. ('PCW', 'PC', 'BACKLOG', 'V,X'). V view · C create · E edit · D delete · X import/export · * all." },
    d4: { short: 'EmpPerm', sub: 'view', title: 'EmpPerm view: effective access', body: 'Combines the tables above into per-employee permissions. BE only reads this view.' },
  },
  scenarios: [
    {
      id: 'login-ok',
      outcome: 'ok',
      label: 'Log in',
      path: ['l1', 'l2', 'l3', 'l4', 'l5'],
      uses: { l3: 'session' },
      notes: { l2: 'ID + password match.', l3: 'Session written, FE gets the token.', l5: 'Menu only shows screens with V.' },
      request: LOGIN_URL,
      status: '200 OK',
      message: 'Signed in, menu built from perms.',
    },
    {
      id: 'login-fail',
      outcome: 'fail',
      label: 'Wrong password',
      path: ['l1', 'l2'],
      failed: 'l2',
      notes: { l2: 'No match in HSE_Patrol_Account → stop, no Session.' },
      request: LOGIN_URL,
      status: 'Login failed',
      message: 'Wrong ID or password.',
    },
    {
      id: 'api-ok',
      outcome: 'ok',
      label: 'API call allowed',
      path: ['r1', 'r2', 'r3', 'r4', 'r5'],
      uses: { r2: 'session', r4: 'd4' },
      notes: { r2: 'Token still valid.', r4: 'EmpPerm has BACKLOG · V.' },
      request: API_URL,
      status: '200 OK',
      message: 'Backlog data returned.',
    },
    {
      id: 'api-401',
      outcome: 'fail',
      label: 'Token expired',
      path: ['r1', 'r2'],
      uses: { r2: 'session' },
      failed: 'r2',
      notes: { r2: 'Session expired → stop at the filter.' },
      request: API_URL,
      status: '401 Unauthorized',
      message: 'Log in again to get a new token.',
    },
    {
      id: 'api-403',
      outcome: 'fail',
      label: 'No permission',
      path: ['r1', 'r2', 'r3', 'r4'],
      uses: { r2: 'session', r4: 'd4' },
      failed: 'r4',
      notes: { r4: 'EmpPerm has no BACKLOG · V → blocked.' },
      request: API_URL,
      status: '403 Forbidden',
      message: 'Missing RolePerm / Assign row, or feature name mismatch.',
    },
    {
      id: 'calc',
      outcome: 'info',
      label: 'How access is computed',
      path: ['d1', 'd2', 'd3', 'd4', 'r4'],
      notes: { d1: 'PC employee, band 4, active.', d2: 'Matches the "KP PC" row → role PC (+ USER for everyone).', d3: "PC has ('PCW', 'PC', 'BACKLOG', 'V,X').", d4: 'EmpPerm: BACKLOG → V, X.', r4: 'Every API checks access with this view.' },
      request: 'vw_F2_ProductionControl_EmpPerm',
      status: 'BACKLOG · V, X',
      message: 'Can view and import / export Backlog.',
    },
  ],
}

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 var(--pulse-color); }
  70% { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
`

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
    login: theme.palette.primary.main,
    request: dark ? '#34D399' : '#059669',
    data: dark ? '#A78BFA' : '#7C3AED',
    db: dark ? '#FBBF24' : '#D97706',
  }
  const outcome: Record<Outcome, string> = {
    ok: theme.palette.success.main,
    fail: theme.palette.error.main,
    info: lane.data,
  }
  return { lane, outcome }
}

const OUTCOME_ICON: Record<Outcome, ReactNode> = {
  ok: <CheckRoundedIcon sx={{ fontSize: 16 }} />,
  fail: <BlockRoundedIcon sx={{ fontSize: 16 }} />,
  info: <StorageRoundedIcon sx={{ fontSize: 16 }} />,
}

const cardSx = {
  p: 1.5,
  borderRadius: uiTokens.card.borderRadius,
  border: 1,
  borderColor: 'divider',
} as const

// viên nhãn tự vẽ (Chip của theme có nền trắng mờ – xem ghi chú trong AiFlowPanel)
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
        fontSize: 12.5,
        fontWeight: 800,
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

const dimOpacity = (state: StepState) => (state === 'dimmed' ? 0.25 : state === 'pending' ? 0.5 : 1)

interface NodeProps {
  id: StepId
  label: string
  sub?: string
  color: string
  state: StepState
  focused: boolean
  failed: boolean
  onClick: () => void
}

// Bước = nút tròn; bảng DB = ô vuông viền. Tên ngắn + dòng phụ bên dưới (foreignObject trong SVG)
function DiagramNode({ id, label, sub, color, state, focused, failed, onClick }: NodeProps) {
  const db = STEP_LANE[id] === 'db'
  const pending = state === 'pending'
  const { x, y } = POS[id]
  const fill = pending ? 'text.disabled' : color
  const size = db ? 40 : 48

  return (
    <foreignObject x={x - 64} y={y - size / 2} width={128} height={100} style={{ overflow: 'visible' }}>
      <ButtonBase
        onClick={onClick}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          borderRadius: 2,
          opacity: dimOpacity(state),
          transition: 'opacity 250ms',
          '&:hover .node-shape': { transform: 'scale(1.08)' },
        }}
      >
        <Box
          className="node-shape"
          sx={{
            '--pulse-color': alpha(color, 0.55),
            width: size,
            height: size,
            borderRadius: db ? '10px' : '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: db ? fill : '#fff',
            bgcolor: db ? 'background.paper' : fill,
            border: db ? 2 : 0,
            borderColor: fill,
            boxShadow: focused ? `0 0 0 3px ${alpha(color, 0.35)}` : 'none',
            transition: 'transform 150ms, box-shadow 150ms',
            animation: state === 'current' ? `${pulse} 1.2s ease-out infinite` : 'none',
          }}
        >
          {failed ? <ErrorOutlineRoundedIcon fontSize="small" /> : state === 'done' && !db ? <CheckRoundedIcon fontSize="small" /> : STEP_ICON[id]}
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
            whiteSpace: 'nowrap',
          }}
        >
          {STEP_NO[id] && (
            <Box component="span" sx={{ fontSize: 10.5, fontWeight: 800, color: pending ? 'text.disabled' : color }}>
              {STEP_NO[id]}
            </Box>
          )}
          {label}
        </Box>
        {sub && (
          <Box component="span" sx={{ mt: '-2px', fontFamily: codeFontFamily, fontSize: 10.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {sub}
          </Box>
        )}
      </ButtonBase>
    </foreignObject>
  )
}

export function AuthFlowDiagram() {
  const { language } = useI18n()
  const c = language === 'en' ? EN : VI
  const colors = useColors()
  const theme = useTheme()
  const uid = `authflow${useId().replace(/:/g, '')}`

  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [focus, setFocus] = useState<StepId>('l1')

  const scenario = c.scenarios.find((s) => s.id === scenarioId) ?? null
  const total = scenario?.path.length ?? 0
  const finished = scenario !== null && progress >= total

  useEffect(() => {
    if (!scenario || !playing || finished) return
    const timer = window.setTimeout(() => {
      const next = progress + 1
      setProgress(next)
      setFocus(scenario.path[next - 1])
      if (next >= scenario.path.length) setPlaying(false)
    }, STEP_MS)
    return () => window.clearTimeout(timer)
  }, [scenario, playing, finished, progress])

  function pick(id: string) {
    const s = c.scenarios.find((x) => x.id === id)
    if (!s) return
    setScenarioId(id)
    setProgress(1)
    setFocus(s.path[0])
    setPlaying(true)
  }

  function goTo(step: number) {
    if (!scenario) return
    const clamped = Math.min(Math.max(step, 1), total)
    setPlaying(false)
    setProgress(clamped)
    setFocus(scenario.path[clamped - 1])
  }

  function clickNode(id: StepId) {
    const index = scenario?.path.indexOf(id) ?? -1
    if (scenario && index >= 0) {
      goTo(index + 1)
    } else {
      setPlaying(false)
      setFocus(id)
    }
  }

  // bước trong đường đi của tình huống; bảng DB lấy theo bước đọc / ghi nó
  function pathIndex(id: StepId): number {
    if (!scenario) return -1
    const direct = scenario.path.indexOf(id)
    if (direct >= 0) return direct
    const user = (Object.keys(scenario.uses ?? {}) as StepId[]).find((step) => scenario.uses?.[step] === id)
    return user ? scenario.path.indexOf(user) : -1
  }

  function stateOf(id: StepId): StepState {
    if (!scenario) return 'normal'
    const index = pathIndex(id)
    if (index < 0) return 'dimmed'
    if (index < progress - 1 || (finished && index === progress - 1)) return 'done'
    if (index === progress - 1) return 'current'
    return 'pending'
  }

  function edgeState(edge: Edge): 'idle' | 'passed' | 'pending' | 'off' {
    if (!scenario) return 'idle'
    const from = scenario.path.indexOf(edge.from)
    const to = scenario.path.indexOf(edge.to)
    if (from >= 0 && to === from + 1) return to <= progress - 1 ? 'passed' : 'pending'
    // cạnh nối bước với bảng DB nó dùng
    const uses = scenario.uses ?? {}
    const step = uses[edge.from] === edge.to ? edge.from : uses[edge.to] === edge.from ? edge.to : null
    if (step) return scenario.path.indexOf(step) <= progress - 1 ? 'passed' : 'pending'
    return 'off'
  }

  const activeEdge = scenario && progress >= 2
    ? EDGES.find((e) => e.from === scenario.path[progress - 2] && e.to === scenario.path[progress - 1])
    : undefined

  function nodeProps(id: StepId): NodeProps {
    const state = stateOf(id)
    const reached = state === 'done' || state === 'current'
    const failed = reached && scenario?.failed === id
    return {
      id,
      label: c.steps[id].short,
      sub: c.steps[id].sub,
      color: failed ? theme.palette.error.main : colors.lane[STEP_LANE[id]],
      state,
      focused: focus === id,
      failed,
      onClick: () => clickNode(id),
    }
  }

  const laneDim = (lane: Lane) => scenario !== null && !scenario.path.some((id) => STEP_LANE[id] === lane)
  const focusLane = STEP_LANE[focus]
  const focusColor = scenario?.failed === focus ? theme.palette.error.main : colors.lane[focusLane]
  const focusInPath = !scenario || pathIndex(focus) >= 0
  const focusNote = scenario?.notes[focus]
  const laneName = focusLane === 'db' ? c.dbLabel : c.lanes[focusLane]

  const lanes: { lane: 'login' | 'request' | 'data'; x: number; y: number; w: number }[] = [
    { lane: 'login', x: 24, y: 12, w: 880 },
    { lane: 'request', x: 200, y: REQ_Y - 56, w: 876 },
    { lane: 'data', x: 200, y: DATA_Y - 56, w: 704 },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {/* Tiêu đề + chọn tình huống */}
      <Paper elevation={0} sx={{ ...cardSx, py: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              bgcolor: colors.lane.login,
            }}
          >
            <ShieldOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{c.title}</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{c.subtitle}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 1.25 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>{c.pickLabel}</Typography>
          {c.scenarios.map((s) => {
            const selected = s.id === scenarioId
            const color = colors.outcome[s.outcome]
            return (
              <ButtonBase
                key={s.id}
                onClick={() => pick(s.id)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
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
                <Box component="span" sx={{ display: 'flex', color }}>{OUTCOME_ICON[s.outcome]}</Box>
                {s.label}
              </ButtonBase>
            )
          })}
        </Box>
      </Paper>

      {/* Sơ đồ – màn hẹp thì cuộn ngang */}
      <Paper elevation={0} sx={{ ...cardSx, overflowX: 'auto', p: 1 }}>
        <Box
          component="svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={c.title}
          sx={{
            display: 'block',
            width: '100%',
            minWidth: 900,
            height: 'auto',
            '& .flow': { strokeDasharray: '8 6', animation: `${dashFlow} 0.9s linear infinite` },
            '@media (prefers-reduced-motion: reduce)': { '& .flow': { animation: 'none' } },
          }}
        >
          <defs>
            {(Object.keys(colors.lane) as Lane[]).map((k) => (
              <marker key={k} id={`${uid}-arrow-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill={colors.lane[k]} />
              </marker>
            ))}
            <marker id={`${uid}-arrow-off`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={theme.palette.divider} />
            </marker>
          </defs>

          {/* 3 làn */}
          {lanes.map((l) => (
            <g key={l.lane} opacity={laneDim(l.lane) ? 0.35 : 1} style={{ transition: 'opacity 250ms' }}>
              <rect
                x={l.x}
                y={l.y}
                width={l.w}
                height={128}
                rx={14}
                fill={alpha(colors.lane[l.lane], 0.05)}
                stroke={alpha(colors.lane[l.lane], 0.4)}
                strokeDasharray="5 4"
              />
              <text x={l.x + 16} y={l.y + 20} fontSize={12} fontWeight={800} fill={colors.lane[l.lane]}>
                {c.lanes[l.lane]}
              </text>
            </g>
          ))}

          {/* mũi tên */}
          {EDGES.map((edge) => {
            const s = edgeState(edge)
            const flowing = s === 'passed' || s === 'idle'
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={edge.d}
                fill="none"
                stroke={s === 'off' ? theme.palette.divider : colors.lane[edge.kind]}
                strokeWidth={s === 'passed' ? 3 : 2}
                strokeOpacity={s === 'off' ? 0.6 : s === 'pending' ? 0.35 : 1}
                strokeLinecap="round"
                strokeDasharray={flowing ? undefined : '6 6'}
                className={flowing ? 'flow' : undefined}
                markerEnd={`url(#${uid}-arrow-${s === 'off' ? 'off' : edge.kind})`}
                style={{ transition: 'stroke-opacity 250ms' }}
              />
            )
          })}

          {/* chấm sáng chạy theo bước vừa tới */}
          {activeEdge && (
            <circle key={`${scenarioId}-${progress}`} r={6} fill={colors.lane[activeEdge.kind]} stroke="#fff" strokeWidth={2}>
              <animateMotion dur="0.7s" fill="freeze" path={activeEdge.d} />
            </circle>
          )}

          {(Object.keys(POS) as StepId[]).map((id) => <DiagramNode key={id} {...nodeProps(id)} />)}
        </Box>
      </Paper>

      {/* Giải thích bước đang xem + kết quả */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' }, gap: 1.25 }}>
        <Paper elevation={0} sx={{ ...cardSx, p: 2, display: 'flex', flexDirection: 'column', borderTop: 4, borderTopColor: focusColor }}>
          <Box key={focus} sx={{ animation: `${fadeIn} 250ms ease-out`, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  borderRadius: focusLane === 'db' ? '10px' : '50%',
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
                  {STEP_NO[focus] ? `${c.step} ${STEP_NO[focus]} · ` : ''}{laneName}
                </Typography>
                <Typography sx={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3 }}>{c.steps[focus].title}</Typography>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 14.5, lineHeight: 1.65, color: 'text.secondary' }}>{c.steps[focus].body}</Typography>

            {scenario && (
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
                  {c.forScenario}: “{scenario.label}”
                </Typography>
                <Typography sx={{ fontSize: 14.5, fontWeight: 600, mt: 0.25, lineHeight: 1.55 }}>
                  {focusInPath ? (focusNote ?? '✓') : c.notInPath}
                </Typography>
              </Box>
            )}

            {!scenario && (
              <Typography sx={{ mt: 1.5, fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>{c.idleHint}</Typography>
            )}
          </Box>

          {/* điều khiển chạy thử */}
          {scenario && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', gap: 0.5, flex: 1, minWidth: 120 }}>
                {scenario.path.map((id, i) => (
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
                <Button size="small" variant="contained" startIcon={<ReplayRoundedIcon />} onClick={() => pick(scenario.id)} sx={{ textTransform: 'none' }}>
                  {c.replay}
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                  onClick={() => setPlaying((p) => !p)}
                  sx={{ textTransform: 'none', minWidth: 96 }}
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

        {/* Kết quả */}
        <Paper elevation={0} sx={{ ...cardSx, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {c.result}
          </Typography>

          {scenario ? (
            <>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  fontFamily: codeFontFamily,
                  fontSize: 12,
                  overflowWrap: 'anywhere',
                }}
              >
                {scenario.request}
              </Box>

              <Box key={finished ? 'done' : 'running'} sx={{ animation: `${fadeIn} 250ms ease-out` }}>
                {finished ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
                    <Pill color={colors.outcome[scenario.outcome]} icon={OUTCOME_ICON[scenario.outcome]}>
                      {scenario.status}
                    </Pill>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>{scenario.message}</Typography>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>
                    {c.running} ({progress}/{total})
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{c.resultIdle}</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  )
}
