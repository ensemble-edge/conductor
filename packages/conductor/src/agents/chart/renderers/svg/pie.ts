/**
 * Pie/Donut Chart Renderer
 *
 * Renders pie and donut charts with labels and optional center text.
 */

import type { ChartConfig, ChartTheme } from '../../types/index.js'
import { formatValue } from '../../utils/format.js'
import { getColorFromPalette } from '../../utils/colors.js'
import {
  createSvgContainer,
  createRenderContext,
  createStyles,
  createTitle,
  createLegend,
  escapeXml,
} from './utils.js'

/**
 * Render a pie or donut chart
 */
export function renderPieChart(config: ChartConfig, theme: ChartTheme): string {
  const { data = [], labels, values, type = 'pie', showValues = true } = config

  if (!labels || !values || data.length === 0) {
    return renderEmptyChart(config, theme, 'No data available')
  }

  const ctx = createRenderContext(config, theme)
  const { width, height, margin } = ctx
  const colors = config.colors || theme.colors

  // Calculate center and radius
  const centerX = width / 2
  const centerY = margin.top + (height - margin.top - margin.bottom) / 2
  const outerRadius =
    Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2 - 20
  const innerRadius = type === 'donut' ? outerRadius * 0.6 : 0

  // Extract and calculate data
  const items = data.map((d, i) => {
    const record = d as Record<string, unknown>
    return {
      label: String(record[labels]),
      value: Number(record[values]) || 0,
      color: getColorFromPalette(colors, i),
    }
  })

  const total = items.reduce((sum, item) => sum + item.value, 0)

  // Generate slices
  let currentAngle = -Math.PI / 2 // Start at top

  const slices = items.map((item, i) => {
    const sliceAngle = total > 0 ? (item.value / total) * Math.PI * 2 : 0
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle = endAngle

    // Calculate arc path
    const path = describeArc(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle)

    // Calculate label position
    const midAngle = startAngle + sliceAngle / 2
    const labelRadius = outerRadius + 20
    const labelX = centerX + Math.cos(midAngle) * labelRadius
    const labelY = centerY + Math.sin(midAngle) * labelRadius
    const textAnchor = midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2 ? 'end' : 'start'

    // Calculate percentage
    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'

    return `
      <g class="slice">
        <path
          d="${path}"
          fill="${item.color}"
          stroke="${theme.background}"
          stroke-width="2"
          class="bar"
        >
          <title>${escapeXml(item.label)}: ${formatValue(item.value, config.yAxis?.format)} (${percentage}%)</title>
        </path>
        ${
          showValues && sliceAngle > 0.2
            ? `
          <text
            x="${labelX}"
            y="${labelY}"
            text-anchor="${textAnchor}"
            class="axis-label"
          >${escapeXml(item.label)}</text>
          <text
            x="${labelX}"
            y="${labelY + 14}"
            text-anchor="${textAnchor}"
            class="value-label"
          >${percentage}%</text>
        `
            : ''
        }
      </g>
    `
  })

  // Build series for legend
  const series = items.map((item) => ({
    name: item.label,
    color: item.color,
  }))

  // Center text for donut
  let centerText = ''
  if (type === 'donut' && config.title) {
    centerText = `
      <text
        x="${centerX}"
        y="${centerY - 5}"
        text-anchor="middle"
        class="axis-label"
      >Total</text>
      <text
        x="${centerX}"
        y="${centerY + 18}"
        text-anchor="middle"
        class="chart-title"
        font-size="20"
      >${formatValue(total, config.yAxis?.format || 'compact')}</text>
    `
  }

  return `${createSvgContainer(config, theme)}
    ${createStyles(theme)}
    ${type !== 'donut' || !config.title ? createTitle(ctx) : ''}
    <g class="slices">${slices.join('')}</g>
    ${centerText}
    ${createLegend(ctx, series)}
  </svg>`
}

/**
 * Generate SVG arc path
 */
function describeArc(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

  // Outer arc points
  const outerStartX = cx + Math.cos(startAngle) * outerRadius
  const outerStartY = cy + Math.sin(startAngle) * outerRadius
  const outerEndX = cx + Math.cos(endAngle) * outerRadius
  const outerEndY = cy + Math.sin(endAngle) * outerRadius

  if (innerRadius === 0) {
    // Pie slice (wedge)
    return [
      `M ${cx} ${cy}`,
      `L ${outerStartX} ${outerStartY}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
      'Z',
    ].join(' ')
  }

  // Donut slice (annular sector)
  const innerStartX = cx + Math.cos(startAngle) * innerRadius
  const innerStartY = cy + Math.sin(startAngle) * innerRadius
  const innerEndX = cx + Math.cos(endAngle) * innerRadius
  const innerEndY = cy + Math.sin(endAngle) * innerRadius

  return [
    `M ${outerStartX} ${outerStartY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerEndX} ${innerEndY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
    'Z',
  ].join(' ')
}

/**
 * Render empty chart with message
 */
function renderEmptyChart(config: ChartConfig, theme: ChartTheme, message: string): string {
  const { width = 600, height = 400 } = config

  return `<svg
    viewBox="0 0 ${width} ${height}"
    xmlns="http://www.w3.org/2000/svg"
    style="width: 100%; height: auto; max-width: ${width}px;"
  >
    <rect width="100%" height="100%" fill="${theme.background}"/>
    <text
      x="${width / 2}"
      y="${height / 2}"
      text-anchor="middle"
      fill="${theme.textSecondary}"
      font-family="${theme.fontFamily}"
      font-size="14"
    >${escapeXml(message)}</text>
  </svg>`
}
