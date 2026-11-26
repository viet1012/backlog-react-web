import { useMemo } from 'react'

import { usePerm } from '../../auth/useAuth'
import { ACTION, PERM } from '../../../routes/appPages'
import { GuideTour, type GuideStep } from './GuideTour'
import { facConfirmGuideSteps } from './facConfirmGuideSteps'

interface FacConfirmGuideTourProps {
  open: boolean
  onClose: () => void
}

// Bước "Xuất Excel" chỉ có khi có FAC_CONFIRM X (nút export bị ẩn nếu không có quyền).
// Bỏ bước thì đánh số lại nhãn "Bước N" cho liền mạch.
function visibleSteps(canExport: boolean): GuideStep[] {
  if (canExport) return facConfirmGuideSteps

  let n = 0

  return facConfirmGuideSteps
    .filter((step) => step.id !== 'export')
    .map((step) => (step.step && /^Bước \d+$/.test(step.step)
      ? { ...step, step: `Bước ${++n}` }
      : step))
}

// Default export: loaded with React.lazy from FacConfirmPage, so the tour
// engine, steps and demos are only downloaded when the guide is first opened
export default function FacConfirmGuideTour({ open, onClose }: FacConfirmGuideTourProps) {
  const canExport = usePerm(PERM.FAC_CONFIRM, ACTION.EXPORT)
  const steps = useMemo(() => visibleSteps(canExport), [canExport])

  return <GuideTour open={open} steps={steps} onClose={onClose} />
}
