import {
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react'

// Hàm có identity cố định nhưng luôn gọi bản mới nhất của fn.
// Dùng khi truyền callback xuống component memo (MapCanvas, MachineList)
// để parent render lại không làm con render lại theo.
// Không gọi hàm trả về trong lúc render.
export function useStableCallback<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  const ref = useRef(fn)

  useLayoutEffect(() => {
    ref.current = fn
  })

  return useCallback((...args: A) => ref.current(...args), [])
}
