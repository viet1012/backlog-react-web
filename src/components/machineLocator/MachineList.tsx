import {
  Box,
  Typography,
} from '@mui/material'
import {
  memo,
  useEffect,
  useRef,
} from 'react'

import type {
  Box as MachineBox,
  MachineMap,
} from '../../types/machineLocator'
import {
  compareCodes,
  matchesMachineFilter,
  normalizeCode,
  type GroupVisibility,
} from '../../utils/machineLocatorGeometry'
import { appScrollbarSx } from '../../theme/scrollbarStyle'
import { AppButton } from '../common/AppButton'
import {
  codeFontFamily,
  mapColors,
} from './machineLocatorColors'

interface MachineListProps {
  machines: MachineMap
  base: Record<string, MachineBox[]>
  cur: string | null
  query: string
  canWrite: boolean
  // nhóm máy đang hiện (đồng bộ với legend trên bản đồ)
  groups: GroupVisibility
  // mã khớp ô tìm nhưng nằm ở layout khác (chỉ dùng khi layout đang mở không có kết quả)
  elsewhere: ElsewhereMatch[]
  onSelect: (code: string) => void
  onStartNew: (code: string) => void
  onOpenElsewhere: (layoutId: string, code: string) => void
  // rê chuột trên item -> khung trên bản đồ hiện trạng thái hover
  onHover: (code: string | null) => void
}

export interface ElsewhereMatch {
  code: string
  layoutId: string
  layoutName: string
}

type TagKind = 'edit' | 'warn' | 'review'

// Nhãn nhỏ bên phải mã. "cần soát" chỉ hiện với ADMIN và được ưu tiên
function machineTag(
  code: string,
  machines: MachineMap,
  base: Record<string, MachineBox[]>,
  canWrite: boolean,
): [string, TagKind] | null {
  const m = machines[code]
  const n = m.boxes.length

  if (canWrite && m.review) return ['cần soát', 'review']

  const tag: [string, TagKind] | null = !base[code]
    ? ['mới', 'edit']
    : n > 1
      ? ['2 chỗ', 'warn']
      : m.manual
        ? ['đã sửa', 'edit']
        : m.u
          ? ['?', 'warn']
          : null

  if (tag && n > 2) tag[0] = `${n} chỗ`

  return tag
}

// Phần dữ liệu máy mà danh sách thực sự dùng (mã + thông tin tag).
// Kéo / resize khung chỉ đổi toạ độ nên không làm danh sách render lại.
function listSignature(machines: MachineMap): string {
  let s = ''

  for (const c in machines) {
    const m = machines[c]

    s += `${c}:${m.boxes.length}${m.manual ? 1 : 0}${m.u ? 1 : 0}${m.review ? 1 : 0};`
  }

  return s
}

function sameListProps(a: MachineListProps, b: MachineListProps): boolean {
  return a.cur === b.cur
    && a.query === b.query
    && a.canWrite === b.canWrite
    && a.groups === b.groups
    && a.onHover === b.onHover
    && a.base === b.base
    && a.onSelect === b.onSelect
    && a.onStartNew === b.onStartNew
    && a.onOpenElsewhere === b.onOpenElsewhere
    && JSON.stringify(a.elsewhere) === JSON.stringify(b.elsewhere)
    && (a.machines === b.machines || listSignature(a.machines) === listSignature(b.machines))
}

export const MachineList = memo(MachineListView, sameListProps)

function MachineListView({
  machines,
  base,
  cur,
  query,
  canWrite,
  groups,
  elsewhere,
  onSelect,
  onStartNew,
  onOpenElsewhere,
  onHover,
}: MachineListProps) {
  const buttons = useRef(new Map<string, HTMLButtonElement>())

  const codes = Object.keys(machines).sort(compareCodes)
  const visible = codes.filter((c) => matchesMachineFilter(c, machines, query, groups, canWrite))
  const reviewOnly = canWrite && !groups.auto && !groups.manual && groups.review
  const newCode = visible.length === 0 ? normalizeCode(query) : null

  useEffect(() => {
    if (cur) buttons.current.get(cur)?.scrollIntoView({ block: 'nearest' })
  }, [cur])

  return (
    <Box
      role="list"
      sx={{
        ...appScrollbarSx,
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        px: 1,
        pb: 1.5,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))',
        alignContent: 'start',
        gap: 0.5,
      }}
    >
      {visible.map((c) => {
        const on = c === cur
        const tag = machineTag(c, machines, base, canWrite)

        return (
          <Box
            key={c}
            component="button"
            type="button"
            role="listitem"
            ref={(el: HTMLButtonElement | null) => {
              if (el) buttons.current.set(c, el)
              else buttons.current.delete(c)
            }}
            onClick={() => onSelect(c)}
            onMouseEnter={() => onHover(c)}
            onMouseLeave={() => onHover(null)}
            sx={(theme) => ({
              font: `500 13px ${codeFontFamily}`,
              textAlign: 'left',
              color: on ? mapColors.markInk : 'text.primary',
              bgcolor: on ? mapColors.mark : 'background.paper',
              border: '1px solid',
              borderColor: on ? mapColors.mark : 'divider',
              borderRadius: '6px',
              px: 1,
              py: 0.75,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': {
                borderColor: on ? mapColors.mark : theme.palette.primary.main,
              },
              '&:focus-visible': {
                outline: `2px solid ${mapColors.mark}`,
                outlineOffset: 1,
              },
            })}
          >
            <span>{c}</span>

            {tag && (
              <Typography
                component="small"
                sx={{
                  fontSize: 10.5,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  fontWeight: tag[1] === 'review' ? 700 : 400,
                  color: on
                    ? mapColors.markInkMuted
                    : tag[1] === 'review'
                      ? mapColors.review
                      : tag[1] === 'edit' ? 'primary.main' : 'warning.main',
                }}
              >
                {tag[0]}
              </Typography>
            )}
          </Box>
        )
      })}

      {visible.length === 0 && (
        <Box sx={{ gridColumn: '1 / -1', color: 'text.secondary', px: 0.5, py: 1, fontSize: 12.5 }}>
          {elsewhere.map((m) => (
            <Box
              key={`${m.layoutId}:${m.code}`}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, color: 'text.primary' }}
            >
              <Box component="span" sx={{ flex: 1 }}>
                <Box component="b" sx={{ fontFamily: codeFontFamily }}>{m.code}</Box>
                {' '}nằm ở {m.layoutName} — mở?
              </Box>

              <AppButton
                appearance="action"
                onClick={() => onOpenElsewhere(m.layoutId, m.code)}
                sx={{ height: 28, minWidth: 0, px: 1 }}
              >
                Mở {m.layoutName}
              </AppButton>
            </Box>
          ))}

          {codes.length === 0 && !query.trim() ? (
            canWrite
              ? 'Chưa có máy nào trên layout này. Bấm “+ Máy mới” để thêm.'
              : 'Chưa có dữ liệu vị trí máy.'
          ) : reviewOnly && !query.trim() ? (
            'Không còn máy cần soát.'
          ) : newCode && canWrite ? (
            <>
              <div>Chưa có {newCode} trong danh sách.</div>

              <AppButton
                appearance="action"
                onClick={() => onStartNew(newCode)}
                sx={{ mt: 0.75, height: 30 }}
              >
                Thêm máy {newCode} và vẽ khung
              </AppButton>
            </>
          ) : (
            `Không có mã nào chứa “${query.trim()}”. Thử nhập ít số hơn.`
          )}
        </Box>
      )}
    </Box>
  )
}
