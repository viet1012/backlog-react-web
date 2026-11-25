import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import {
  Alert,
  Box,
  Chip,
  Typography,
} from '@mui/material'
import type { MouseEvent, ReactNode } from 'react'

import {
  Code,
  CodeBlock,
  DocList,
  DocSection,
  DocTable,
  DocText,
  FlowDiagram,
  type FlowStep,
} from '../components/authGuide/AuthGuideParts'
import { GlassPanel } from '../components/common/GlassPanel'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { useI18n } from '../i18n/useI18n'
import { getAuthSession, type AuthSession } from '../services/authService'

// Tài liệu tĩnh (chỉ tiếng Việt), không gọi API. Chỉ ADMIN thấy (route + sidebar).

// =========================================================
// MỤC LỤC
// =========================================================

const SECTIONS = [
  { id: 'auth-guide-overview', title: 'Tổng quan các bảng' },
  { id: 'auth-guide-login', title: 'Flow đăng nhập' },
  { id: 'auth-guide-request', title: 'Flow mỗi request' },
  { id: 'auth-guide-assign', title: 'Gán vai trò bằng Assign' },
  { id: 'auth-guide-actions', title: 'Ý nghĩa Actions' },
  { id: 'auth-guide-new-screen', title: 'Thêm screen mới' },
  { id: 'auth-guide-troubleshoot', title: 'Xử lý sự cố' },
  { id: 'auth-guide-mine', title: 'Quyền của bạn' },
] as const

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const PREFIX = 'F2_ProductionControl_'

function Prefixed({ name }: { name: string }) {
  return (
    <Code>
      <Box component="span" sx={{ opacity: 0.55 }}>{PREFIX}</Box>
      {name}
    </Code>
  )
}

// =========================================================
// 1. TỔNG QUAN
// =========================================================

const TYPE_COLOR = {
  'Có sẵn': 'default',
  'Cấu hình': 'primary',
  'Lúc chạy': 'warning',
  'View': 'success',
} as const

function TypeChip({ type }: { type: keyof typeof TYPE_COLOR }) {
  return <Chip label={type} size="small" color={TYPE_COLOR[type]} variant="outlined" sx={{ height: 22, fontSize: 11.5 }} />
}

const TABLE_ROWS: ReactNode[][] = [
  [<Code>HSE_Patrol_Account</Code>, <TypeChip type="Có sẵn" />, 'Tài khoản và mật khẩu. Dùng chung với S-Patrol.'],
  [<Code>DATASPC</Code>, <TypeChip type="Có sẵn" />, 'Nhân sự (của HR).'],
  [<Prefixed name="ExtEmployee" />, <TypeChip type="Cấu hình" />, 'Người không có trong DATASPC, ví dụ chuyên gia Nhật.'],
  [<Prefixed name="App" />, <TypeChip type="Cấu hình" />, <>Danh sách ứng dụng: <Code>PCW</Code>, <Code>SPATROL</Code>.</>],
  [<Prefixed name="Assign" />, <TypeChip type="Cấu hình" />, 'Ai nhận vai trò nào.'],
  [<Prefixed name="RolePerm" />, <TypeChip type="Cấu hình" />, 'Vai trò được làm gì.'],
  [<Prefixed name="Session" />, <TypeChip type="Lúc chạy" />, 'Token đăng nhập. Chỉ lưu SHA-256 của token, giờ theo UTC.'],
  [
    <Code>vw_F2_ProductionControl_Employee</Code>,
    <TypeChip type="View" />,
    <>Gộp DATASPC và ExtEmployee; tính <Code>BandNo</Code>; <Code>IsActive = 0</Code> khi đã nghỉ việc.</>,
  ],
  [
    <Code>vw_F2_ProductionControl_EmpPerm</Code>,
    <TypeChip type="View" />,
    <>Quyền hiệu lực của từng nhân viên. <b>BE chỉ đọc view này.</b></>,
  ],
]

// =========================================================
// 2–3. FLOW
// =========================================================

const LOGIN_FLOW: FlowStep[] = [
  { title: 'Nhập MSNV và mật khẩu', detail: 'Màn hình đăng nhập' },
  { title: 'Kiểm tra HSE_Patrol_Account', detail: 'Đúng MSNV + mật khẩu' },
  { title: 'Tạo dòng Session, trả token', detail: 'DB chỉ lưu SHA-256 của token' },
  { title: 'FE lưu token', detail: 'Gửi kèm mọi request sau đó' },
  { title: <>Gọi <Code>/me</Code></>, detail: 'Lấy name, bộ phận, roles, perms' },
  { title: 'Sidebar và route sinh theo perms', detail: 'Không có quyền thì không thấy menu' },
]

const REQUEST_FLOW: FlowStep[] = [
  { title: <>FE gửi <Code>Authorization: Bearer</Code></>, detail: 'Token lấy lúc đăng nhập' },
  { title: 'Filter tra Session', fail: { code: '401', text: 'token sai hoặc hết hạn' } },
  { title: 'Lấy EmpCode', detail: 'Từ dòng Session hợp lệ' },
  { title: <><Code>@RequirePerm</Code> tra EmpPerm</>, fail: { code: '403', text: 'thiếu quyền' } },
  { title: 'Xử lý', detail: 'Trả dữ liệu' },
]

// =========================================================
// 4. ASSIGN
// =========================================================

const ASSIGN_KIND_ROWS: ReactNode[][] = [
  ['Mọi người', 'Mọi cột điều kiện để NULL', 'Ai đăng nhập cũng nhận vai trò'],
  ['Theo tổ chức', 'Fac / Dept / Section / … có giá trị', 'Nhân viên thuộc đúng tổ chức đó'],
  ['Theo Band', <Code>MaxBand</Code>, <>Nhân viên có <Code>BandNo ≤ MaxBand</Code></>],
  ['Gán riêng', <><Code>EmpCode</Code> + <Code>ValidTo</Code></>, 'Một người cụ thể, tự hết hiệu lực sau ValidTo'],
]

const PCW_RULE_ROWS: ReactNode[][] = [
  [<Code>USER</Code>, 'Mọi người'],
  [<Code>ADMIN</Code>, 'K Common + PE IT'],
  [<Code>PC</Code>, 'KP PC, KM PC, Guide PC và K Common/PC (Fac_2)'],
  [<Code>PRO</Code>, 'KP Pro, KM Pro, Guide Pro, PRO PE'],
  [<Code>COST_VIEW</Code>, 'Band ≤ 3'],
]

// =========================================================
// 5. ACTIONS
// =========================================================

const ACTIONS = [
  ['V', 'Xem'],
  ['C', 'Thêm'],
  ['E', 'Sửa'],
  ['D', 'Xóa'],
  ['X', 'Xuất / nhập file'],
  ['*', 'Tất cả'],
] as const

// =========================================================
// 6. THÊM SCREEN MỚI
// =========================================================

const YES = <CheckRoundedIcon sx={{ fontSize: 18, color: 'success.main', verticalAlign: 'middle' }} />
const NO = <Box component="span" sx={{ color: 'text.disabled' }}>–</Box>

const NEW_SCREEN_CASES: ReactNode[][] = [
  ['Dùng API cũ + feature cũ', YES, NO, NO, 'Chỉ thêm màn hình, perm trỏ feature đã có'],
  ['API cũ + feature mới', YES, NO, YES, 'API cũ vẫn kiểm tra feature cũ của nó'],
  ['API mới + feature cũ', YES, YES, NO, 'Endpoint mới gắn @RequirePerm feature cũ'],
  ['API mới + feature mới', YES, YES, YES, 'Đủ cả 3 phần'],
  ['Chỉ đổi người xem', NO, NO, YES, 'Thêm/sửa dòng RolePerm hoặc Assign'],
]

const SAMPLE_APP_PAGES = `// src/appPages.tsx — thêm 1 dòng
{
  path: '/planning/new-screen',
  labelKey: 'newScreen',            // + i18n: nav.newScreen (en, vi)
  icon: <ListAltOutlined />,
  perm: ['NEW_SCREEN', 'V'],
  element: <NewScreenPage />,
},`

const SAMPLE_CONTROLLER = `// Controller — chỉ khi có API mới
@GetMapping("/api/production-control/new-screen")
@RequirePerm(feature = "NEW_SCREEN", action = "V")   // "E" khi sửa, "X" khi xuất/nhập file
public List<NewScreenRow> list() {
    return service.list();
}`

const SAMPLE_SQL = `-- Chỉ khi role khác ADMIN cần thấy (ADMIN đã có '*')
INSERT INTO F2_ProductionControl_RolePerm (App, Role, Feature, Actions)
VALUES ('PCW', 'PC', 'NEW_SCREEN', 'V,X');`

// =========================================================
// 7. XỬ LÝ SỰ CỐ
// =========================================================

const TROUBLE_ROWS: ReactNode[][] = [
  [
    <>Failed to fetch / lỗi CORS</>,
    'Origin của FE chưa được khai báo',
    <>Thêm origin vào <Code>app.cors.allowed-origins</Code> ở BE</>,
  ],
  [<Code>401</Code>, 'Token hết hạn, bị thu hồi hoặc chưa gửi', 'Đăng nhập lại; kiểm tra header Authorization'],
  [
    <><Code>403</Code> hoặc menu không hiện</>,
    'Thiếu dòng RolePerm / Assign, hoặc tên feature bị lệch',
    'Thêm dòng còn thiếu; so tên FEATURE ở FE, BE, DB',
  ],
  ['Người mới không có quyền', 'Chưa có trong DATASPC', <>Thêm vào <Prefixed name="ExtEmployee" /></>],
  ['Người đã nghỉ việc mất quyền', <>Đúng thiết kế (<Code>IsActive = 0</Code>)</>, 'Không cần sửa'],
]

// =========================================================
// 8. QUYỀN CỦA BẠN
// =========================================================

const PERM_ACTIONS = ['V', 'C', 'E', 'D', 'X'] as const

interface PermRow {
  feature: string
  actions: Set<string>
}

function toActions(value: unknown): string[] {
  const list = Array.isArray(value) ? value : String(value ?? '').split(',')
  return list.map((a) => String(a).trim().toUpperCase()).filter(Boolean)
}

// Session hiện chưa có perms; khi /me trả perms (map feature → actions hoặc
// mảng { feature, actions }) bảng tự hiện
function readPerms(session: AuthSession | null): PermRow[] | null {
  const raw = (session as (AuthSession & { perms?: unknown }) | null)?.perms
  if (!raw || typeof raw !== 'object') return null

  const byFeature = new Map<string, Set<string>>()
  const add = (feature: string, actions: string[]) => {
    if (!feature) return
    const set = byFeature.get(feature) ?? new Set<string>()
    actions.forEach((a) => set.add(a))
    byFeature.set(feature, set)
  }

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        add(String(o.feature ?? o.Feature ?? '').trim(), toActions(o.actions ?? o.Actions))
      }
    })
  } else {
    Object.entries(raw as Record<string, unknown>).forEach(([feature, v]) => add(feature.trim(), toActions(v)))
  }

  return [...byFeature.entries()]
    .map(([feature, actions]) => ({ feature, actions }))
    .sort((a, b) => a.feature.localeCompare(b.feature))
}

function MyPermissions() {
  const session = getAuthSession()
  const perms = readPerms(session)

  if (!session) {
    return <Alert severity="warning">Chưa đăng nhập.</Alert>
  }

  const org = [session.fac, session.dept, session.section, session.line, session.group]
    .filter(Boolean)
    .join(' / ')

  const info: [string, ReactNode][] = [
    ['Nhân viên', `${session.employeeId}${session.name ? ` · ${session.name}` : ''}`],
    ['Bộ phận', org || '–'],
    [
      'Roles',
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {session.roles.map((role) => (
          <Chip key={role} label={role} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: 11.5 }} />
        ))}
      </Box>,
    ],
  ]

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {info.map(([label, value]) => (
          <Box key={label} sx={{ px: 1.25, py: 0.75, border: 1, borderColor: 'divider', borderRadius: 1.5, minWidth: 0 }}>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{label}</Typography>
            <Box sx={{ fontSize: 13.5, fontWeight: 600, wordBreak: 'break-word', mt: 0.25 }}>{value}</Box>
          </Box>
        ))}
      </Box>

      {perms && perms.length > 0 ? (
        <DocTable
          head={['Feature', ...PERM_ACTIONS]}
          align={['left', ...PERM_ACTIONS.map(() => 'center' as const)]}
          widths={[undefined, ...PERM_ACTIONS.map(() => '64px')]}
          rows={perms.map(({ feature, actions }) => [
            <Code>{feature}</Code>,
            ...PERM_ACTIONS.map((a) => (actions.has('*') || actions.has(a) ? YES : NO)),
          ])}
        />
      ) : (
        <Alert severity="info" variant="outlined">
          Phiên đăng nhập hiện chưa có danh sách perms (dữ liệu <Code>/me</Code> chỉ có roles).
          Bảng feature × actions sẽ tự hiện khi <Code>/me</Code> trả về perms.
        </Alert>
      )}
    </>
  )
}

// =========================================================
// PAGE
// =========================================================

export function AuthGuidePage() {
  const { t } = useI18n()

  return (
    <PageShell>
      <PageHeader title={t.nav.authGuide} subtitle="Đăng nhập, vai trò và quyền" />

      <GlassPanel sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: { xs: 1.5, md: 2.5 }, py: 1.5 }}>
        <Box sx={{ maxWidth: 1180, mx: 'auto' }}>

          {/* ===== MỤC LỤC ===== */}
          <Box component="nav" aria-label="Mục lục" sx={{ pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary', mb: 0.75 }}>
              MỤC LỤC
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {SECTIONS.map((s, i) => (
                <Chip
                  key={s.id}
                  component="a"
                  href={`#${s.id}`}
                  clickable
                  size="small"
                  variant="outlined"
                  label={`${i + 1}. ${s.title}`}
                  onClick={(e: MouseEvent) => {
                    e.preventDefault()
                    scrollToSection(s.id)
                  }}
                  sx={{ fontSize: 12 }}
                />
              ))}
            </Box>
          </Box>

          {/* ===== 1 ===== */}
          <DocSection id={SECTIONS[0].id} index={1} title="Tổng quan: các bảng dùng cho phân quyền">
            <DocText>
              Bảng cấu hình và bảng lúc chạy dùng prefix <Code>{PREFIX}</Code>. Hai bảng có sẵn dùng chung với hệ thống khác.
            </DocText>
            <DocTable
              head={['Tên', 'Loại', 'Vai trò']}
              widths={['34%', '110px', undefined]}
              rows={TABLE_ROWS}
            />
          </DocSection>

          {/* ===== 2 ===== */}
          <DocSection id={SECTIONS[1].id} index={2} title="Flow đăng nhập">
            <FlowDiagram steps={LOGIN_FLOW} />
          </DocSection>

          {/* ===== 3 ===== */}
          <DocSection id={SECTIONS[2].id} index={3} title="Flow mỗi request">
            <FlowDiagram steps={REQUEST_FLOW} />
            <Alert severity="info" variant="outlined">
              <Code>auth.enforce=false</Code>: chỉ ghi log <Code>would-deny</Code>, request vẫn chạy.{' '}
              <Code>auth.enforce=true</Code>: chặn thật (trả 401 / 403).
            </Alert>
          </DocSection>

          {/* ===== 4 ===== */}
          <DocSection id={SECTIONS[3].id} index={4} title="Cách gán vai trò bằng bảng Assign">
            <DocList
              items={[
                <>Cột <Code>NULL</Code> nghĩa là không xét; các cột có giá trị phải khớp tuyệt đối (<b>AND</b>).</>,
                <>Nhiều dòng thì cộng dồn vai trò (<b>OR</b>). Không có cơ chế cấm.</>,
              ]}
            />
            <DocText>4 kiểu dòng:</DocText>
            <DocTable head={['Kiểu', 'Cột điền', 'Ai nhận']} widths={['18%', '32%', undefined]} rows={ASSIGN_KIND_ROWS} />
            <DocText>Quy tắc PCW hiện tại:</DocText>
            <DocTable head={['Vai trò', 'Ai nhận']} widths={['140px', undefined]} rows={PCW_RULE_ROWS} />
          </DocSection>

          {/* ===== 5 ===== */}
          <DocSection id={SECTIONS[4].id} index={5} title="Ý nghĩa Actions">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {ACTIONS.map(([code, label]) => (
                <Box
                  key={code}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}
                >
                  <Code>{code}</Code>
                  <Typography sx={{ fontSize: 12.5 }}>{label}</Typography>
                </Box>
              ))}
            </Box>
            <DocText>
              Ví dụ: dòng RolePerm <Code>('PCW', 'PC', 'BACKLOG', 'V,X')</Code> nghĩa là vai trò <b>PC</b> của app <b>PCW</b> được
              xem và xuất / nhập file ở feature <b>BACKLOG</b>.
            </DocText>
          </DocSection>

          {/* ===== 6 ===== */}
          <DocSection id={SECTIONS[5].id} index={6} title="Cách thêm screen mới">
            <Alert severity="warning">
              <b>Tên FEATURE phải giống hệt nhau ở FE, BE và DB</b> (kể cả hoa / thường). Sai một chỗ thì chỉ ADMIN thấy màn hình.
            </Alert>

            <DocList
              items={[
                <><b>FE – luôn phải sửa:</b> component + 1 dòng trong <Code>appPages.tsx</Code> với perm <Code>['FEATURE', 'V']</Code> + i18n.</>,
                <><b>BE – chỉ khi có API mới:</b> endpoint + <Code>@RequirePerm("FEATURE", "V" / "E" / "X")</Code>.</>,
                <><b>DB – chỉ khi role khác ADMIN cần thấy:</b> <Code>INSERT</Code> vào RolePerm. ADMIN đã có <Code>'*'</Code>.</>,
              ]}
            />

            <DocTable
              head={['Trường hợp', 'FE', 'BE', 'DB', 'Ghi chú']}
              align={['left', 'center', 'center', 'center', 'left']}
              widths={['24%', '56px', '56px', '56px', undefined]}
              rows={NEW_SCREEN_CASES}
            />

            <DocText>Code mẫu (thay <Code>NEW_SCREEN</Code> bằng tên feature thật):</DocText>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
              <CodeBlock title="FE · appPages.tsx" code={SAMPLE_APP_PAGES} />
              <CodeBlock title="BE · Controller" code={SAMPLE_CONTROLLER} />
              <CodeBlock title="DB · RolePerm" code={SAMPLE_SQL} />
            </Box>
          </DocSection>

          {/* ===== 7 ===== */}
          <DocSection id={SECTIONS[6].id} index={7} title="Xử lý sự cố">
            <DocTable
              head={['Triệu chứng', 'Nguyên nhân', 'Cách sửa']}
              widths={['26%', '34%', undefined]}
              rows={TROUBLE_ROWS}
            />
          </DocSection>

          {/* ===== 8 ===== */}
          <DocSection id={SECTIONS[7].id} index={8} title="Quyền của bạn">
            <MyPermissions />
          </DocSection>
        </Box>
      </GlassPanel>
    </PageShell>
  )
}
