/**
 * Sparkline Chart Renderer
 *
 * Renders minimal line charts without axes for KPI displays.
 */

import type { ChartConfig, ChartTheme } from '../../types/index.js'
import { createLinearScale, extent } from '../../utils/scales.js'
import { linearPath, smoothPath } from './utils.js'

/**
 * Render a sparkline chart
 */
export function renderSparkline(config: ChartConfig, theme: ChartTheme): string {
  const { data = [], y, width = 120, height = 40, smooth = true, colors } = config

  // Extract values
  let values: number[]

  if (Array.isArray(data) && data.length > 0) {
    if (typeof data[0] === 'number') {
      // Array of numbers
      values = data as number[]
    } else if (y && typeof data[0] === 'object') {
      // Array of objects with y field
      values = data.map((d) => (d as Record<string, unknown>)[y as string] as number)
    } else {
      values = []
    }
  } else {
    values = []
  }

  if (values.length === 0) {
    return createEmptySparkline(width, height, theme)
  }

  // Calculate scales
  const [minY, maxY] = extent(values)
  const padding = (maxY - minY) * 0.1 || 1
  const yScale = createLinearScale([minY - padding, maxY + padding], [height - 4, 4])

  const xStep = (width - 8) / (values.length - 1 || 1)

  // Generate points
  const points = values.map((v, i) => ({
    x: 4 + i * xStep,
    y: yScale(v),
  }))

  // Generate path
  const pathD = smooth ? smoothPath(points) : linearPath(points)
  const color = colors?.[0] || theme.colors[0]

  // Create gradient for area fill
  const gradientId = `sparkline-gradient-${Math.random().toString(36).slice(2, 9)}`

  return `<svg
    viewBox="0 0 ${width} ${height}"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    style="width: 100%; height: ${height}px; max-width: ${width}px;"
  >
    <defs>
      <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.3" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0.05" />
      </linearGradient>
    </defs>

    <!-- Area fill -->
    <path
      d="${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z"
      fill="url(#${gradientId})"
    />

    <!-- Line -->
    <path
      d="${pathD}"
      fill="none"
      stroke="${color}"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- End point -->
    <circle
      cx="${points[points.length - 1].x}"
      cy="${points[points.length - 1].y}"
      r="3"
      fill="${color}"
    />
  </svg>`
}

/**
 * Create empty sparkline placeholder
 */
function createEmptySparkline(width: number, height: number, theme: ChartTheme): string {
  return `<svg
    viewBox="0 0 ${width} ${height}"
    xmlns="http://www.w3.org/2000/svg"
    style="width: 100%; height: ${height}px; max-width: ${width}px;"
  >
    <line
      x1="4" y1="${height / 2}"
      x2="${width - 4}" y2="${height / 2}"
      stroke="${theme.grid}"
      stroke-width="1"
      stroke-dasharray="4,4"
    />
  </svg>`
}
