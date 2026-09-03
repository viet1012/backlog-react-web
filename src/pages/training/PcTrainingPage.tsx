import { Box } from '@mui/material'
import { useCallback, useRef, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { PageShell } from '../../components/common/PageShell'
import { PcTrainingHero } from '../../components/training/PcTrainingHero'
import { PcTrainingModules } from '../../components/training/PcTrainingModules'
import { PcTrainingNav } from '../../components/training/PcTrainingNav'
import { PcOrderFlow, PcOverviewSection, PcTrainingRoadmap } from '../../components/training/PcTrainingOverviewSections'
import { PcResourcesSection, PcTrainingFinalCta, PcWarningsSection } from '../../components/training/PcTrainingReferenceSections'
import { PcSystemsSection } from '../../components/training/PcSystemsSection'
import { PcTerminologySection } from '../../components/training/PcTerminologySection'

export function PcTrainingPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState('overview')

  const navigateTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <PageShell>
      <PageHeader title="PC TRAINING" subtitle="Production Control onboarding · KVH Factory 2" />

      <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <Box
          ref={scrollRef}
          sx={{
            position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden',
            scrollBehavior: 'smooth', pr: { xs: 0.25, md: 0.75 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', pb: 4 }}>
            <PcTrainingNav
              scrollRef={scrollRef}
              activeId={activeSection}
              onActiveIdChange={setActiveSection}
              onNavigate={navigateTo}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 } }}>
              <Box component="section" id="introduction" sx={{ scrollMarginTop: 64 }}>
                <PcTrainingHero onNavigate={navigateTo} />
              </Box>
              <PcOverviewSection />
              <PcOrderFlow />
              <PcSystemsSection />
              <PcTrainingRoadmap />
              <PcTrainingModules />
              <PcTerminologySection />
              <PcWarningsSection />
              <PcResourcesSection />
              <PcTrainingFinalCta onNavigate={navigateTo} />
            </Box>
          </Box>
        </Box>
      </Box>
    </PageShell>
  )
}
