import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { notify } from '../common/notify'
import { usePdf2cadJob } from '../../hooks/usePdf2cadJob'
import { pdf2cadApi } from '../../services/pdf2cadService'
import type { DxfPreview, Pdf2cadLearnResult, Pdf2cadOptions, Pdf2cadReport } from '../../types/pdf2cad'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import { FileDropCard, OptionsCard, RunCard, type ProgressTone } from './ConvertControls'
import { DxfViewer, type ViewerSource } from './DxfViewer'
import { describePreview } from './dxfBounds'
import { fmtMB, reportKey, translateServer, usePdf2cadText } from './pdf2cadText'
import { ResultsTable, type LearnState } from './ResultsTable'

const OPTIONS_KEY = 'pdf2cad:options'
const ACCEPTED = /\.(pdf|tiff?|png|jpe?g|bmp)$/i

const DEFAULT_OPTIONS: Pdf2cadOptions = {
  pages: '',
  scale: '',
  dpi: 300,
  thick: 0.5,
  ocr: 'auto',
  fitArcs: true,
  raster: true,
  autoRotate: true,
  removeStamps: true,
  keepGlyphs: false,
}

function loadOptions(): Pdf2cadOptions {
  const stored = loadPreference(OPTIONS_KEY)
  return stored && typeof stored === 'object' ? { ...DEFAULT_OPTIONS, ...(stored as Partial<Pdf2cadOptions>) } : DEFAULT_OPTIONS
}

type ViewerState =
  | { kind: 'none' }
  | { kind: 'local'; name: string }
  | { kind: 'page'; name: string; page: number; url: string | null; loading: boolean }
  | { kind: 'dxf'; name: string; preview: DxfPreview | null; loading: boolean }

type Notice = { text: () => string; tone: ProgressTone } | null

export function ConvertTab({ onLearned }: { onLearned: (result: Pdf2cadLearnResult, output: string) => void }) {
  const { tx, language } = usePdf2cadText()
  const runner = usePdf2cadJob()
  const { job } = runner

  const [files, setFiles] = useState<File[]>([])
  const [hot, setHot] = useState(false)
  const [options, setOptions] = useState<Pdf2cadOptions>(loadOptions)
  const [notice, setNotice] = useState<Notice>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [viewer, setViewer] = useState<ViewerState>({ kind: 'none' })
  const [learnStates, setLearnStates] = useState<Record<string, LearnState>>({})
  const viewSeq = useRef(0)

  // ---------------- chọn file
  function addFiles(list: FileList) {
    let bad = 0
    const added: File[] = []
    for (const f of Array.from(list)) {
      if (!ACCEPTED.test(f.name)) {
        bad++
        continue
      }
      if (!files.some((x) => x.name === f.name && x.size === f.size) && !added.some((x) => x.name === f.name && x.size === f.size)) {
        added.push(f)
      }
    }
    if (added.length) {
      setFiles((prev) => [...prev, ...added])
      if (!job) setViewer({ kind: 'local', name: added[added.length - 1].name })
    }
    setNotice(bad ? { text: () => tx.skipped(bad), tone: 'warn' } : null)
  }

  function onDragOver(e: DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    if (!hot) setHot(true)
  }

  function onDragLeave(e: DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHot(false)
  }

  function onDrop(e: DragEvent) {
    if (!e.dataTransfer.files.length) return
    e.preventDefault()
    setHot(false)
    addFiles(e.dataTransfer.files)
  }

  function changeOptions(next: Pdf2cadOptions) {
    setOptions(next)
    savePreference(OPTIONS_KEY, next)
  }

  // ---------------- xem trước
  async function showDxf(output: string) {
    if (!job) return
    const seq = ++viewSeq.current
    setViewer({ kind: 'dxf', name: output, preview: null, loading: true })
    try {
      const preview = await pdf2cadApi.preview(job.id, output)
      if (seq === viewSeq.current) setViewer({ kind: 'dxf', name: output, preview, loading: false })
    } catch {
      if (seq === viewSeq.current) setViewer({ kind: 'dxf', name: output, preview: null, loading: false })
    }
  }

  async function showPage(report: Pdf2cadReport) {
    if (!job) return
    const idx = job.files.findIndex((f) => f.name === report.file)
    if (idx < 0) return
    const seq = ++viewSeq.current
    setViewer({ kind: 'page', name: report.file, page: report.page, url: null, loading: true })
    try {
      const url = await pdf2cadApi.pageImageUrl(job.id, idx, report.page)
      if (seq === viewSeq.current) setViewer({ kind: 'page', name: report.file, page: report.page, url, loading: false })
    } catch {
      if (seq === viewSeq.current) setViewer({ kind: 'page', name: report.file, page: report.page, url: null, loading: false })
    }
  }

  const reports = useMemo(() => job?.reports ?? [], [job])
  const selected = reports.find((r) => reportKey(r) === selectedKey) ?? null

  function select(report: Pdf2cadReport) {
    setSelectedKey(reportKey(report))
    if (report.output) showDxf(report.output)
    else showPage(report)
  }

  // kết quả đầu tiên của job → tự chọn để xem ngay
  const firstOk = reports.find((r) => r.output) ?? null
  const autoKey = job && firstOk ? `${job.id}/${reportKey(firstOk)}` : null
  useEffect(() => {
    if (autoKey && firstOk && !selectedKey) select(firstOk)
    // chỉ chạy khi có kết quả đầu tiên của job mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoKey])

  // ảnh trang gốc lấy qua fetch (cần header) → blob URL; đổi ảnh thì giải phóng ảnh cũ
  const pageUrl = viewer.kind === 'page' ? viewer.url : null
  useEffect(() => () => {
    if (pageUrl?.startsWith('blob:')) URL.revokeObjectURL(pageUrl)
  }, [pageUrl])

  const viewTab: 'pdf' | 'dxf' = viewer.kind === 'dxf' ? 'dxf' : 'pdf'

  function changeViewTab(next: 'pdf' | 'dxf' | null) {
    if (!next || next === viewTab) return
    if (next === 'dxf') {
      if (selected?.output) showDxf(selected.output)
      return
    }
    if (selected) showPage(selected)
    else if (files[0]) setViewer({ kind: 'local', name: files[files.length - 1].name })
  }

  const source = useMemo<ViewerSource | null>(() => {
    if (viewer.kind === 'page' && viewer.url) return { kind: 'image', url: viewer.url }
    if (viewer.kind === 'dxf' && viewer.preview) return { kind: 'dxf', preview: viewer.preview }
    return null
  }, [viewer])

  const info = viewer.kind === 'local'
    ? tx.localHint(viewer.name)
    : viewer.kind === 'page'
      ? tx.pageOf(viewer.name, viewer.page)
      : viewer.kind === 'dxf'
        ? viewer.preview
          ? describePreview(viewer.name, viewer.preview, tx.dxfInfo)
          : viewer.loading
            ? tx.loadingPreview
            : tx.noPreview
        : ''

  // ---------------- chạy
  function run() {
    if (!files.length) {
      setNotice({ text: () => tx.needFile, tone: 'warn' })
      return
    }
    setNotice(null)
    setSelectedKey(null)
    setLearnStates({})
    viewSeq.current++
    setViewer({ kind: 'local', name: files[files.length - 1].name })
    runner.start(files, options)
  }

  async function download(output: string) {
    if (!job) return
    try {
      await pdf2cadApi.downloadFile(job.id, output)
    } catch (e) {
      notify.error(tx.noPreview, { detail: translateServer(language, e instanceof Error ? e.message : String(e)) })
    }
  }

  async function downloadZip() {
    if (!job) return
    try {
      await pdf2cadApi.downloadZip(job.id)
    } catch (e) {
      notify.error(tx.zip, { detail: translateServer(language, e instanceof Error ? e.message : String(e)) })
    }
  }

  async function learn(output: string) {
    if (!job) return
    setLearnStates((prev) => ({ ...prev, [output]: { kind: 'busy' } }))
    try {
      const result = await pdf2cadApi.learn(job.id, output)
      setLearnStates((prev) => ({ ...prev, [output]: { kind: 'done', count: result.templates.length } }))
      onLearned(result, output)
    } catch (e) {
      setLearnStates((prev) => {
        const next = { ...prev }
        delete next[output]
        return next
      })
      notify.error(tx.learnFail, { detail: translateServer(language, e instanceof Error ? e.message : String(e)) })
    }
  }

  // ---------------- dòng trạng thái
  const okCount = reports.filter((r) => r.output).length
  const errCount = reports.filter((r) => r.error).length
  let message: string = tx.ready
  let tone: ProgressTone = 'normal'
  let stage = ''

  if (runner.upload) {
    message = tx.uploadingN(fmtMB(runner.upload.loaded), fmtMB(runner.upload.total))
    stage = tx.step1
  } else if (notice) {
    message = notice.text()
    tone = notice.tone
  } else if (runner.error && !runner.active) {
    message = tx.errorPrefix + translateServer(language, runner.error)
    tone = 'err'
  } else if (runner.gone) {
    message = tx.jobGone
    tone = 'warn'
  } else if (runner.stopped) {
    message = tx.stopped
    tone = 'warn'
  } else if (job) {
    if (job.status === 'queued') {
      message = tx.queuedMsg(job.queue_position ?? '?')
      stage = tx.queuedStage
    } else if (job.status === 'running') {
      message = tx.runningMsg(job.current ?? '', job.done_pages, job.total_pages)
      const t = runner.timing
      stage = `${job.stage ? translateServer(language, job.stage) : tx.processing}${t ? ` · ${tx.sec(t.elapsed)}${t.eta != null ? tx.eta(tx.sec(t.eta)) : ''}` : ''}`
    } else {
      const status = job.status === 'done'
        ? tx.done
        : job.status === 'cancelled'
          ? tx.cancelled
          : tx.errorPrefix + translateServer(language, job.message)
      message = tx.summary(status, okCount, errCount)
      tone = job.status === 'done' && !errCount ? 'ok' : errCount || job.status === 'error' ? 'err' : 'warn'
    }
  }

  return (
    <Box
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gap: 1,
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '340px minmax(0, 1fr)' },
        overflow: { xs: 'auto', lg: 'hidden' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, overflow: { lg: 'auto' }, '& > *': { flexShrink: 0 } }}>
        <FileDropCard
          files={files}
          hot={hot}
          onAdd={addFiles}
          onRemove={(i) => setFiles((prev) => prev.filter((_, j) => j !== i))}
          onClear={() => setFiles([])}
          onPreview={(f) => {
            if (!job) setViewer({ kind: 'local', name: f.name })
          }}
        />
        <OptionsCard options={options} onChange={changeOptions} disabled={runner.active} />
        <RunCard
          canRun={!runner.active}
          indeterminate={job?.status === 'queued' && !runner.stopped}
          percent={runner.percent}
          message={message}
          tone={tone}
          stage={stage}
          canStop={runner.active && !runner.upload}
          canZip={okCount > 0}
          onRun={run}
          onStop={runner.cancel}
          onZip={downloadZip}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: { xs: '420px auto', lg: 'minmax(0, 1fr) auto' },
          gap: 1,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <DxfViewer
          source={source}
          info={info}
          loading={(viewer.kind === 'dxf' || viewer.kind === 'page') && viewer.loading}
          emptyText={viewer.kind === 'local' ? tx.localHint(viewer.name) : tx.viewerEmpty}
          toolbar={
            <ToggleButtonGroup
              exclusive
              size="small"
              value={viewTab}
              onChange={(_, next: 'pdf' | 'dxf' | null) => changeViewTab(next)}
              sx={{ '& .MuiToggleButton-root': { height: 28, px: 1.25, textTransform: 'none', fontSize: 12.5, fontWeight: 700 } }}
            >
              <ToggleButton value="pdf">{tx.tabPdf}</ToggleButton>
              <ToggleButton value="dxf" disabled={!selected?.output}>{tx.tabDxf}</ToggleButton>
            </ToggleButtonGroup>
          }
        />

        <ResultsTable
          job={job}
          selectedKey={selectedKey}
          learnStates={learnStates}
          onSelect={select}
          onDownload={download}
          onLearn={learn}
        />
      </Box>
    </Box>
  )
}
