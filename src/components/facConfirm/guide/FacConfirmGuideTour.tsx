import { GuideTour } from './GuideTour'
import { facConfirmGuideSteps } from './facConfirmGuideSteps'

interface FacConfirmGuideTourProps {
  open: boolean
  onClose: () => void
}

// Default export: loaded with React.lazy from FacConfirmPage, so the tour
// engine, steps and demos are only downloaded when the guide is first opened
export default function FacConfirmGuideTour({ open, onClose }: FacConfirmGuideTourProps) {
  return <GuideTour open={open} steps={facConfirmGuideSteps} onClose={onClose} />
}
