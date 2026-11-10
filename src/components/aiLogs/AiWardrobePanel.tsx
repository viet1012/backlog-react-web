import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded'
import ColorizeRoundedIcon from '@mui/icons-material/ColorizeRounded'
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  DEFAULT_SKIN,
  MascotSvg,
  SKIN_PRESETS,
  SKIN_SWATCHES,
  sameSkin,
  useMascotContext,
  useMascotName,
} from '../mascot'
import type { MascotGlasses, MascotHat, MascotMood, MascotSkin } from '../mascot'
import { AssistantSkinError, saveAssistantSkin } from '../../services/assistantService'
import { useI18n } from '../../i18n/useI18n'
import { uiTokens } from '../../theme/uiTokens'
import styles from './AiWardrobe.module.css'

const HATS: MascotHat[] = ['helmet', 'cap', 'beanie', 'none']
const GLASSES: MascotGlasses[] = ['none', 'round', 'sunglasses']
const MOODS: MascotMood[] = ['idle', 'thinking', 'sad']
const SPARKLES = [
  { left: '30%', top: '30%', delay: '0s' },
  { left: '66%', top: '22%', delay: '0.15s' },
  { left: '24%', top: '58%', delay: '0.3s' },
  { left: '72%', top: '52%', delay: '0.1s' },
  { left: '50%', top: '12%', delay: '0.25s' },
]

type Section = 'outfit' | 'face' | 'background'
type Toast = { severity: 'success' | 'warning' | 'error'; text: string }

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function randomSkin(): MascotSkin {
  return {
    hat: pick(HATS),
    hatColor: pick(SKIN_SWATCHES.cloth),
    shirtColor: pick(SKIN_SWATCHES.cloth),
    overallColor: pick(SKIN_SWATCHES.cloth),
    strapColor: pick(SKIN_SWATCHES.cloth),
    skinTone: pick(SKIN_SWATCHES.skin),
    hairColor: pick(SKIN_SWATCHES.hair),
    beard: Math.random() < 0.5,
    glasses: pick(GLASSES),
    avatarBg: pick(SKIN_SWATCHES.bg),
  }
}

/**
 * AI Logs › Phòng thay đồ: admin chọn trang phục cho mascot.
 * Trái: sân khấu xem trước (đổi biểu cảm, vẫy tay, xem ở các vị trí). Phải: tủ đồ (bộ có sẵn, mũ, màu, kính…).
 * Lưu → PUT /api/assistant/config/skin, áp dụng cho mọi người dùng.
 */
export function AiWardrobePanel() {
  const { t } = useI18n()
  const w = t.aiLogs.wardrobe
  const name = useMascotName()
  const { skin: applied, applySkin } = useMascotContext()

  const [draft, setDraft] = useState<MascotSkin>(applied)
  const dirty = !sameSkin(draft, applied)

  // skin áp dụng đổi từ ngoài (GET /config về) khi chưa sửa gì → theo luôn
  const [prevApplied, setPrevApplied] = useState(applied)
  if (applied !== prevApplied) {
    setPrevApplied(applied)
    if (sameSkin(draft, prevApplied)) setDraft(applied)
  }

  const [mood, setMood] = useState<MascotMood>('idle')
  const [waving, setWaving] = useState(false)
  const [changeSeq, setChangeSeq] = useState(0)
  const [sparkleSeq, setSparkleSeq] = useState(0)
  const [section, setSection] = useState<Section>('outfit')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  /** animate: đổi kiểu (mũ / kính) → hình "pop" nhẹ; đổi màu thì không (kéo color picker sẽ giật) */
  function update(patch: Partial<MascotSkin>, animate = false) {
    setDraft((prev) => ({ ...prev, ...patch }))
    if (animate) setChangeSeq((seq) => seq + 1)
  }

  function replace(next: MascotSkin) {
    setDraft(next)
    setChangeSeq((seq) => seq + 1)
  }

  async function save() {
    setSaving(true)
    try {
      const saved = await saveAssistantSkin(draft)
      applySkin(saved)
      setDraft(saved)
      setSparkleSeq((seq) => seq + 1)
      setWaving(true)
      setToast({ severity: 'success', text: w.saved(name) })
    } catch (error) {
      if (error instanceof AssistantSkinError && error.unsupported) {
        // backend chưa có endpoint → áp dụng tạm trên máy này để xem thử
        applySkin(draft)
        setSparkleSeq((seq) => seq + 1)
        setToast({ severity: 'warning', text: w.savedLocal })
      } else {
        setToast({
          severity: 'error',
          text: `${w.saveFailed}: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 5fr) 7fr' },
        gap: uiTokens.page.gap,
        alignItems: 'start',
        pb: 2,
      }}
    >
      {/* ===== Sân khấu xem trước ===== */}
      <Paper
        variant="outlined"
        sx={{ borderRadius: 3, overflow: 'hidden', position: { md: 'sticky' }, top: { md: 0 } }}
      >
        <Box
          className={styles.stage}
          sx={(theme) => {
            const dark = theme.palette.mode === 'dark'
            return {
              '--spot': dark ? 'rgba(255, 236, 190, 0.18)' : 'rgba(255, 244, 214, 0.95)',
              '--wall-top': dark ? '#262b3a' : '#f4efe6',
              '--wall-bottom': dark ? '#1d2130' : '#e9e1d2',
              '--floor': dark ? '#3a3026' : '#c8a27a',
              '--floor-dark': dark ? '#2a221b' : '#a9825b',
              '--curtain': dark ? '#6b2d3c' : '#b8435a',
              '--curtain-dark': dark ? '#55222f' : '#963246',
            }
          }}
        >
          <span className={styles.rod} />
          <span className={`${styles.curtain} ${styles.curtainLeft}`} />
          <span className={`${styles.curtain} ${styles.curtainRight}`} />
          <span className={styles.floorShadow} />

          {/* nhãn trạng thái */}
          <Chip
            size="small"
            icon={dirty ? <CheckroomRoundedIcon /> : <CheckRoundedIcon />}
            label={dirty ? w.previewing : w.applied}
            color={dirty ? 'warning' : 'success'}
            sx={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2, fontWeight: 600 }}
          />

          <Box
            key={changeSeq}
            className={`${styles.figure} ${changeSeq > 0 ? styles.changed : ''}`}
            onAnimationEnd={(event) => {
              if (event.animationName.includes('wave')) setWaving(false)
            }}
          >
            <MascotSvg waving={waving} mood={mood} skin={draft} />
          </Box>

          {sparkleSeq > 0 && SPARKLES.map((s, index) => (
            <span
              key={`${sparkleSeq}-${index}`}
              className={styles.sparkle}
              style={{ left: s.left, top: s.top, animationDelay: s.delay }}
              aria-hidden="true"
            >
              ✨
            </span>
          ))}
        </Box>

        {/* điều khiển sân khấu */}
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1.5, py: 1, flexWrap: 'wrap' }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mood}
            onChange={(_, next: MascotMood | null) => next && setMood(next)}
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.25, py: 0.25, fontSize: 12 } }}
          >
            {MOODS.map((m) => (
              <ToggleButton key={m} value={m}>{w.moods[m]}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PanToolOutlinedIcon />}
            onClick={() => {
              setWaving(false)
              window.requestAnimationFrame(() => setWaving(true))
            }}
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            {w.wave}
          </Button>
        </Stack>

        <Divider />

        {/* xem ở các vị trí + trước/sau */}
        <Stack direction="row" sx={{ px: 1.5, py: 1.25, gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <SmallLabel>{w.placesTitle}</SmallLabel>
            <Stack direction="row" sx={{ gap: 1.75, alignItems: 'flex-end' }}>
              <Place label={w.places.message}><Head skin={draft} size={26} mood={mood} /></Place>
              <Place label={w.places.header}><Head skin={draft} size={30} mood={mood} /></Place>
              <Place label={w.places.minimized}><Head skin={draft} size={40} mood={mood} ring /></Place>
            </Stack>
          </Box>
          {dirty && (
            <Box>
              <SmallLabel>{`${w.before} → ${w.after}`}</SmallLabel>
              <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                <Head skin={applied} size={36} />
                <Typography color="text.secondary" sx={{ fontSize: 16 }}>→</Typography>
                <Head skin={draft} size={36} ring />
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* ===== Tủ đồ ===== */}
      <Paper variant="outlined" sx={{ borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ px: 2, pt: 1.75, pb: 1.25 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{w.presetsTitle}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>{w.hint}</Typography>
            </Box>
            <Button
              size="small"
              startIcon={<CasinoOutlinedIcon />}
              onClick={() => replace(randomSkin())}
              sx={{ textTransform: 'none', borderRadius: 999, flexShrink: 0 }}
            >
              {w.random}
            </Button>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: 1,
            }}
          >
            {SKIN_PRESETS.map((preset) => (
              <PresetCard
                key={preset.id}
                label={w.presets[preset.id as keyof typeof w.presets] ?? preset.id}
                skin={preset.skin}
                selected={sameSkin(preset.skin, draft)}
                onClick={() => replace(preset.skin)}
              />
            ))}
          </Box>
        </Box>

        <Tabs
          value={section}
          onChange={(_, next: Section) => setSection(next)}
          sx={{
            px: 1,
            minHeight: 38,
            borderTop: 1,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 38, textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab value="outfit" label={w.sections.outfit} />
          <Tab value="face" label={w.sections.face} />
          <Tab value="background" label={w.sections.background} />
        </Tabs>

        <Stack sx={{ px: 2, py: 1.75, gap: 2 }}>
          {section === 'outfit' && (
            <>
              <Field label={w.hat}>
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  {HATS.map((hat) => (
                    <OptionThumb
                      key={hat}
                      label={w.hats[hat]}
                      selected={draft.hat === hat}
                      onClick={() => update({ hat }, true)}
                    >
                      <Head skin={{ ...draft, hat }} size={52} square />
                    </OptionThumb>
                  ))}
                </Stack>
              </Field>
              {draft.hat !== 'none' && (
                <Field label={w.hatColor}>
                  <ColorSwatches value={draft.hatColor} colors={SKIN_SWATCHES.cloth} onChange={(hatColor) => update({ hatColor })} customLabel={w.customColor} />
                </Field>
              )}
              <Field label={w.shirt}>
                <ColorSwatches value={draft.shirtColor} colors={SKIN_SWATCHES.cloth} onChange={(shirtColor) => update({ shirtColor })} customLabel={w.customColor} />
              </Field>
              <Field label={w.overall}>
                <ColorSwatches value={draft.overallColor} colors={SKIN_SWATCHES.cloth} onChange={(overallColor) => update({ overallColor })} customLabel={w.customColor} />
              </Field>
              <Field label={w.strap}>
                <ColorSwatches value={draft.strapColor} colors={SKIN_SWATCHES.cloth} onChange={(strapColor) => update({ strapColor })} customLabel={w.customColor} />
              </Field>
            </>
          )}

          {section === 'face' && (
            <>
              <Field label={w.skinTone}>
                <ColorSwatches value={draft.skinTone} colors={SKIN_SWATCHES.skin} onChange={(skinTone) => update({ skinTone })} customLabel={w.customColor} />
              </Field>
              <Field label={w.hair}>
                <ColorSwatches value={draft.hairColor} colors={SKIN_SWATCHES.hair} onChange={(hairColor) => update({ hairColor })} customLabel={w.customColor} />
              </Field>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{w.beard}</Typography>
                <Switch checked={draft.beard} onChange={(event) => update({ beard: event.target.checked }, true)} />
              </Stack>
              <Field label={w.glasses}>
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  {GLASSES.map((glasses) => (
                    <OptionThumb
                      key={glasses}
                      label={w.glassesOptions[glasses]}
                      selected={draft.glasses === glasses}
                      onClick={() => update({ glasses }, true)}
                    >
                      <Head skin={{ ...draft, glasses }} size={52} square />
                    </OptionThumb>
                  ))}
                </Stack>
              </Field>
            </>
          )}

          {section === 'background' && (
            <Field label={w.avatarBg}>
              <ColorSwatches value={draft.avatarBg} colors={SKIN_SWATCHES.bg} onChange={(avatarBg) => update({ avatarBg })} customLabel={w.customColor} />
            </Field>
          )}
        </Stack>

        {/* thanh hành động */}
        <Stack
          direction="row"
          sx={(theme) => ({
            mt: 'auto',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.25,
            borderTop: 1,
            borderColor: 'divider',
            flexWrap: 'wrap',
            bgcolor: dirty ? alpha(theme.palette.warning.main, 0.06) : 'transparent',
            transition: 'background-color 0.2s',
          })}
        >
          <Typography
            color={dirty ? 'warning.main' : 'text.secondary'}
            sx={{ fontSize: 12.5, fontWeight: dirty ? 600 : 400, flex: 1, minWidth: 140 }}
          >
            {dirty ? `● ${w.unsaved}` : w.noChanges}
          </Typography>
          <Button
            size="small"
            startIcon={<RestartAltRoundedIcon />}
            disabled={saving || sameSkin(draft, DEFAULT_SKIN)}
            onClick={() => replace(DEFAULT_SKIN)}
            sx={{ textTransform: 'none' }}
          >
            {w.reset}
          </Button>
          <Button
            size="small"
            startIcon={<UndoRoundedIcon />}
            disabled={saving || !dirty}
            onClick={() => replace(applied)}
            sx={{ textTransform: 'none' }}
          >
            {w.undo}
          </Button>
          <Button
            variant="contained"
            size="small"
            disableElevation
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveRoundedIcon />}
            disabled={saving || !dirty}
            onClick={() => void save()}
            sx={{ textTransform: 'none', borderRadius: 999, px: 2, fontWeight: 600 }}
          >
            {w.save}
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={toast !== null}
        autoHideDuration={toast?.severity === 'success' ? 4000 : 8000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)} variant="filled">
          {toast?.text ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// =========================================================
// Thành phần nhỏ
// =========================================================

function SmallLabel({ children }: { children: string }) {
  return (
    <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.75 }}>
      {children}
    </Typography>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>{label}</Typography>
      {children}
    </Box>
  )
}

function Place({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack sx={{ alignItems: 'center', gap: 0.5 }}>
      {children}
      <Typography color="text.secondary" sx={{ fontSize: 10.5 }}>{label}</Typography>
    </Stack>
  )
}

interface HeadProps {
  skin: MascotSkin
  size: number
  mood?: MascotMood
  /** viền trắng + bóng như avatar thu nhỏ */
  ring?: boolean
  /** ô vuông bo góc (thumbnail lựa chọn) thay vì hình tròn */
  square?: boolean
}

/** Đầu mascot trên nền avatar của skin */
function Head({ skin, size, mood = 'idle', ring = false, square = false }: HeadProps) {
  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: square ? 1.5 : '50%',
        overflow: 'hidden',
        bgcolor: skin.avatarBg,
        boxShadow: ring
          ? `0 0 0 2px ${theme.palette.background.paper}, 0 2px 8px ${alpha(theme.palette.common.black, 0.25)}`
          : `0 0 0 1px ${theme.palette.divider}`,
      })}
    >
      <MascotSvg waving={false} headOnly mood={mood} skin={skin} className={styles.thumbSvg} />
    </Box>
  )
}

interface PresetCardProps {
  label: string
  skin: MascotSkin
  selected: boolean
  onClick: () => void
}

function PresetCard({ label, skin, selected, onClick }: PresetCardProps) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={selected}
      sx={(theme) => ({
        position: 'relative',
        flexDirection: 'column',
        gap: 0.75,
        py: 1.25,
        px: 0.5,
        borderRadius: 2,
        border: `1.5px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
        boxShadow: selected ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-2px)', borderColor: theme.palette.primary.main },
      })}
    >
      {selected && (
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 18,
            height: 18,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <CheckRoundedIcon sx={{ fontSize: 13 }} />
        </Box>
      )}
      <Head skin={skin} size={56} />
      <Typography sx={{ fontSize: 12, fontWeight: 600 }} noWrap>{label}</Typography>
    </ButtonBase>
  )
}

interface OptionThumbProps {
  label: string
  selected: boolean
  onClick: () => void
  children: ReactNode
}

/** Ô lựa chọn có hình xem trước (kiểu mũ / kính) */
function OptionThumb({ label, selected, onClick, children }: OptionThumbProps) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={selected}
      sx={(theme) => ({
        flexDirection: 'column',
        gap: 0.5,
        p: 0.75,
        width: 80,
        borderRadius: 2,
        border: `1.5px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: theme.palette.primary.main },
      })}
    >
      {children}
      <Typography sx={{ fontSize: 11.5, fontWeight: selected ? 700 : 500, color: selected ? 'primary.main' : 'text.primary' }} noWrap>
        {label}
      </Typography>
    </ButtonBase>
  )
}

interface ColorSwatchesProps {
  value: string
  colors: readonly string[]
  onChange: (color: string) => void
  customLabel: string
}

/** Hàng ô màu tròn + ô "màu khác" (input color) */
function ColorSwatches({ value, colors, onChange, customLabel }: ColorSwatchesProps) {
  const current = value.toUpperCase()
  const isCustom = !colors.some((c) => c.toUpperCase() === current)
  return (
    <Stack direction="row" sx={{ gap: 0.875, flexWrap: 'wrap', alignItems: 'center' }}>
      {colors.map((color) => {
        const selected = color.toUpperCase() === current
        return (
          <ButtonBase
            key={color}
            aria-label={color}
            aria-pressed={selected}
            title={color}
            onClick={() => onChange(color)}
            sx={(theme) => ({
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: color,
              border: `1px solid ${alpha(theme.palette.common.black, 0.15)}`,
              boxShadow: selected
                ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.primary.main}`
                : 'none',
              transition: 'transform 0.12s, box-shadow 0.12s',
              '&:hover': { transform: 'scale(1.12)' },
            })}
          >
            {selected && (
              <CheckRoundedIcon
                sx={{ fontSize: 16, color: isLight(color) ? 'rgba(0,0,0,0.7)' : '#fff' }}
              />
            )}
          </ButtonBase>
        )
      })}
      <Tooltip title={customLabel}>
        <Box
          component="label"
          sx={(theme) => ({
            position: 'relative',
            width: 28,
            height: 28,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            background: isCustom
              ? value
              : 'conic-gradient(#e04848, #f5c542, #5fae6e, #2bb3a3, #378add, #9b59b6, #e46c9a, #e04848)',
            boxShadow: isCustom
              ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.primary.main}`
              : 'none',
            transition: 'transform 0.12s',
            '&:hover': { transform: 'scale(1.12)' },
            '&:focus-within': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
          })}
        >
          <ColorizeRoundedIcon sx={{ fontSize: 14, color: isCustom && isLight(value) ? 'rgba(0,0,0,0.7)' : '#fff' }} />
          <input
            type="color"
            aria-label={customLabel}
            value={value.toLowerCase()}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
        </Box>
      </Tooltip>
    </Stack>
  )
}

/** màu sáng → icon tối cho dễ nhìn */
function isLight(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 170
}
