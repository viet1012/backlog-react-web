/**
 * "The layout is sliding" signal (sidebar collapse/expand).
 *
 * MainLayout sets it for the duration of the <main> slide animation; charts
 * read it to hold their size until the slide is over, so they redraw once,
 * after the motion, instead of in the middle of it.
 *
 * DataGrid deliberately does not hold: it applies a resize within the same
 * frame, so letting it resize at the start of the slide (hidden by the
 * motion) is smoother than a column-width snap once the slide has stopped.
 */

let sliding = false
const listeners = new Set<() => void>()

export function isLayoutSliding() {
  return sliding
}

export function setLayoutSliding(next: boolean) {
  if (next === sliding) return
  sliding = next
  listeners.forEach((listener) => listener())
}

export function subscribeLayoutSliding(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
