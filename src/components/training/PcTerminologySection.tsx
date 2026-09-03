import { SearchRounded } from '@mui/icons-material'
import { Box, Chip, InputAdornment, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { pcTrainingTerminology } from '../../data/training/pcTrainingTerminology'
import { GlassPanel } from '../common/GlassPanel'
import { PcTrainingSection } from './PcTrainingSection'

export function PcTerminologySection() {
  const [search, setSearch] = useState('')
  const filteredTerms = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi')
    if (!query) return pcTrainingTerminology
    return pcTrainingTerminology.filter((item) =>
      [item.term, item.name, item.definition, item.category]
        .some((value) => value?.toLocaleLowerCase('vi').includes(query)),
    )
  }, [search])

  return (
    <PcTrainingSection id="terminology" number="07" title="Key Terminology" description="Tra cứu nhanh các thuật ngữ xuất hiện trong tài liệu đào tạo.">
      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Tìm thuật ngữ..."
        size="small"
        fullWidth
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> } }}
        sx={{ maxWidth: 420, mb: 1 }}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 0.8 }}>
        {filteredTerms.map((item) => (
          <GlassPanel key={item.term} sx={{ p: 1.25 }}>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900 }}>{item.term}</Typography>
              <Chip label={item.category} size="small" variant="outlined" />
            </Box>
            {item.name && <Typography color="primary.main" sx={{ mt: 0.35, fontSize: 10.5, fontWeight: 700 }}>{item.name}</Typography>}
            <Typography color="text.secondary" sx={{ mt: 0.55, fontSize: 11.5, lineHeight: 1.5 }}>{item.definition}</Typography>
          </GlassPanel>
        ))}
      </Box>
      {filteredTerms.length === 0 && <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center', fontSize: 12 }}>Không tìm thấy thuật ngữ phù hợp.</Typography>}
    </PcTrainingSection>
  )
}
