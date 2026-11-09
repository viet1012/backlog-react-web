import { useState, type ComponentProps } from 'react'
import { Text } from '@react-three/drei'

import { FONT, TEXT_RENDER_ORDER } from './fonts'

type TextProps = ComponentProps<typeof Text>

interface FitTextProps extends Omit<TextProps, 'children' | 'fontSize' | 'font'> {
  children: string
  fontSize: number
  font?: string
  minFontSize?: number
  // Khối chữ (sau khi xuống dòng) không được vượt quá; vượt thì thu nhỏ dần tới minFontSize
  fitWidth?: number
  fitHeight?: number
}

const STEP = 0.9

/*
 * Chữ SDF: luôn nét ở mọi khoảng cách / độ phân giải (khác texture canvas bị mờ khi thu nhỏ).
 * Dùng chung ánh sáng với nhãn giấy (meshStandardMaterial, không tone mapping) để màu chữ khớp nền.
 */
export function FitText({
  children,
  fontSize,
  font = FONT.bold,
  minFontSize = fontSize * 0.6,
  fitWidth = Infinity,
  fitHeight = Infinity,
  ...props
}: FitTextProps) {
  // Đổi chữ (vd. đổi ngôn ngữ) thì đo lại từ cỡ gốc
  const [fit, setFit] = useState({ text: children, scale: 1 })
  const scale = fit.text === children ? fit.scale : 1
  const size = fontSize * scale

  return (
    <Text
      font={font}
      fontSize={size}
      renderOrder={TEXT_RENDER_ORDER}
      raycast={() => null}
      onSync={(mesh) => {
        const bounds: number[] | undefined = mesh.textRenderInfo?.blockBounds
        if (!bounds) return
        const tooBig = bounds[2] - bounds[0] > fitWidth + 1e-6 || bounds[3] - bounds[1] > fitHeight + 1e-6
        if (tooBig && size * STEP >= minFontSize) setFit({ text: children, scale: scale * STEP })
      }}
      {...props}
    >
      {children}
      <meshStandardMaterial roughness={0.6} toneMapped={false} />
    </Text>
  )
}
