import {
  Box,
  FormControlLabel,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  useState,
  type ReactNode,
} from 'react'

import type { MachineLocatorState } from '../../hooks/useMachineLocator'
import type { FitMode } from '../../types/machineLocator'
import {
  FIT_MODE_LABEL,
  FIT_MODES,
} from '../../utils/machineLocatorFit'
import { normalizeCode } from '../../utils/machineLocatorGeometry'
import {
  AppButton,
  type AppButtonProps,
} from '../common/AppButton'
import { codeFontFamily } from './machineLocatorColors'

interface MachineInfoProps {
  ml: MachineLocatorState
}

// =========================================================
// SMALL PARTS
// =========================================================

export function PanelButton({ sx, ...props }: AppButtonProps) {
  return (
    <AppButton
      {...props}
      sx={[
        { height: 28, minWidth: 0, px: 1, fontSize: 12.5 },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  )
}

function Actions({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 1 }}>
      {children}
    </Box>
  )
}

function StatusLine({ ml }: MachineInfoProps) {
  const { t, k } = ml.status

  return (
    <Typography
      role="status"
      sx={{
        mt: 0.75,
        minHeight: 18,
        fontSize: 12.5,
        color: k === 'err'
          ? 'warning.main'
          : k === 'ok' ? 'success.main' : 'text.secondary',
      }}
    >
      {t}
    </Typography>
  )
}

interface CodeInputProps {
  placeholder: string
  label: string
  onSubmit: (code: string) => void
  onInvalid: () => void
}

function CodeInput({ placeholder, label, onSubmit, onInvalid }: CodeInputProps) {
  const [value, setValue] = useState('')

  function go() {
    const c = normalizeCode(value)

    if (!c) {
      onInvalid()
      return
    }

    onSubmit(c)
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.6, mt: 1 }}>
      <TextField
        size="small"
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') go()
        }}
        slotProps={{
          htmlInput: {
            'aria-label': placeholder,
            style: { textTransform: 'uppercase' },
          },
        }}
        sx={{
          flex: 1,
          minWidth: 0,
          '& .MuiInputBase-input': {
            py: 0.6,
            fontFamily: codeFontFamily,
            fontSize: 13,
          },
        }}
      />

      <PanelButton appearance="action" onClick={go}>
        {label}
      </PanelButton>
    </Box>
  )
}

// =========================================================
// INFO PANEL
// =========================================================

export function MachineInfo({ ml }: MachineInfoProps) {
  const {
    cur,
    act,
    draft,
    editing,
    panelMode,
    canWrite,
    machines,
    base,
    edits,
  } = ml

  const invalidCode = () =>
    ml.setStatus('Mã cần dạng A-1234 hoặc L-123.', 'err')

  let content: ReactNode

  if (!cur) {
    content = (
      <>
        <div>
          {editing
            ? panelMode === 'new'
              ? 'Nhập mã máy mới, rồi kéo trên bản vẽ để vẽ khung.'
              : 'Chọn một máy trong danh sách hoặc trên bản vẽ để chỉnh khung. Bấm “+ Máy mới” để thêm máy chưa có.'
            : 'Bấm vào mã máy để xem vị trí. Có thể bấm trực tiếp vào máy trên bản vẽ.'}
        </div>

        {editing && (
          <Actions>
            <PanelButton onClick={() => ml.openPanel('new')}>
              Thêm máy mới
            </PanelButton>
          </Actions>
        )}

        {editing && panelMode === 'new' && (
          <CodeInput
            placeholder="Mã máy mới"
            label="Tạo"
            onSubmit={ml.createNew}
            onInvalid={invalidCode}
          />
        )}
      </>
    )
  } else if (!editing) {
    const m = machines[cur]

    content = (
      <>
        <MachineCode code={cur} />

        <div>
          {!m
            ? 'Máy này đã bị xóa khỏi danh sách.'
            : m.boxes.length > 1
              ? `Mã này có ${m.boxes.length} vị trí trên bản vẽ.`
              : m.manual
                ? 'Khung đã được chỉnh tay.'
                : m.u
                  ? 'Nhãn trên bản vẽ bị chồng chữ, mã đọc chưa chắc chắn.'
                  : 'Khung là vùng ước lượng quanh máy, dựa trên nét vẽ gần nhãn.'}
        </div>

        {canWrite && m && (
          <Actions>
            <PanelButton onClick={() => ml.setEditing(true)}>
              Chỉnh khung máy này
            </PanelButton>
          </Actions>
        )}
      </>
    )
  } else {
    const nb = draft ? draft.boxes.length : 0
    const dirty = !!draft?.dirty
    const needsReview = !!machines[cur]?.review

    content = (
      <>
        <MachineCode code={cur} />

        <div>
          {nb
            ? 'Kéo khung để di chuyển, kéo ô vuông ở cạnh để đổi kích thước. Phím mũi tên dịch 0,5 pt (Shift: 3 pt).'
            + ' Khi thả chuột: giữ Alt = không tự ôm, giữ Shift = chỉ tìm trong khung.'
            + ' F: ôm theo máy (Shift+F: đảo “Giới hạn trong khung” lần này). Ctrl+Z / Ctrl+Y hoàn tác / làm lại.'
            + (draft?.boxes[act]?.fx
              ? ' Click khối để thêm / bớt; Alt+click nét để cắt máy dính; Alt + kéo = bút loại trừ, Shift + kéo = bút bổ sung.'
              : '')
            + (draft?.boxes[act]?.p
              ? ' G: làm gọn đường bao (Enter áp dụng, Esc bỏ).'
              : '')
            + (draft?.boxes[act]?.p && ml.cadOutline
              ? ' Kéo đỉnh để sửa: tự hút thẳng hàng với đỉnh khác (giữ Ctrl: tắt hút và bắt dính nét),'
              + ' nhấp đúp cạnh để thêm đỉnh, chọn đỉnh + Delete để xoá.'
              : '')
            + (nb > 1 ? ` Đang chọn vị trí ${act + 1}/${nb}.` : '')
            : 'Máy chưa có khung. Bấm “Vẽ khung” rồi kéo trên bản vẽ.'}
        </div>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.6, mt: 1 }}>
          <FormControlLabel
            sx={{
              m: 0,
              mr: 'auto',
              '& .MuiFormControlLabel-label': { fontSize: 12.5 },
            }}
            control={(
              <Switch
                size="small"
                checked={ml.autoFit}
                onChange={(e) => ml.setAutoFit(e.target.checked)}
              />
            )}
            label="Tự ôm khi chỉnh"
          />

          <PanelButton
            disabled={!nb || ml.fitterState === 'error'}
            loading={ml.fittingIdx !== null}
            title={ml.fitterState === 'error'
              ? 'Không tải được ảnh layout'
              : ml.fitterState === 'loading' ? 'Đang chuẩn bị ảnh layout…' : 'Phím tắt F (Shift: đảo “Giới hạn trong khung”)'}
            onClick={(e) => ml.fitCurrent(e.shiftKey)}
          >
            Ôm theo máy (F)
          </PanelButton>

          <PanelButton
            disabled={!draft?.boxes[act]?.p?.length || ml.fitterState !== 'ready'}
            aria-pressed={!!ml.tidyPreview}
            title={!draft?.boxes[act]?.p?.length
              ? 'Khung chưa có đường bao'
              : 'Rút gọn đường bao hiện tại, không ôm lại (phím tắt G)'}
            onClick={ml.tidyCurrent}
          >
            Làm gọn (G)
          </PanelButton>

          <PanelButton
            aria-pressed={ml.fitTool}
            appearance={ml.fitTool ? 'action' : 'default'}
            disabled={ml.fitterState === 'error'}
            title="Click vào máy trên bản vẽ để ôm quanh điểm click (Esc để thoát)"
            onClick={() => ml.setFitTool(!ml.fitTool)}
          >
            Chế độ fit
          </PanelButton>
        </Box>

        {nb > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
            <span>Kiểu ôm</span>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={ml.activeFitMode}
              onChange={(_, v: FitMode | null) => {
                if (v) ml.chooseFitMode(v)
              }}
              aria-label="Kiểu ôm khung"
              sx={{
                '& .MuiToggleButton-root': {
                  py: 0.25,
                  px: 1,
                  fontSize: 12,
                  textTransform: 'none',
                },
              }}
            >
              {FIT_MODES.map((m) => (
                <ToggleButton key={m} value={m}>
                  {FIT_MODE_LABEL[m]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}

        <Actions>
          <PanelButton onClick={() => ml.beginDraw(nb ? 'replace' : 'add')}>
            {nb ? 'Vẽ lại khung' : 'Vẽ khung'}
          </PanelButton>

          {nb > 0 && (
            <PanelButton onClick={() => ml.beginDraw('add')}>
              Thêm vị trí
            </PanelButton>
          )}

          {nb > 1 && (
            <PanelButton appearance="destructive" onClick={ml.removeLocation}>
              Xóa vị trí {act + 1}
            </PanelButton>
          )}

          <PanelButton onClick={() => ml.togglePanel('rename')}>
            Đổi mã
          </PanelButton>

          {ml.canRevert && base[cur] && (edits[cur] || dirty) && (
            <PanelButton onClick={ml.revertAuto}>
              Về khung tự động
            </PanelButton>
          )}

          <PanelButton appearance="destructive" onClick={() => ml.togglePanel('del')}>
            Xóa máy
          </PanelButton>
        </Actions>

        {panelMode === 'rename' && (
          <CodeInput
            placeholder="Mã đúng"
            label="Đổi"
            onSubmit={ml.renameTo}
            onInvalid={invalidCode}
          />
        )}

        {panelMode === 'del' && (
          <Box sx={{ display: 'flex', gap: 0.6, mt: 1, alignItems: 'center' }}>
            <Box component="span" sx={{ flex: 1 }}>
              Xóa {cur} khỏi danh sách?
            </Box>

            <PanelButton appearance="destructive" onClick={ml.deleteMachine}>
              Xóa
            </PanelButton>

            <PanelButton onClick={ml.closePanel}>
              Không
            </PanelButton>
          </Box>
        )}

        <Actions>
          {needsReview && (
            <PanelButton
              appearance="success"
              disabled={dirty || !nb}
              onClick={ml.confirmReview}
            >
              Đúng rồi
            </PanelButton>
          )}

          <PanelButton
            appearance="action"
            disabled={!(dirty && nb)}
            onClick={ml.save}
          >
            Lưu
          </PanelButton>

          <PanelButton disabled={!dirty} onClick={ml.cancel}>
            Hủy thay đổi
          </PanelButton>
        </Actions>
      </>
    )
  }

  return (
    <Box
      sx={{
        px: 1.75,
        pt: 1.25,
        pb: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        fontSize: 12.5,
        color: 'text.secondary',
      }}
    >
      {content}
      <StatusLine ml={ml} />
    </Box>
  )
}

function MachineCode({ code }: { code: string }) {
  return (
    <Typography
      component="div"
      sx={{
        color: 'text.primary',
        font: `600 15px ${codeFontFamily}`,
      }}
    >
      {code}
    </Typography>
  )
}
