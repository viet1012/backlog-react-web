import { HeaderAction } from './headerActions'

interface RefreshButtonProps {
    loading?: boolean
    onClick: () => void
}

/** Shorthand for <HeaderAction kind="refresh" /> (kept for existing pages) */
export function RefreshButton({ loading = false, onClick }: RefreshButtonProps) {
    return <HeaderAction kind="refresh" loading={loading} onClick={onClick} />
}
