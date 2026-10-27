import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  Fragment,
  useState,
} from 'react'

import { uiTokens } from '../../theme/uiTokens'
import {
  FIT_CONFIG,
  FIT_GAP_MAX,
  FIT_GAP_MIN,
  FIT_MODE_LABEL,
  FIT_MODES,
  TIDY_LEVEL_MAX,
  TIDY_LEVEL_MIN,
} from '../../utils/machineLocatorFit'
import { AppButton } from '../common/AppButton'
import { Kbd } from '../facConfirm/guide/GuideInline'

// =========================================================
// HƯỚNG DẪN (nút "?" / phím ?): thao tác + phím tắt theo nhóm, ô tìm lọc theo tên / phím.
// Phím tắt lấy theo code hiện tại (useMachineLocator, MapCanvas, MachineInfo) – đổi phím ở đó thì sửa cả đây
// =========================================================

interface HelpItem {
  name: string
  // các cách bấm thay thế nhau; mỗi cách là tổ hợp phím / thao tác chuột (hiện nối bằng +)
  keys: string[][]
  desc: string
}

interface HelpGroup {
  id: string
  title: string
  // chỉ có ở chế độ sửa (ADMIN)
  write: boolean
  items: HelpItem[]
}

const GROUPS: HelpGroup[] = [
  {
    id: 'view',
    title: 'Xem & chọn máy',
    write: false,
    items: [
      { name: 'Phóng to / thu nhỏ', keys: [['Lăn chuột']], desc: 'Lăn chuột trên bản vẽ, nút + / − ở góc dưới, hoặc chụm 2 ngón trên màn hình cảm ứng.' },
      { name: 'Xem toàn bộ', keys: [], desc: 'Nút “Xem toàn bộ” ở góc dưới: đưa cả bản vẽ vào khung nhìn.' },
      { name: 'Kéo bản vẽ', keys: [['Kéo chuột']], desc: 'Kéo trên nền bản vẽ để di chuyển khung nhìn.' },
      { name: 'Chọn máy', keys: [['Click']], desc: 'Click máy trên bản vẽ hoặc mã máy trong danh sách bên phải.' },
      { name: 'Bỏ chọn máy', keys: [['Esc']], desc: 'Hoặc click vào nền trống của bản vẽ.' },
      { name: 'Tìm máy', keys: [['Enter']], desc: 'Gõ mã vào ô tìm (vd 1443); Enter chọn mã đầu tiên khớp. Mã nằm ở layout khác sẽ được gợi ý.' },
      { name: 'Ẩn / hiện nhóm máy', keys: [['Click']], desc: 'Click nhóm trên chú giải ở góc trên-trái bản vẽ.' },
      { name: 'Mở hướng dẫn', keys: [['?']], desc: 'Mở bảng hướng dẫn này.' },
    ],
  },
  {
    id: 'draw',
    title: 'Vẽ khung',
    write: true,
    items: [
      { name: 'Vẽ khung mới', keys: [['Kéo chuột']], desc: 'Bấm “Vẽ khung” / “Vẽ lại khung” / “Thêm vị trí” rồi kéo trên bản vẽ; Esc để huỷ.' },
      { name: 'Di chuyển / đổi cỡ khung', keys: [['Kéo chuột']], desc: 'Kéo khung để di chuyển, kéo ô vuông ở cạnh / góc để đổi kích thước.' },
      { name: 'Dịch khung', keys: [['Mũi tên'], ['Shift', 'Mũi tên']], desc: 'Dịch khung đang chọn 0,5 pt (giữ Shift: 3 pt).' },
      { name: 'Không tự ôm khi thả', keys: [['Alt']], desc: 'Giữ Alt khi thả chuột (vẽ / kéo / đổi cỡ): giữ nguyên khung chữ nhật.' },
      { name: 'Chỉ tìm trong khung', keys: [['Shift']], desc: 'Giữ Shift khi thả chuột: ôm chỉ trong khung, không nới vùng tìm.' },
      { name: 'Tự ôm khi chỉnh', keys: [], desc: 'Công tắc “Tự ôm khi chỉnh”: tắt thì thả chuột không tự ôm (vẫn ôm được bằng F).' },
    ],
  },
  {
    id: 'fit',
    title: 'Ôm tự động',
    write: true,
    items: [
      { name: 'Ôm theo máy', keys: [['F']], desc: 'Ôm khung đang chọn theo nét bản vẽ (nút “Ôm theo máy (F)”).' },
      { name: 'Ôm, đảo giới hạn khung', keys: [['Shift', 'F']], desc: 'Ôm với “Giới hạn trong khung” đảo lại riêng lần này (Shift + bấm nút cũng được).' },
      { name: 'Chế độ fit', keys: [['Click']], desc: 'Bật “Chế độ fit” rồi click vào máy để ôm quanh điểm click; ngoài khung đang chọn chỉ xem trước. Esc để thoát.' },
      { name: 'Kiểu ôm', keys: [], desc: `${FIT_MODES.map((m) => FIT_MODE_LABEL[m]).join(' · ')} – chọn ở thẻ máy hoặc ô xem trước, được nhớ làm mặc định.` },
      { name: 'Độ sát', keys: [], desc: 'Thanh 1–10: càng lớn đường bao càng bám sát nét (nhiều đỉnh hơn).' },
      { name: 'Bịt hở', keys: [], desc: `Thanh ${FIT_GAP_MIN}–${FIT_GAP_MAX} px: bịt khe hở của viền trước khi tìm viền kín (kiểu “${FIT_MODE_LABEL.closed}”).` },
      { name: 'Nắn vuông góc', keys: [], desc: `Cạnh lệch ≤ ${FIT_CONFIG.orthoDeg}° so với ngang / dọc được nắn thẳng.` },
      { name: 'Giới hạn trong khung', keys: [], desc: `Kết quả không vượt khung gốc quá ${FIT_CONFIG.boxOverflowPx} px ảnh (mặc định bật).` },
      { name: 'Nhận / huỷ kết quả ôm', keys: [['Enter'], ['Esc']], desc: 'Enter nhận; Esc huỷ về khung trước khi ôm. Bản xem trước nét đứt: Enter áp dụng, Esc bỏ.' },
    ],
  },
  {
    id: 'edit',
    title: 'Chỉnh tay',
    write: true,
    items: [
      { name: 'Kéo đỉnh', keys: [['Kéo đỉnh']], desc: `Sửa đường bao (cần bật “Khung theo hình CAD”); thả ra tự bắt dính vào nét mực gần nhất (≤ ${FIT_CONFIG.snapPx} px).` },
      { name: 'Đường gióng', keys: [['Kéo đỉnh']], desc: 'x / y khớp đỉnh khác cùng khung (±3 px màn hình) thì tự hút thẳng hàng, hiện đường gióng xanh.' },
      { name: 'Tắt hút / bắt dính', keys: [['Ctrl']], desc: 'Giữ Ctrl khi kéo / thả đỉnh: không hút theo đỉnh khác, không bắt dính nét.' },
      { name: 'Thêm đỉnh', keys: [['Nhấp đúp']], desc: 'Nhấp đúp gần cạnh đường bao.' },
      { name: 'Xoá đỉnh đang chọn', keys: [['Delete'], ['Backspace']], desc: 'Click chọn đỉnh rồi bấm Delete / Backspace (đa giác giữ tối thiểu 3 đỉnh).' },
      { name: 'Xoá đỉnh nhanh', keys: [['Alt', 'Click'], ['Chuột phải']], desc: 'Xoá ngay đỉnh dưới con trỏ.' },
    ],
  },
  {
    id: 'tidy',
    title: 'Làm gọn',
    write: true,
    items: [
      { name: 'Làm gọn', keys: [['G']], desc: 'Rút gọn đường bao hiện tại, không ôm lại; xem trước: cũ mờ, mới nét đứt.' },
      { name: 'Mức gọn', keys: [], desc: `Thanh ${TIDY_LEVEL_MIN}–${TIDY_LEVEL_MAX}: càng lớn càng ít đỉnh, càng thẳng.` },
      { name: 'Áp dụng / bỏ', keys: [['Enter'], ['Esc']], desc: 'Enter áp dụng (1 bước hoàn tác); Esc bỏ.' },
    ],
  },
  {
    id: 'pen',
    title: 'Bút & cắt',
    write: true,
    items: [
      { name: 'Thêm / bớt khối', keys: [['Click']], desc: 'Ngay sau khi ôm (trước khi Enter): click khối ứng viên – xanh = đang dùng, xám = bỏ.' },
      { name: 'Cắt máy dính', keys: [['Alt', 'Click']], desc: 'Alt+click vào nét nối giữa 2 máy trong vùng tìm để tách.' },
      { name: 'Bút loại trừ', keys: [['Alt', 'Kéo']], desc: 'Tô vùng không thuộc máy trong vùng tìm.' },
      { name: 'Bút bổ sung', keys: [['Shift', 'Kéo']], desc: 'Tô thêm vùng thuộc máy trong vùng tìm.' },
    ],
  },
  {
    id: 'save',
    title: 'Lưu & hoàn tác',
    write: true,
    items: [
      { name: 'Hoàn tác', keys: [['Ctrl', 'Z']], desc: 'Hoàn tác thao tác chỉnh khung (trong phiên sửa).' },
      { name: 'Làm lại', keys: [['Ctrl', 'Y'], ['Ctrl', 'Shift', 'Z']], desc: 'Làm lại bước vừa hoàn tác.' },
      { name: 'Lưu', keys: [], desc: 'Nút “Lưu”: ghi thay đổi của máy đang sửa.' },
      { name: 'Hủy thay đổi', keys: [], desc: 'Nút “Hủy thay đổi”: bỏ mọi thay đổi chưa lưu của máy này.' },
      { name: 'Đúng rồi', keys: [], desc: 'Máy cần soát: nút “Đúng rồi” đánh dấu đã soát, giữ nguyên khung hiện tại.' },
    ],
  },
]

// bỏ dấu tiếng Việt, chữ thường – để gõ "lam gon" cũng tìm được "Làm gọn"
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()
}

// Mọi từ của ô tìm (tách theo khoảng trắng / +) đều có trong tên hoặc phím
function matches(item: HelpItem, q: string): boolean {
  const hay = norm(`${item.name} ${item.keys.map((k) => k.join('+')).join(' ')}`)

  return norm(q).split(/[\s+]+/).filter(Boolean).every((w) => hay.includes(w))
}

function Keys({ keys }: { keys: string[][] }) {
  return (
    <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
      {keys.map((combo, i) => (
        <Fragment key={i}>
          {i > 0 && <Box component="span" sx={{ mx: 0.25, color: 'text.secondary' }}>/</Box>}
          {combo.map((k, j) => (
            <Fragment key={j}>
              {j > 0 && '+'}
              <Kbd>{k}</Kbd>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Box>
  )
}

function ItemList({ items }: { items: HelpItem[] }) {
  return (
    <Box sx={{ display: 'grid', borderRadius: 1.5, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
      {items.map((it, i) => (
        <Box
          key={it.name}
          sx={{ px: 1.25, py: 0.9, fontSize: 12.5, lineHeight: 1.5, borderTop: i ? 1 : 0, borderColor: 'divider' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ fontWeight: 700, color: 'text.primary', mr: 'auto' }}>{it.name}</Box>
            {it.keys.length > 0 && <Keys keys={it.keys} />}
          </Box>
          <Box sx={{ color: 'text.secondary' }}>{it.desc}</Box>
        </Box>
      ))}
    </Box>
  )
}

interface MachineLocatorHelpProps {
  open: boolean
  // false: chỉ hiện nhóm xem & chọn máy
  canWrite: boolean
  onClose: () => void
}

export function MachineLocatorHelp({ open, canWrite, onClose }: MachineLocatorHelpProps) {
  const groups = GROUPS.filter((g) => canWrite || !g.write)
  const [tab, setTab] = useState(groups[0].id)
  const [query, setQuery] = useState('')
  const q = query.trim()
  const found = q
    ? groups.map((g) => ({ ...g, items: g.items.filter((it) => matches(it, q)) })).filter((g) => g.items.length)
    : []
  const active = groups.find((g) => g.id === tab) ?? groups[0]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      // phím trong hộp thoại không lọt xuống phím tắt của bản đồ (Enter / Esc / F / G / Delete…)
      onKeyDown={(e) => e.stopPropagation()}
      slotProps={{ paper: { sx: { borderRadius: uiTokens.dialog.borderRadius, height: 'min(640px, 90vh)' } } }}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography sx={{ fontSize: uiTokens.dialogTypography.titleFontSize, fontWeight: 700, mr: 'auto' }}>
          Hướng dẫn Machine Locator
        </Typography>
        <AppButton compact aria-label="Đóng" onClick={onClose} icon={<CloseRoundedIcon />} />
      </DialogTitle>

      <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <TextField
          size="small"
          type="search"
          autoFocus
          value={query}
          placeholder="Tìm thao tác hoặc phím, vd: đỉnh, Ctrl+Z"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{ htmlInput: { 'aria-label': 'Tìm trong hướng dẫn' } }}
        />

        {q ? (
          found.length ? (
            found.map((g) => (
              <Box key={g.id}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                  {g.title}
                </Typography>
                <ItemList items={g.items} />
              </Box>
            ))
          ) : (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              Không có thao tác nào khớp “{q}”.
            </Typography>
          )
        ) : (
          <>
            {groups.length > 1 && (
              <Tabs
                value={active.id}
                onChange={(_, v: string) => setTab(v)}
                variant="scrollable"
                scrollButtons={false}
                sx={{
                  minHeight: 32,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': { minHeight: 32, py: 0.5, px: 1.25, fontSize: 12.5, textTransform: 'none' },
                }}
              >
                {groups.map((g) => (
                  <Tab key={g.id} value={g.id} label={g.title} />
                ))}
              </Tabs>
            )}
            <ItemList items={active.items} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
