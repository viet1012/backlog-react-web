import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined'
import FlightLandRoundedIcon from '@mui/icons-material/FlightLandRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined'
import {
  Box,
  ButtonBase,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha, useTheme, type Theme } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'

import { useI18n } from '../../i18n/useI18n'
import { uiTokens } from '../../theme/uiTokens'
import { codeFontFamily } from '../machineLocator/machineLocatorColors'

/*
 * Tab con "Gán quyền": mô phỏng từng bước một nhân viên nhận quyền thế nào
 *   1. Chọn nhân viên mẫu → 2. Bảng Assign: dòng nào khớp → vai trò
 *   → 3. Bảng RolePerm: vai trò được làm gì → 4. Quyền hiệu lực (view EmpPerm)
 * Sau đó là bảng tham chiếu quy tắc PCW hiện tại + ý nghĩa Actions.
 * Dữ liệu mẫu chỉ để minh họa (tên cột tổ chức, feature, MSNV là ví dụ).
 */

type Role = 'USER' | 'PC' | 'PRO' | 'ADMIN' | 'COST_VIEW'
type OrgKey = 'fac' | 'dept' | 'section'
type RowKind = 'everyone' | 'org' | 'band' | 'person'

interface Employee {
  id: string
  icon: ReactNode
  name: { vi: string; en: string }
  empCode: string
  fac: string | null
  dept: string | null
  section: string | null
  band: number | null
}

interface AssignRow {
  role: Role
  kind: RowKind
  fac: string | null
  dept: string | null
  section: string | null
  maxBand: number | null
  empCode: string | null
  validTo: string | null
}

// ValidTo của dòng gán riêng: luôn còn hạn trong ví dụ
function inDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const EMPLOYEES: Employee[] = [
  {
    id: 'pc',
    icon: <PersonOutlineRoundedIcon fontSize="small" />,
    name: { vi: 'Nhân viên PC', en: 'PC staff' },
    empCode: '10231',
    fac: 'Fac_1',
    dept: 'KP',
    section: 'PC',
    band: 5,
  },
  {
    id: 'lead',
    icon: <SupervisorAccountOutlinedIcon fontSize="small" />,
    name: { vi: 'Trưởng nhóm PC', en: 'PC lead' },
    empCode: '10087',
    fac: 'Fac_2',
    dept: 'K Common',
    section: 'PC',
    band: 3,
  },
  {
    id: 'it',
    icon: <EngineeringOutlinedIcon fontSize="small" />,
    name: { vi: 'Nhân viên IT', en: 'IT staff' },
    empCode: '10412',
    fac: 'Fac_1',
    dept: 'PE',
    section: 'IT',
    band: 4,
  },
  {
    id: 'expert',
    icon: <FlightLandRoundedIcon fontSize="small" />,
    name: { vi: 'Chuyên gia Nhật', en: 'Japanese expert' },
    empCode: 'J0007',
    fac: null,
    dept: null,
    section: null,
    band: null,
  },
]

const VALID_TO = inDays(30)

const ASSIGN_ROWS: AssignRow[] = [
  { role: 'USER', kind: 'everyone', fac: null, dept: null, section: null, maxBand: null, empCode: null, validTo: null },
  { role: 'PC', kind: 'org', fac: null, dept: 'KP', section: 'PC', maxBand: null, empCode: null, validTo: null },
  { role: 'PC', kind: 'org', fac: 'Fac_2', dept: 'K Common', section: 'PC', maxBand: null, empCode: null, validTo: null },
  { role: 'ADMIN', kind: 'org', fac: null, dept: 'PE', section: 'IT', maxBand: null, empCode: null, validTo: null },
  { role: 'COST_VIEW', kind: 'band', fac: null, dept: null, section: null, maxBand: 3, empCode: null, validTo: null },
  { role: 'PC', kind: 'person', fac: null, dept: null, section: null, maxBand: null, empCode: 'J0007', validTo: VALID_TO },
]

// RolePerm mẫu: app PCW
const ROLE_PERMS: { role: Role; feature: string; actions: string }[] = [
  { role: 'USER', feature: 'USER_HOME', actions: 'V' },
  { role: 'PC', feature: 'BACKLOG', actions: 'V,X' },
  { role: 'PC', feature: 'FAC_CONFIRM', actions: 'V,E' },
  { role: 'PRO', feature: 'FAC_CONFIRM', actions: 'V,E' },
  { role: 'COST_VIEW', feature: 'COST_MONITORING', actions: 'V' },
  { role: 'ADMIN', feature: '*', actions: '*' },
]

const ACTION_KEYS = ['V', 'C', 'E', 'D', 'X'] as const

type CellCheck = 'null' | 'match' | 'miss'

function checkRow(row: AssignRow, emp: Employee): { cells: Record<OrgKey | 'maxBand' | 'empCode' | 'validTo', CellCheck>; matched: boolean } {
  const eq = (rule: string | null, value: string | null): CellCheck => (rule == null ? 'null' : rule === value ? 'match' : 'miss')
  const cells: Record<OrgKey | 'maxBand' | 'empCode' | 'validTo', CellCheck> = {
    fac: eq(row.fac, emp.fac),
    dept: eq(row.dept, emp.dept),
    section: eq(row.section, emp.section),
    maxBand: row.maxBand == null ? 'null' : emp.band != null && emp.band <= row.maxBand ? 'match' : 'miss',
    empCode: eq(row.empCode, emp.empCode),
    validTo: row.validTo == null ? 'null' : row.validTo >= new Date().toISOString().slice(0, 10) ? 'match' : 'miss',
  }
  return { cells, matched: Object.values(cells).every((c) => c !== 'miss') }
}

function roleColor(theme: Theme, role: Role): string {
  const dark = theme.palette.mode === 'dark'
  switch (role) {
    case 'ADMIN': return theme.palette.error.main
    case 'PC': return theme.palette.primary.main
    case 'PRO': return dark ? '#34D399' : '#059669'
    case 'COST_VIEW': return dark ? '#A78BFA' : '#7C3AED'
    default: return theme.palette.text.secondary
  }
}

function RoleTag({ role, dim = false }: { role: Role; dim?: boolean }) {
  const theme = useTheme()
  const color = roleColor(theme, role)
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 0.875,
        py: '1px',
        borderRadius: 999,
        fontFamily: codeFontFamily,
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: dim ? 'text.disabled' : color,
        bgcolor: dim ? 'transparent' : alpha(color, 0.12),
        border: 1,
        borderColor: dim ? 'divider' : alpha(color, 0.4),
      }}
    >
      {role}
    </Box>
  )
}

function StepHeader({ no, title, hint }: { no: number; title: string; hint?: ReactNode }) {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 26,
          height: 26,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12.5,
          fontWeight: 800,
          color: theme.palette.primary.contrastText,
          bgcolor: 'primary.main',
        }}
      >
        {no}
      </Box>
      <Box sx={{ minWidth: 0, pt: '2px' }}>
        <Typography component="h2" sx={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.35 }}>{title}</Typography>
        {hint && <Typography component="div" sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.5, mt: 0.25 }}>{hint}</Typography>}
      </Box>
    </Box>
  )
}

const headCellSx = (theme: Theme) => ({
  fontSize: uiTokens.table.headerFontSize,
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
  bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.06 : 0.035),
})

const bodyCellSx = { fontSize: uiTokens.table.cellFontSize, whiteSpace: 'nowrap' as const, py: 0.75 }

const panelSx = { border: 1, borderColor: 'divider', borderRadius: 1.5, overflowX: 'auto' } as const

export function AssignSimulator() {
  const { language } = useI18n()
  const en = language === 'en'
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const ok = theme.palette.success.main
  const bad = theme.palette.error.main

  const [empId, setEmpId] = useState(EMPLOYEES[1].id)
  const emp = EMPLOYEES.find((e) => e.id === empId) ?? EMPLOYEES[0]

  const checks = ASSIGN_ROWS.map((row) => ({ row, ...checkRow(row, emp) }))
  const roles = [...new Set(checks.filter((c) => c.matched).map((c) => c.row.role))]
  const isAdmin = roles.includes('ADMIN')

  // quyền hiệu lực = gộp RolePerm của các vai trò đã nhận
  const effective = new Map<string, Set<string>>()
  for (const rp of ROLE_PERMS) {
    if (!roles.includes(rp.role) || rp.feature === '*') continue
    const set = effective.get(rp.feature) ?? new Set<string>()
    rp.actions.split(',').forEach((a) => set.add(a))
    effective.set(rp.feature, set)
  }

  const kindLabel: Record<RowKind, string> = en
    ? { everyone: 'Everyone', org: 'By organization', band: 'By band', person: 'One person' }
    : { everyone: 'Mọi người', org: 'Theo tổ chức', band: 'Theo Band', person: 'Gán riêng' }

  const empMeta = (e: Employee) =>
    e.dept
      ? [e.fac, e.dept, e.section, e.band != null ? `Band ${e.band}` : null].filter(Boolean).join(' · ')
      : en ? 'ExtEmployee · not in DATASPC' : 'ExtEmployee · không có trong DATASPC'

  function cell(value: ReactNode, check: CellCheck) {
    if (check === 'null') {
      return <Box component="span" sx={{ fontFamily: codeFontFamily, fontSize: 11, color: 'text.disabled' }}>NULL</Box>
    }
    const color = check === 'match' ? ok : bad
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.375,
          px: 0.75,
          py: '1px',
          borderRadius: 1,
          fontWeight: 600,
          color,
          bgcolor: alpha(color, dark ? 0.16 : 0.1),
          '& svg': { fontSize: 13 },
        }}
      >
        {check === 'match' ? <CheckRoundedIcon /> : <CloseRoundedIcon />}
        {value}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ===== 1. CHỌN NHÂN VIÊN ===== */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <StepHeader
          no={1}
          title={en ? 'Pick an employee' : 'Chọn nhân viên'}
          hint={en ? 'Sample data — see how the same rules give each person different access.' : 'Dữ liệu mẫu — xem cùng một bộ quy tắc cho mỗi người quyền khác nhau thế nào.'}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 210px), 1fr))', gap: 1, pl: { md: 4.5 } }}>
          {EMPLOYEES.map((e) => {
            const active = e.id === empId
            return (
              <ButtonBase
                key={e.id}
                onClick={() => setEmpId(e.id)}
                aria-pressed={active}
                sx={{
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1,
                  p: 1.25,
                  borderRadius: 1.5,
                  border: 1.5,
                  textAlign: 'left',
                  borderColor: active ? 'primary.main' : 'divider',
                  bgcolor: active ? alpha(theme.palette.primary.main, dark ? 0.14 : 0.06) : 'transparent',
                  transition: 'border-color 150ms, background-color 150ms',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    color: active ? 'primary.contrastText' : 'text.secondary',
                    bgcolor: active ? 'primary.main' : 'action.selected',
                  }}
                >
                  {e.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: active ? 'primary.main' : 'text.primary' }}>
                    {e.name[language]}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.4 }}>
                    {en ? 'ID' : 'MSNV'} {e.empCode}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.4 }}>{empMeta(e)}</Typography>
                </Box>
              </ButtonBase>
            )
          })}
        </Box>
      </Box>

      {/* ===== 2. ASSIGN ===== */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <StepHeader
          no={2}
          title={en ? 'Assign: which rows match?' : 'Bảng Assign: dòng nào khớp?'}
          hint={
            en
              ? <>Within a row: every filled column must match exactly (<b>AND</b>); <Mono>NULL</Mono> = ignored. Across rows: roles add up (<b>OR</b>), there is no deny rule.</>
              : <>Trong 1 dòng: mọi cột có giá trị phải khớp tuyệt đối (<b>AND</b>); <Mono>NULL</Mono> = không xét. Nhiều dòng: vai trò cộng dồn (<b>OR</b>), không có cơ chế cấm.</>
          }
        />
        <Box sx={{ pl: { md: 4.5 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TableContainer sx={panelSx}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[en ? 'Role' : 'Vai trò', 'Fac', 'Dept', 'Section', 'MaxBand', 'EmpCode', 'ValidTo', en ? 'Result' : 'Kết quả'].map((h, i) => (
                    <TableCell key={h} align={i === 7 ? 'right' : 'left'} sx={headCellSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {checks.map(({ row, cells, matched }, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      bgcolor: matched ? alpha(ok, dark ? 0.08 : 0.04) : 'transparent',
                      '& td': { opacity: matched ? 1 : 0.75 },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={bodyCellSx}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                        <RoleTag role={row.role} />
                        <Box component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>{kindLabel[row.kind]}</Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={bodyCellSx}>{cell(row.fac, cells.fac)}</TableCell>
                    <TableCell sx={bodyCellSx}>{cell(row.dept, cells.dept)}</TableCell>
                    <TableCell sx={bodyCellSx}>{cell(row.section, cells.section)}</TableCell>
                    <TableCell sx={bodyCellSx}>{cell(`≤ ${row.maxBand}`, cells.maxBand)}</TableCell>
                    <TableCell sx={bodyCellSx}>{cell(row.empCode, cells.empCode)}</TableCell>
                    <TableCell sx={bodyCellSx}>{cell(row.validTo, cells.validTo)}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.375,
                          fontSize: 12,
                          fontWeight: 700,
                          color: matched ? ok : 'text.disabled',
                          '& svg': { fontSize: 15 },
                        }}
                      >
                        {matched ? <CheckRoundedIcon /> : <CloseRoundedIcon />}
                        {matched ? (en ? 'Match' : 'Khớp') : (en ? 'No match' : 'Không khớp')}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <ResultBar label={en ? 'Roles received' : 'Vai trò nhận được'}>
            {roles.map((r, i) => (
              <Box key={r} component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                {i > 0 && <Box component="span" sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled' }}>OR</Box>}
                <RoleTag role={r} />
              </Box>
            ))}
          </ResultBar>
        </Box>
      </Box>

      {/* ===== 3. ROLEPERM ===== */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <StepHeader
          no={3}
          title={en ? 'RolePerm: what can those roles do?' : 'Bảng RolePerm: các vai trò đó được làm gì?'}
          hint={en ? 'Rows of roles this person holds are highlighted.' : 'Dòng của vai trò người này đang có được tô sáng.'}
        />
        <Box sx={{ pl: { md: 4.5 } }}>
          <TableContainer sx={panelSx}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['App', en ? 'Role' : 'Vai trò', 'Feature', 'Actions'].map((h) => (
                    <TableCell key={h} sx={headCellSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROLE_PERMS.map((rp, i) => {
                  const held = roles.includes(rp.role)
                  return (
                    <TableRow
                      key={i}
                      sx={{
                        bgcolor: held ? alpha(roleColor(theme, rp.role), dark ? 0.1 : 0.05) : 'transparent',
                        '& td': { opacity: held ? 1 : 0.5 },
                        '&:last-child td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={{ ...bodyCellSx, fontFamily: codeFontFamily }}>PCW</TableCell>
                      <TableCell sx={bodyCellSx}><RoleTag role={rp.role} dim={!held} /></TableCell>
                      <TableCell sx={{ ...bodyCellSx, fontFamily: codeFontFamily, fontWeight: 600 }}>{rp.feature}</TableCell>
                      <TableCell sx={{ ...bodyCellSx, fontFamily: codeFontFamily }}>{rp.actions}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* ===== 4. QUYỀN HIỆU LỰC ===== */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <StepHeader
          no={4}
          title={en ? 'Effective access (EmpPerm view)' : 'Quyền hiệu lực (view EmpPerm)'}
          hint={en ? 'What BE actually checks on every API call.' : 'Đây là thứ BE thật sự kiểm tra ở mỗi lần gọi API.'}
        />
        <Box sx={{ pl: { md: 4.5 } }}>
          {isAdmin ? (
            <ResultBar label={en ? 'Access' : 'Quyền'} color={roleColor(theme, 'ADMIN')}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {en ? "ADMIN has '*' — every feature, every action." : "ADMIN có '*' — mọi feature, mọi action."}
              </Typography>
            </ResultBar>
          ) : (
            <TableContainer sx={panelSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Feature</TableCell>
                    {ACTION_KEYS.map((a) => (
                      <TableCell key={a} align="center" sx={{ ...headCellSx(theme), width: 56 }}>{a}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...effective.entries()].map(([feature, actions]) => (
                    <TableRow key={feature} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ ...bodyCellSx, fontFamily: codeFontFamily, fontWeight: 600 }}>{feature}</TableCell>
                      {ACTION_KEYS.map((a) => (
                        <TableCell key={a} align="center" sx={bodyCellSx}>
                          {actions.has(a)
                            ? <CheckRoundedIcon sx={{ fontSize: 18, color: ok, verticalAlign: 'middle' }} />
                            : <Box component="span" sx={{ color: 'text.disabled' }}>–</Box>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      <Typography sx={{ fontSize: 11.5, color: 'text.disabled', fontStyle: 'italic' }}>
        {en
          ? 'Sample data for illustration. Org column names, features and IDs are examples — check the real tables in the DB.'
          : 'Dữ liệu minh họa. Tên cột tổ chức, feature và MSNV là ví dụ — xem bảng thật trong DB.'}
      </Typography>
    </Box>
  )
}

function Mono({ children }: { children: ReactNode }) {
  return <Box component="code" sx={{ fontFamily: codeFontFamily, fontSize: '0.92em' }}>{children}</Box>
}

function ResultBar({ label, color, children }: { label: string; color?: string; children: ReactNode }) {
  const theme = useTheme()
  const accent = color ?? theme.palette.primary.main
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        borderLeft: `3px solid ${accent}`,
        bgcolor: alpha(accent, theme.palette.mode === 'dark' ? 0.1 : 0.05),
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>{label}</Typography>
      {children}
    </Box>
  )
}

// =========================================================
// THAM CHIẾU: quy tắc PCW hiện tại + Actions
// =========================================================

const PCW_RULES: { role: Role; who: { vi: string; en: string } }[] = [
  { role: 'USER', who: { vi: 'Mọi người', en: 'Everyone' } },
  { role: 'ADMIN', who: { vi: 'K Common + PE IT', en: 'K Common + PE IT' } },
  { role: 'PC', who: { vi: 'KP PC, KM PC, Guide PC, K Common/PC (Fac_2)', en: 'KP PC, KM PC, Guide PC, K Common/PC (Fac_2)' } },
  { role: 'PRO', who: { vi: 'KP Pro, KM Pro, Guide Pro, PRO PE', en: 'KP Pro, KM Pro, Guide Pro, PRO PE' } },
  { role: 'COST_VIEW', who: { vi: 'Band ≤ 3', en: 'Band ≤ 3' } },
]

export function AssignReference() {
  const { language } = useI18n()
  const en = language === 'en'
  const theme = useTheme()

  const actions: [string, string][] = en
    ? [['V', 'View'], ['C', 'Create'], ['E', 'Edit'], ['D', 'Delete'], ['X', 'Import / export'], ['*', 'All']]
    : [['V', 'Xem'], ['C', 'Thêm'], ['E', 'Sửa'], ['D', 'Xóa'], ['X', 'Xuất / nhập file'], ['*', 'Tất cả']]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' }, gap: 2, alignItems: 'start' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography component="h2" sx={{ fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <BadgeOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          {en ? 'Current PCW rules' : 'Quy tắc PCW hiện tại'}
        </Typography>
        <TableContainer sx={panelSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headCellSx(theme), width: 130 }}>{en ? 'Role' : 'Vai trò'}</TableCell>
                <TableCell sx={headCellSx}>{en ? 'Who gets it' : 'Ai nhận'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {PCW_RULES.map((r) => (
                <TableRow key={r.role} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={bodyCellSx}><RoleTag role={r.role} /></TableCell>
                  <TableCell sx={{ ...bodyCellSx, whiteSpace: 'normal' }}>{r.who[language]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography component="h2" sx={{ fontSize: 14.5, fontWeight: 800 }}>Actions</Typography>
        <Box sx={{ ...panelSx, display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
          {actions.map(([code, label], i) => (
            <Box key={code} sx={{ display: 'contents', '& > *': { borderTop: i > 0 ? 1 : 0, borderColor: 'divider', py: 0.75 } }}>
              <Box sx={{ px: 1.5, fontFamily: codeFontFamily, fontSize: 13, fontWeight: 800, color: 'primary.main', textAlign: 'center' }}>{code}</Box>
              <Box sx={{ pr: 1.5, fontSize: 12.5 }}>{label}</Box>
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
          <Mono>('PCW', 'PC', 'BACKLOG', 'V,X')</Mono>{' '}
          {en ? '= role PC can view + import/export BACKLOG.' : '= vai trò PC được xem + xuất/nhập file BACKLOG.'}
        </Typography>
      </Box>
    </Box>
  )
}
