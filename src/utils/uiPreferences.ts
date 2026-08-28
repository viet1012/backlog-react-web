import type { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid'

const STORAGE_PREFIX = 'production-control'

export type ThemeMode = 'light' | 'dark'

export interface GridPreferences {
  columnVisibilityModel: GridColumnVisibilityModel
  columnOrder: string[]
  columnWidths: Record<string, number>
  pageSize: number
}

function storageKey(key: string) {
  return `${STORAGE_PREFIX}:${key}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function loadPreference(key: string): unknown {
  try {
    const raw = localStorage.getItem(storageKey(key))
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function savePreference(key: string, value: unknown): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value))
  } catch {
    // Storage can be unavailable or full; UI state should continue to work.
  }
}

export function loadThemeMode(fallback: ThemeMode): ThemeMode {
  const stored = loadPreference('theme')
  if (stored === 'light' || stored === 'dark') return stored

  try {
    const legacyMode = localStorage.getItem('themeMode')
    if (legacyMode === 'light' || legacyMode === 'dark') {
      saveThemeMode(legacyMode)
      return legacyMode
    }
  } catch {
    // Ignore unavailable storage and retain the application's default theme.
  }

  return fallback
}

export function saveThemeMode(mode: ThemeMode): void {
  savePreference('theme', mode)
}

export function loadGridPreferences(
  gridKey: string,
  defaultPageSize: number,
): GridPreferences {
  const stored = loadPreference(`grid:${gridKey}`)
  if (!isRecord(stored)) {
    return {
      columnVisibilityModel: {},
      columnOrder: [],
      columnWidths: {},
      pageSize: defaultPageSize,
    }
  }

  const visibility = isRecord(stored.columnVisibilityModel)
    ? Object.fromEntries(
      Object.entries(stored.columnVisibilityModel)
        .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'),
    )
    : {}
  const order = Array.isArray(stored.columnOrder)
    ? stored.columnOrder.filter((field): field is string => typeof field === 'string')
    : []
  const widths = isRecord(stored.columnWidths)
    ? Object.fromEntries(
      Object.entries(stored.columnWidths).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0,
      ),
    )
    : {}
  const pageSize = typeof stored.pageSize === 'number'
    && Number.isInteger(stored.pageSize)
    && stored.pageSize > 0
    ? stored.pageSize
    : defaultPageSize

  return {
    columnVisibilityModel: visibility,
    columnOrder: [...new Set(order)],
    columnWidths: widths,
    pageSize,
  }
}

export function saveGridPreferences(gridKey: string, value: GridPreferences): void {
  savePreference(`grid:${gridKey}`, value)
}

export function applyGridColumnPreferences<T extends GridColDef>(
  columns: readonly T[],
  columnOrder: readonly string[],
  columnWidths: Readonly<Record<string, number>>,
): T[] {
  const orderIndex = new Map(columnOrder.map((field, index) => [field, index]))
  return columns
    .map((column) => ({
      ...column,
      ...(columnWidths[column.field] ? { width: columnWidths[column.field] } : {}),
    }))
    .sort((left, right) => {
      const leftIndex = orderIndex.get(left.field) ?? Number.MAX_SAFE_INTEGER
      const rightIndex = orderIndex.get(right.field) ?? Number.MAX_SAFE_INTEGER
      return leftIndex - rightIndex
    }) as T[]
}


export interface FacConfirmPreferences {
    div: string
    procGrp: 'Fine' | 'Heat' | 'Rough'
}

export function loadFacConfirmPreferences(): FacConfirmPreferences {
    const stored = loadPreference('fac-confirm')

    if (!isRecord(stored)) {
        return {
            div: 'PR',
            procGrp: 'Rough',
        }
    }

    const div =
        typeof stored.div === 'string'
            ? stored.div
            : 'PR'

    const procGrp =
        stored.procGrp === 'Fine'
            || stored.procGrp === 'Heat'
            || stored.procGrp === 'Rough'
            ? stored.procGrp
            : 'Rough'

    return {
        div,
        procGrp,
    }
}

export function saveFacConfirmPreferences(
    value: FacConfirmPreferences,
): void {
    savePreference(
        'fac-confirm',
        value,
    )
}