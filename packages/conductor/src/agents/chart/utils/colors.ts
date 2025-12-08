/**
 * Chart Color Utilities
 *
 * Color manipulation and palette generation.
 */

/**
 * Adjust color opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Handle rgb colors
  if (color.startsWith('rgb(')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
    }
  }

  // Handle rgba colors - replace opacity
  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/)
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
    }
  }

  return color
}

/**
 * Lighten a color
 */
export function lighten(color: string, amount: number = 0.2): string {
  const rgb = parseColor(color)
  if (!rgb) return color

  const [r, g, b] = rgb
  const newR = Math.min(255, Math.round(r + (255 - r) * amount))
  const newG = Math.min(255, Math.round(g + (255 - g) * amount))
  const newB = Math.min(255, Math.round(b + (255 - b) * amount))

  return `rgb(${newR}, ${newG}, ${newB})`
}

/**
 * Darken a color
 */
export function darken(color: string, amount: number = 0.2): string {
  const rgb = parseColor(color)
  if (!rgb) return color

  const [r, g, b] = rgb
  const newR = Math.max(0, Math.round(r * (1 - amount)))
  const newG = Math.max(0, Math.round(g * (1 - amount)))
  const newB = Math.max(0, Math.round(b * (1 - amount)))

  return `rgb(${newR}, ${newG}, ${newB})`
}

/**
 * Parse color string to RGB values
 */
function parseColor(color: string): [number, number, number] | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return [r, g, b]
  }

  // Handle rgb/rgba colors
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
  }

  return null
}

/**
 * Get color from palette by index, cycling if needed
 */
export function getColorFromPalette(palette: string[], index: number): string {
  return palette[index % palette.length]
}

/**
 * Generate gradient stops for area fills
 */
export function createGradientStops(color: string, id: string): string {
  return `
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${withOpacity(color, 0.3)}" />
      <stop offset="100%" stop-color="${withOpacity(color, 0.05)}" />
    </linearGradient>
  `
}

/**
 * Default categorical color palette
 */
export const categoricalPalette = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
]

/**
 * Sequential color palette (for heatmaps, etc.)
 */
export const sequentialPalette = [
  '#eef2ff',
  '#e0e7ff',
  '#c7d2fe',
  '#a5b4fc',
  '#818cf8',
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#3730a3',
]
