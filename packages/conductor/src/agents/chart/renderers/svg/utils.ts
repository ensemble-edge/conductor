/**
 * SVG Rendering Utilities
 *
 * Common functions for generating SVG elements.
 */

import type {
  ChartConfig,
  ChartTheme,
  ChartRenderContext,
  LegendPosition,
} from '../../types/index.js'
import { formatValue, calculateNiceTicks, truncateText } from '../../utils/format.js'

/**
 * Create the SVG container element
 */
export function createSvgContainer(config: ChartConfig, theme: ChartTheme): string {
  const { width = 600, height = 400, responsive = true } = config

  if (responsive) {
    return `<svg
      viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style="width: 100%; height: auto; max-width: ${width}px;"
    >`
  }

  return `<svg
    width="${width}"
    height="${height}"
    xmlns="http://www.w3.org/2000/svg"
  >`
}

/**
 * Create chart render context with computed dimensions
 */
export function createRenderContext(config: ChartConfig, theme: ChartTheme): ChartRenderContext {
  const width = config.width || 600
  const height = config.height || 400

  // Calculate margins based on content
  const hasTitle = !!config.title
  const hasSubtitle = !!config.subtitle
  const hasLegend = config.legend !== false && config.legend !== undefined
  const legendPosition = typeof config.legend === 'string' ? config.legend : 'top'

  const margin = {
    top: hasTitle ? (hasSubtitle ? 60 : 45) : 25,
    right: legendPosition === 'right' && hasLegend ? 120 : 25,
    bottom: legendPosition === 'bottom' && hasLegend ? 80 : 50,
    left: 60,
  }

  return {
    config,
    theme,
    width,
    height,
    margin,
    innerWidth: width - margin.left - margin.right,
    innerHeight: height - margin.top - margin.bottom,
  }
}

/**
 * Create CSS styles for the chart
 */
export function createStyles(theme: ChartTheme): string {
  return `
  <style>
    text { font-family: ${theme.fontFamily}; }
    .chart-title { font-size: 16px; font-weight: 600; fill: ${theme.text}; }
    .chart-subtitle { font-size: 12px; fill: ${theme.textSecondary}; }
    .axis-label { font-size: 11px; fill: ${theme.textSecondary}; }
    .axis-value { font-size: 10px; fill: ${theme.textSecondary}; }
    .axis-title { font-size: 12px; fill: ${theme.text}; font-weight: 500; }
    .value-label { font-size: 10px; fill: ${theme.text}; }
    .legend-text { font-size: 11px; fill: ${theme.text}; }
    .bar { transition: opacity 0.15s ease; }
    .bar:hover { opacity: 0.8; }
    .point { transition: r 0.15s ease; }
    .point:hover { r: 6; }
    .line { fill: none; }
    .area { opacity: 0.3; }
    .grid-line { stroke: ${theme.grid}; stroke-dasharray: 4,4; }
    .axis-line { stroke: ${theme.axis}; }
  </style>`
}

/**
 * Create title and subtitle elements
 */
export function createTitle(ctx: ChartRenderContext): string {
  const { config, width, theme } = ctx
  const { title, subtitle } = config

  if (!title) return ''

  const titleY = subtitle ? 22 : 28
  const subtitleY = 40

  return `
    <text x="${width / 2}" y="${titleY}" text-anchor="middle" class="chart-title">${escapeXml(title)}</text>
    ${subtitle ? `<text x="${width / 2}" y="${subtitleY}" text-anchor="middle" class="chart-subtitle">${escapeXml(subtitle)}</text>` : ''}
  `
}

/**
 * Create Y-axis with grid lines
 */
export function createYAxis(ctx: ChartRenderContext, minValue: number, maxValue: number): string {
  const { margin, innerWidth, innerHeight, config, theme } = ctx
  const { yAxis, showGrid = true } = config

  const ticks = calculateNiceTicks(minValue, maxValue, yAxis?.ticks || 5)
  const format = yAxis?.format
  const prefix = yAxis?.prefix || ''
  const suffix = yAxis?.suffix || ''

  const elements: string[] = []

  // Y-axis line
  elements.push(`
    <line
      x1="${margin.left}"
      y1="${margin.top}"
      x2="${margin.left}"
      y2="${margin.top + innerHeight}"
      class="axis-line"
    />
  `)

  // Ticks and grid lines
  for (const tick of ticks) {
    const yPos =
      margin.top + innerHeight - ((tick - minValue) / (maxValue - minValue || 1)) * innerHeight

    // Grid line
    if (showGrid) {
      elements.push(`
        <line
          x1="${margin.left}"
          y1="${yPos}"
          x2="${margin.left + innerWidth}"
          y2="${yPos}"
          class="grid-line"
        />
      `)
    }

    // Tick label
    const label = formatValue(tick, format, { prefix, suffix })
    elements.push(`
      <text
        x="${margin.left - 8}"
        y="${yPos + 4}"
        text-anchor="end"
        class="axis-value"
      >${escapeXml(label)}</text>
    `)
  }

  // Y-axis title
  if (yAxis?.label) {
    elements.push(`
      <text
        x="${15}"
        y="${margin.top + innerHeight / 2}"
        text-anchor="middle"
        class="axis-title"
        transform="rotate(-90, 15, ${margin.top + innerHeight / 2})"
      >${escapeXml(yAxis.label)}</text>
    `)
  }

  return elements.join('')
}

/**
 * Create X-axis with labels
 */
export function createXAxis(
  ctx: ChartRenderContext,
  labels: string[],
  positions: number[]
): string {
  const { margin, innerHeight, width, config } = ctx
  const { xAxis } = config

  const elements: string[] = []
  const y = margin.top + innerHeight

  // X-axis line
  elements.push(`
    <line
      x1="${margin.left}"
      y1="${y}"
      x2="${width - margin.right}"
      y2="${y}"
      class="axis-line"
    />
  `)

  // Labels
  const maxLabelWidth = positions[1] - positions[0] || 80
  const maxChars = Math.floor(maxLabelWidth / 7)

  for (let i = 0; i < labels.length; i++) {
    const label = truncateText(String(labels[i]), maxChars)
    elements.push(`
      <text
        x="${positions[i]}"
        y="${y + 20}"
        text-anchor="middle"
        class="axis-label"
      >${escapeXml(label)}</text>
    `)
  }

  // X-axis title
  if (xAxis?.label) {
    elements.push(`
      <text
        x="${margin.left + ctx.innerWidth / 2}"
        y="${ctx.height - 10}"
        text-anchor="middle"
        class="axis-title"
      >${escapeXml(xAxis.label)}</text>
    `)
  }

  return elements.join('')
}

/**
 * Create legend
 */
export function createLegend(
  ctx: ChartRenderContext,
  series: Array<{ name: string; color: string }>
): string {
  const { config, width, margin, height } = ctx
  const { legend } = config

  if (!legend || series.length <= 1) return ''

  const position: LegendPosition = typeof legend === 'string' ? legend : 'top'
  const elements: string[] = []

  const itemWidth = 100
  const itemHeight = 20
  const dotSize = 8

  switch (position) {
    case 'top': {
      const totalWidth = series.length * itemWidth
      const startX = (width - totalWidth) / 2
      const y = margin.top - 15

      series.forEach((s, i) => {
        const x = startX + i * itemWidth
        elements.push(`
          <circle cx="${x + dotSize / 2}" cy="${y}" r="${dotSize / 2}" fill="${s.color}" />
          <text x="${x + dotSize + 5}" y="${y + 4}" class="legend-text">${escapeXml(s.name)}</text>
        `)
      })
      break
    }

    case 'bottom': {
      const totalWidth = series.length * itemWidth
      const startX = (width - totalWidth) / 2
      const y = height - 20

      series.forEach((s, i) => {
        const x = startX + i * itemWidth
        elements.push(`
          <circle cx="${x + dotSize / 2}" cy="${y}" r="${dotSize / 2}" fill="${s.color}" />
          <text x="${x + dotSize + 5}" y="${y + 4}" class="legend-text">${escapeXml(s.name)}</text>
        `)
      })
      break
    }

    case 'right': {
      const x = width - margin.right + 20
      const startY = margin.top + 20

      series.forEach((s, i) => {
        const y = startY + i * itemHeight
        elements.push(`
          <circle cx="${x + dotSize / 2}" cy="${y}" r="${dotSize / 2}" fill="${s.color}" />
          <text x="${x + dotSize + 5}" y="${y + 4}" class="legend-text">${escapeXml(s.name)}</text>
        `)
      })
      break
    }

    case 'left': {
      const x = 10
      const startY = margin.top + 20

      series.forEach((s, i) => {
        const y = startY + i * itemHeight
        elements.push(`
          <circle cx="${x + dotSize / 2}" cy="${y}" r="${dotSize / 2}" fill="${s.color}" />
          <text x="${x + dotSize + 5}" y="${y + 4}" class="legend-text">${escapeXml(s.name)}</text>
        `)
      })
      break
    }
  }

  return elements.join('')
}

/**
 * Create reference line
 */
export function createReferenceLine(
  ctx: ChartRenderContext,
  value: number,
  minValue: number,
  maxValue: number,
  label?: string,
  color?: string,
  style?: 'solid' | 'dashed'
): string {
  const { margin, innerWidth, innerHeight, theme } = ctx

  const yPos =
    margin.top + innerHeight - ((value - minValue) / (maxValue - minValue || 1)) * innerHeight
  const lineColor = color || theme.colors[0]
  const dashArray = style === 'dashed' ? '6,4' : 'none'

  return `
    <line
      x1="${margin.left}"
      y1="${yPos}"
      x2="${margin.left + innerWidth}"
      y2="${yPos}"
      stroke="${lineColor}"
      stroke-width="2"
      stroke-dasharray="${dashArray}"
    />
    ${label ? `<text x="${margin.left + innerWidth + 5}" y="${yPos + 4}" class="axis-label" fill="${lineColor}">${escapeXml(label)}</text>` : ''}
  `
}

/**
 * Escape XML special characters
 */
export function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Generate SVG path for smooth curve (cubic bezier)
 */
export function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return ''

  const d: string[] = [`M ${points[0].x} ${points[0].y}`]

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    // Simple cubic bezier with control points at 1/3 and 2/3
    const cp1x = prev.x + (curr.x - prev.x) / 3
    const cp1y = prev.y
    const cp2x = prev.x + (2 * (curr.x - prev.x)) / 3
    const cp2y = curr.y

    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`)
  }

  return d.join(' ')
}

/**
 * Generate SVG path for straight lines
 */
export function linearPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return ''

  const d: string[] = [`M ${points[0].x} ${points[0].y}`]

  for (let i = 1; i < points.length; i++) {
    d.push(`L ${points[i].x} ${points[i].y}`)
  }

  return d.join(' ')
}

/**
 * Create X-axis for horizontal bar charts (value axis)
 */
export function createHorizontalXAxis(
  ctx: ChartRenderContext,
  minValue: number,
  maxValue: number
): string {
  const { margin, innerWidth, innerHeight, config, theme } = ctx
  const { xAxis, showGrid = true } = config

  const ticks = calculateNiceTicks(minValue, maxValue, xAxis?.ticks || 5)
  const format = xAxis?.format
  const prefix = xAxis?.prefix || ''
  const suffix = xAxis?.suffix || ''

  const elements: string[] = []
  const y = margin.top + innerHeight

  // X-axis line
  elements.push(`
    <line
      x1="${margin.left}"
      y1="${y}"
      x2="${margin.left + innerWidth}"
      y2="${y}"
      class="axis-line"
    />
  `)

  // Ticks and grid lines
  for (const tick of ticks) {
    const xPos = margin.left + ((tick - minValue) / (maxValue - minValue || 1)) * innerWidth

    // Grid line
    if (showGrid) {
      elements.push(`
        <line
          x1="${xPos}"
          y1="${margin.top}"
          x2="${xPos}"
          y2="${y}"
          class="grid-line"
        />
      `)
    }

    // Tick label
    const label = formatValue(tick, format, { prefix, suffix })
    elements.push(`
      <text
        x="${xPos}"
        y="${y + 20}"
        text-anchor="middle"
        class="axis-value"
      >${escapeXml(label)}</text>
    `)
  }

  // X-axis title
  if (xAxis?.label) {
    elements.push(`
      <text
        x="${margin.left + innerWidth / 2}"
        y="${ctx.height - 10}"
        text-anchor="middle"
        class="axis-title"
      >${escapeXml(xAxis.label)}</text>
    `)
  }

  return elements.join('')
}

/**
 * Create Y-axis for horizontal bar charts (category axis)
 */
export function createHorizontalYAxis(
  ctx: ChartRenderContext,
  labels: string[],
  positions: number[]
): string {
  const { margin, innerHeight, config } = ctx
  const { yAxis } = config

  const elements: string[] = []

  // Y-axis line
  elements.push(`
    <line
      x1="${margin.left}"
      y1="${margin.top}"
      x2="${margin.left}"
      y2="${margin.top + innerHeight}"
      class="axis-line"
    />
  `)

  // Labels
  const maxChars = Math.floor((margin.left - 10) / 7)

  for (let i = 0; i < labels.length; i++) {
    const label = truncateText(String(labels[i]), maxChars)
    elements.push(`
      <text
        x="${margin.left - 8}"
        y="${positions[i] + 4}"
        text-anchor="end"
        class="axis-label"
      >${escapeXml(label)}</text>
    `)
  }

  // Y-axis title
  if (yAxis?.label) {
    elements.push(`
      <text
        x="${15}"
        y="${margin.top + innerHeight / 2}"
        text-anchor="middle"
        class="axis-title"
        transform="rotate(-90, 15, ${margin.top + innerHeight / 2})"
      >${escapeXml(yAxis.label)}</text>
    `)
  }

  return elements.join('')
}

/**
 * Create horizontal reference line (for horizontal bar charts, rendered as vertical)
 */
export function createVerticalReferenceLine(
  ctx: ChartRenderContext,
  value: number,
  minValue: number,
  maxValue: number,
  label?: string,
  color?: string,
  style?: 'solid' | 'dashed'
): string {
  const { margin, innerWidth, innerHeight, theme } = ctx

  const xPos = margin.left + ((value - minValue) / (maxValue - minValue || 1)) * innerWidth
  const lineColor = color || theme.colors[0]
  const dashArray = style === 'dashed' ? '6,4' : 'none'

  return `
    <line
      x1="${xPos}"
      y1="${margin.top}"
      x2="${xPos}"
      y2="${margin.top + innerHeight}"
      stroke="${lineColor}"
      stroke-width="2"
      stroke-dasharray="${dashArray}"
    />
    ${label ? `<text x="${xPos}" y="${margin.top - 5}" text-anchor="middle" class="axis-label" fill="${lineColor}">${escapeXml(label)}</text>` : ''}
  `
}
