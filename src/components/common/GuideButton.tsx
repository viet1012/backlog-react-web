import { HeaderAction } from './headerActions'

interface GuideButtonProps {
    onClick: () => void
}

/** Shorthand for <HeaderAction kind="guide" /> (kept for existing pages) */
export function GuideButton({ onClick }: GuideButtonProps) {
    return <HeaderAction kind="guide" onClick={onClick} />
}
