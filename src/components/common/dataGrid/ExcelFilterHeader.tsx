import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded'
import { useGridApiContext } from '@mui/x-data-grid'
import { useOptionalExcelColumnFilter } from './excelFilterContext'

interface ExcelFilterHeaderProps {
  field: string
  label: string
}

export function ExcelFilterHeader({ field, label }: ExcelFilterHeaderProps) {
  const apiRef = useGridApiContext()
  const excelFilter = useOptionalExcelColumnFilter()
  const isFiltered = excelFilter?.excelFilters.some((filter) => filter.field === field) ?? false

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        apiRef.current.showColumnMenu(field)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          apiRef.current.showColumnMenu(field)
        }
      }}
      style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        gap: 5, overflow: 'hidden', cursor: 'pointer',
      }}
    >
      <span style={{
        minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', fontWeight: isFiltered ? 700 : undefined,
      }}>
        {label}
      </span>
      {isFiltered && (
        <FilterAltRoundedIcon color="primary" sx={{ fontSize: 16, flexShrink: 0 }} />
      )}
    </span>
  )
}
