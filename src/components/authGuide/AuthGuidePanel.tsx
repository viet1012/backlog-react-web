import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded'
import {
  Alert,
  Box,
  ButtonBase,
  Chip,
  Divider,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'

import { useI18n } from '../../i18n/useI18n'
import type { AuthUser } from '../../services/authService'
import { useAuth } from '../auth/useAuth'
import { codeFontFamily } from '../machineLocator/machineLocatorColors'
import {
  Block,
  Card,
  Code,
  CodeBlock,
  DocTable,
} from './AuthGuideParts'
import { AssignReference, AssignSimulator } from './AssignSimulator'
import { AuthFlowDiagram } from './AuthFlowDiagram'
import type { AuthGuideSection } from './authGuideSections'

// Tài liệu tĩnh (vi / en), không gọi API. Tab "Phân quyền" của trang Admin.

const PREFIX = 'F2_ProductionControl_'

/** true = tiếng Anh. Mỗi chuỗi viết dạng en ? '...' : '...' ngay tại chỗ dùng. */
function useEn() {
  return useI18n().language === 'en'
}

const YES = <CheckRoundedIcon sx={{ fontSize: 18, color: 'success.main', verticalAlign: 'middle' }} />
const NO = <Box component="span" sx={{ color: 'text.disabled' }}>–</Box>

function Grid({ min = 220, children }: { min?: number; children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}px), 1fr))`, gap: 1 }}>
      {children}
    </Box>
  )
}

function CardTitle({ children }: { children: ReactNode }) {
  return <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>{children}</Typography>
}

function CardText({ children }: { children: ReactNode }) {
  return <Typography component="div" sx={{ fontSize: 12.5, lineHeight: 1.6, color: 'text.secondary' }}>{children}</Typography>
}

// =========================================================
// BẢNG DỮ LIỆU
// =========================================================

interface TableGroup {
  label: string
  hint: string
  color: 'grey' | 'primary' | 'warning' | 'success'
  /** [tên ngắn, tên đầy đủ (tooltip), dùng để] */
  items: [string, string, ReactNode][]
}

function Tables() {
  const en = useEn()
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const colorOf = (c: TableGroup['color']) => (c === 'grey' ? theme.palette.text.secondary : theme.palette[c].main)

  const groups: TableGroup[] = [
    {
      label: en ? 'Existing' : 'Có sẵn',
      hint: en ? 'owned by other systems' : 'của hệ thống khác, không sửa',
      color: 'grey',
      items: [
        ['HSE_Patrol_Account', 'HSE_Patrol_Account', en ? 'Accounts + passwords (shared with S-Patrol)' : 'Tài khoản + mật khẩu (dùng chung S-Patrol)'],
        ['DATASPC', 'DATASPC', en ? 'HR employees' : 'Nhân sự của HR'],
      ],
    },
    {
      label: en ? 'Config' : 'Cấu hình',
      hint: en ? 'edited by admins' : 'admin sửa khi đổi quyền',
      color: 'primary',
      items: [
        ['ExtEmployee', `${PREFIX}ExtEmployee`, en ? 'People not in DATASPC (e.g. Japanese experts)' : 'Người không có trong DATASPC (vd chuyên gia Nhật)'],
        ['App', `${PREFIX}App`, 'PCW, SPATROL'],
        ['Assign', `${PREFIX}Assign`, en ? 'Who gets which role' : 'Ai nhận vai trò nào'],
        ['RolePerm', `${PREFIX}RolePerm`, en ? 'What each role can do' : 'Vai trò được làm gì'],
      ],
    },
    {
      label: en ? 'Runtime' : 'Lúc chạy',
      hint: en ? 'written by the system' : 'hệ thống tự ghi',
      color: 'warning',
      items: [
        ['Session', `${PREFIX}Session`, en ? 'Login tokens (SHA-256 only, UTC)' : 'Token đăng nhập (chỉ lưu SHA-256, giờ UTC)'],
      ],
    },
    {
      label: 'View',
      hint: en ? 'computed, read-only' : 'tự tính, chỉ đọc',
      color: 'success',
      items: [
        ['Employee', 'vw_F2_ProductionControl_Employee', en ? 'DATASPC + ExtEmployee, BandNo; left company → IsActive = 0' : 'DATASPC + ExtEmployee, tính BandNo; nghỉ việc → IsActive = 0'],
        ['EmpPerm', 'vw_F2_ProductionControl_EmpPerm', <>{en ? 'Effective permissions — ' : 'Quyền hiệu lực — '}<b>{en ? 'the only view BE reads' : 'BE chỉ đọc view này'}</b></>],
      ],
    },
  ]

  return (
    <Block
      title={en ? 'Tables used for permissions' : 'Các bảng dùng cho phân quyền'}
      hint={<>{en ? 'Full name' : 'Tên đầy đủ'}: <Code>{PREFIX}</Code>… / <Code>vw_{PREFIX}</Code>… {en ? '(hover a name)' : '(rê chuột vào tên)'}</>}
    >
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
        {groups.map((group, g) => {
          const color = colorOf(group.color)
          return (
            <Box key={group.color} sx={{ borderTop: g > 0 ? 1 : 0, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, bgcolor: alpha(color, dark ? 0.12 : 0.06) }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color }}>{group.label}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>— {group.hint}</Typography>
              </Box>

              {group.items.map(([name, full, role]) => (
                <Box
                  key={full}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '200px minmax(0, 1fr)' },
                    columnGap: 2,
                    rowGap: 0.25,
                    alignItems: 'baseline',
                    px: 1.5,
                    py: 0.875,
                    borderTop: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.03) },
                  }}
                >
                  <Typography title={full} sx={{ fontFamily: codeFontFamily, fontSize: 13, fontWeight: 700, overflowWrap: 'anywhere' }}>
                    {name}
                  </Typography>
                  <Typography component="div" sx={{ fontSize: 12.5, lineHeight: 1.55, color: 'text.secondary' }}>
                    {role}
                  </Typography>
                </Box>
              ))}
            </Box>
          )
        })}
      </Box>
    </Block>
  )
}

// =========================================================
// GÁN QUYỀN
// =========================================================

function Roles() {
  return (
    <>
      <AssignSimulator />
      <Divider />
      <AssignReference />
    </>
  )
}

// =========================================================
// THÊM MÀN HÌNH
// =========================================================

type Part = 'fe' | 'be' | 'db'
const PARTS: Part[] = ['fe', 'be', 'db']

const SAMPLE_CODE: Record<Part, { title: string; code: string }> = {
  fe: {
    title: 'FE · appPages.tsx',
    code: `{
  path: '/planning/new-screen',
  labelKey: 'newScreen',        // + i18n nav.newScreen (en, vi)
  icon: <ListAltOutlined />,
  perm: ['NEW_SCREEN', 'V'],
  element: <NewScreenPage />,
},`,
  },
  be: {
    title: 'BE · Controller',
    code: `@GetMapping("/api/production-control/new-screen")
@RequirePerm(feature = "NEW_SCREEN", action = "V")  // "E" edit, "X" import/export
public List<NewScreenRow> list() {
    return service.list();
}`,
  },
  db: {
    title: 'DB · RolePerm',
    code: `INSERT INTO F2_ProductionControl_RolePerm (App, Role, Feature, Actions)
VALUES ('PCW', 'PC', 'NEW_SCREEN', 'V,X');`,
  },
}

function NewScreen() {
  const en = useEn()
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const cases: { id: string; label: string; parts: Part[]; dbText?: string }[] = [
    { id: 'old-old', label: en ? 'Old API + old feature' : 'API cũ + feature cũ', parts: ['fe'] },
    { id: 'old-new', label: en ? 'Old API + new feature' : 'API cũ + feature mới', parts: ['fe', 'db'] },
    { id: 'new-old', label: en ? 'New API + old feature' : 'API mới + feature cũ', parts: ['fe', 'be'] },
    { id: 'new-new', label: en ? 'New API + new feature' : 'API mới + feature mới', parts: ['fe', 'be', 'db'] },
    {
      id: 'viewer',
      label: en ? 'Only change who sees it' : 'Chỉ đổi người xem',
      parts: ['db'],
      dbText: en ? 'Add / edit RolePerm or Assign rows.' : 'Thêm / sửa dòng RolePerm hoặc Assign.',
    },
  ]

  const partInfo: Record<Part, { todo: ReactNode; skip: string }> = {
    fe: {
      todo: <>{en ? 'Component + 1 line in' : 'Component + 1 dòng'} <Code>appPages.tsx</Code> (perm <Code>['FEATURE','V']</Code>) + i18n</>,
      skip: en ? 'No change' : 'Không đổi',
    },
    be: {
      todo: <>{en ? 'Endpoint +' : 'Endpoint +'} <Code>@RequirePerm</Code> (V / E / X)</>,
      skip: en ? 'Reuse existing API' : 'Dùng API có sẵn',
    },
    db: {
      todo: <>INSERT RolePerm. {en ? 'Skip if only ADMIN needs it' : 'Bỏ qua nếu chỉ ADMIN cần thấy'} (<Code>'*'</Code>)</>,
      skip: en ? 'No change' : 'Không đổi',
    },
  }

  const [caseId, setCaseId] = useState('new-new')
  const current = cases.find((c) => c.id === caseId) ?? cases[0]

  return (
    <>
      <Alert severity="warning" sx={{ py: 0.25 }}>
        {en
          ? <>The <b>FEATURE</b> name must be identical in FE, BE and DB — otherwise only ADMIN sees the screen.</>
          : <>Tên <b>FEATURE</b> phải giống hệt nhau ở FE, BE và DB — lệch thì chỉ ADMIN thấy màn hình.</>}
      </Alert>

      <Block title={en ? 'What are you doing?' : 'Bạn đang làm gì?'}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '240px minmax(0, 1fr)' }, gap: 1.5 }}>
          <Box role="radiogroup" sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: 'wrap', gap: 0.5 }}>
            {cases.map((c) => {
              const active = c.id === caseId
              return (
                <ButtonBase
                  key={c.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCaseId(c.id)}
                  sx={{
                    justifyContent: 'space-between',
                    gap: 1,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: 1,
                    textAlign: 'left',
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    borderColor: active ? 'primary.main' : 'divider',
                    color: active ? 'primary.main' : 'text.primary',
                    bgcolor: active ? alpha(theme.palette.primary.main, dark ? 0.14 : 0.07) : 'transparent',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  {c.label}
                  <Box component="span" sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {c.parts.map((p) => p.toUpperCase()).join(' · ')}
                  </Box>
                </ButtonBase>
              )
            })}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
              {PARTS.map((p) => {
                const needed = current.parts.includes(p)
                return (
                  <Card key={p} accent={needed ? theme.palette.success.main : undefined} sx={{ opacity: needed ? 1 : 0.6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                      {needed
                        ? <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        : <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
                      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                        {p.toUpperCase()} · {needed ? (en ? 'Change' : 'Cần sửa') : (en ? 'Skip' : 'Không cần')}
                      </Typography>
                    </Box>
                    <CardText>
                      {needed ? (p === 'db' && current.dbText ? current.dbText : partInfo[p].todo) : partInfo[p].skip}
                    </CardText>
                  </Card>
                )
              })}
            </Box>

            {current.id !== 'viewer' && current.parts.map((p) => (
              <CodeBlock key={p} title={SAMPLE_CODE[p].title} code={SAMPLE_CODE[p].code} />
            ))}
          </Box>
        </Box>
      </Block>
    </>
  )
}

// =========================================================
// SỰ CỐ
// =========================================================

function Trouble() {
  const en = useEn()
  const theme = useTheme()

  const items: { symptom: string; cause: ReactNode; fix: ReactNode; ok?: boolean }[] = [
    {
      symptom: en ? 'Failed to fetch / CORS error' : 'Failed to fetch / lỗi CORS',
      cause: en ? 'FE origin not allowed' : 'Origin của FE chưa khai báo',
      fix: <>{en ? 'Add it to' : 'Thêm vào'} <Code>app.cors.allowed-origins</Code></>,
    },
    {
      symptom: '401',
      cause: en ? 'Token expired, revoked or missing' : 'Token hết hạn, bị thu hồi hoặc chưa gửi',
      fix: en ? 'Log in again' : 'Đăng nhập lại',
    },
    {
      symptom: en ? '403 / menu missing' : '403 / menu không hiện',
      cause: en ? 'Missing RolePerm / Assign row, or feature name mismatch' : 'Thiếu dòng RolePerm / Assign, hoặc lệch tên feature',
      fix: en ? 'Add the row; compare FEATURE in FE, BE, DB' : 'Thêm dòng; so tên FEATURE ở FE, BE, DB',
    },
    {
      symptom: en ? 'New person has no access' : 'Người mới không có quyền',
      cause: en ? 'Not in DATASPC' : 'Chưa có trong DATASPC',
      fix: <>{en ? 'Add to' : 'Thêm vào'} <Code>ExtEmployee</Code></>,
    },
    {
      symptom: en ? 'Former employee lost access' : 'Người đã nghỉ việc mất quyền',
      cause: <Code>IsActive = 0</Code>,
      fix: en ? 'By design, nothing to fix' : 'Đúng thiết kế, không cần sửa',
      ok: true,
    },
  ]

  return (
    <Grid min={300}>
      {items.map((item) => (
        <Card key={item.symptom} accent={item.ok ? theme.palette.info.main : theme.palette.error.main}>
          <CardTitle>{item.symptom}</CardTitle>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 1, rowGap: 0.25, fontSize: 12.5, lineHeight: 1.6 }}>
            <Box sx={{ color: 'text.secondary' }}>{en ? 'Cause' : 'Nguyên nhân'}</Box>
            <Box>{item.cause}</Box>
            <Box sx={{ color: 'text.secondary' }}>{en ? 'Fix' : 'Cách sửa'}</Box>
            <Box sx={{ fontWeight: 600 }}>{item.fix}</Box>
          </Box>
        </Card>
      ))}
    </Grid>
  )
}

// =========================================================
// QUYỀN CỦA BẠN
// =========================================================

const PERM_ACTIONS = ['V', 'C', 'E', 'D', 'X'] as const

function toActions(value: unknown): string[] {
  const list = Array.isArray(value) ? value : String(value ?? '').split(',')
  return list.map((a) => String(a).trim().toUpperCase()).filter(Boolean)
}

// User từ /me (AuthProvider); perms rỗng thì không hiện bảng feature
function readPerms(session: AuthUser | null): { feature: string; actions: Set<string> }[] | null {
  const raw: unknown = session?.perms
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

  if (!byFeature.size) return null

  return [...byFeature.entries()]
    .map(([feature, actions]) => ({ feature, actions }))
    .sort((a, b) => a.feature.localeCompare(b.feature))
}

function MyAccess() {
  const en = useEn()
  const { user: session } = useAuth()
  const perms = readPerms(session)

  if (!session) {
    return <Alert severity="warning">{en ? 'Not signed in.' : 'Chưa đăng nhập.'}</Alert>
  }

  const org = [session.fac, session.dept, session.section, session.line, session.group].filter(Boolean).join(' / ')

  const info: [string, ReactNode][] = [
    [en ? 'Employee' : 'Nhân viên', `${session.employeeId}${session.name ? ` · ${session.name}` : ''}`],
    [en ? 'Department' : 'Bộ phận', org || '–'],
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
        {info.map(([label, value]) => (
          <Card key={label}>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{label}</Typography>
            <Box sx={{ fontSize: 13.5, fontWeight: 600, wordBreak: 'break-word', mt: 0.25 }}>{value}</Box>
          </Card>
        ))}
      </Box>

      {perms && perms.length > 0 ? (
        <DocTable
          head={['Feature', ...PERM_ACTIONS]}
          align={['left', ...PERM_ACTIONS.map(() => 'center' as const)]}
          widths={[undefined, ...PERM_ACTIONS.map(() => '56px')]}
          rows={perms.map(({ feature, actions }) => [
            <Code>{feature}</Code>,
            ...PERM_ACTIONS.map((a) => (actions.has('*') || actions.has(a) ? YES : NO)),
          ])}
        />
      ) : (
        <Alert severity="info" variant="outlined" sx={{ py: 0 }}>
          {en
            ? <><Code>/me</Code> returned no perms for this account.</>
            : <><Code>/me</Code> không trả perms nào cho tài khoản này.</>}
        </Alert>
      )}
    </>
  )
}

// =========================================================
// PANEL
// =========================================================

const CONTENT: Record<AuthGuideSection, () => ReactNode> = {
  how: () => <AuthFlowDiagram />,
  tables: () => <Tables />,
  roles: () => <Roles />,
  newScreen: () => <NewScreen />,
  trouble: () => <Trouble />,
  mine: () => <MyAccess />,
}

export function AuthGuidePanel({ section }: { section: AuthGuideSection }) {
  return (
    <Box
      key={section}
      role="tabpanel"
      sx={{ maxWidth: 1100, width: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}
    >
      {CONTENT[section]()}
    </Box>
  )
}
