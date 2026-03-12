import type { CSSProperties } from "react"
import type { Color } from "@shared/types"

type CardVars = CSSProperties & Record<`--${string}`, string>

const accentRGBByColor: Record<Color, string> = {
  primary: "239, 68, 68",
  red: "239, 68, 68",
  blue: "59, 130, 246",
  green: "34, 197, 94",
  indigo: "99, 102, 241",
  gray: "107, 114, 128",
  orange: "249, 115, 22",
  slate: "100, 116, 139",
  teal: "20, 184, 166",
  emerald: "16, 185, 129",
  yellow: "234, 179, 8",
}

const variants = [
  {
    angle: "146deg",
    glowX: "14%",
    glowY: "12%",
    bloomX: "86%",
    bloomY: "82%",
  },
  {
    angle: "164deg",
    glowX: "84%",
    glowY: "10%",
    bloomX: "10%",
    bloomY: "88%",
  },
  {
    angle: "132deg",
    glowX: "22%",
    glowY: "82%",
    bloomX: "82%",
    bloomY: "18%",
  },
  {
    angle: "154deg",
    glowX: "78%",
    glowY: "76%",
    bloomX: "16%",
    bloomY: "14%",
  },
]

export function getCardTheme(color: Color, index: number): CardVars {
  const accentRGB = accentRGBByColor[color] ?? accentRGBByColor.primary
  const variant = variants[index % variants.length]
  const emphasis = index === 0 ? 0.12 : index < 4 ? 0.08 : index < 8 ? 0.04 : 0

  return {
    "--card-accent": accentRGB,
    "--card-angle": variant.angle,
    "--card-glow-x": variant.glowX,
    "--card-glow-y": variant.glowY,
    "--card-bloom-x": variant.bloomX,
    "--card-bloom-y": variant.bloomY,
    "--card-base-alpha": `${0.18 + emphasis / 1.5}`,
    "--card-border-alpha": `${0.24 + emphasis / 3}`,
    "--card-shine-alpha": `${0.12 + emphasis / 3}`,
    "--card-bloom-alpha": `${0.22 + emphasis / 3}`,
    "--card-wash-alpha": `${0.32 + emphasis / 1.5}`,
    "--card-panel-top": `${0.54 - Math.min(emphasis, 0.08) / 3}`,
    "--card-panel-bottom": `${0.82 - Math.min(emphasis, 0.08) / 3}`,
  }
}
