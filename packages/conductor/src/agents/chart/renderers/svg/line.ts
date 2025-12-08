/**
 * Line Chart Renderer
 *
 * Renders line charts with support for multiple series,
 * smooth curves, and data points.
 */

import type { ChartConfig, ChartTheme } from '../../types/index.js'
import { createBandScale, createLinearScale, extentWithPadding } from '../../utils/scales.js'
import { formatValue } from '../../utils/format.js'
import { getColorFromPalette } from '../../utils/colors.js'
import {
  createSvgContainer,
  createRenderContext,
  createStyles,
  createTitle,
  createYAxis,
  createXAxis,
  createLegend,
  createReferenceLine,
  escapeXml,
  smoothPath,
  linearPath,
} from './utils.js'
import { average, median } from '../../utils/scales.js'
import { renderAnnotations } from './annotations.js'

/**
 * Render a line chart
 */
export function renderLineChart(config: ChartConfig, theme: ChartTheme): string {
  const { data = [], x, y, smooth = false, showValues = false } = config

  if (!x || !y || data.length === 0) {
    return renderEmptyChart(config, theme, 'No data available')
  }

  const ctx = createRenderContext(config, theme)
  const { margin, innerWidth, innerHeight } = ctx

  // Get y fields (single or multi-series)
  const yFields = Array.isArray(y) ? y : [y]
  const colors = config.colors || theme.colors

  // Extract data
  const categories = data.map((d) => String((d as Record<string, unknown>)[x]))

  // Calculate value extent across all series
  const allValues = data.flatMap((d) => {
    const record = d as Record<string, unknown>
    return yFields.map((field) => Number(record[field]) || 0)
  })

  const [minValue, maxValue] = extentWithPadding(allValues, 0.1)

  // Create scales
  const xScale = createBandScale(categories, [0, innerWidth])
  const yScale = createLinearScale([minValue, maxValue], [innerHeight, 0])

  // Build lines for each series
  const lines = yFields.map((field, seriesIndex) => {
    const color = getColorFromPalette(colors, seriesIndex)

    // Generate points
    const points = data.map((d, i) => {
      const record = d as Record<string, unknown>
      const value = Number(record[field]) || 0
      return {
        x: margin.left + xScale(categories[i]) + xScale.bandwidth() / 2,
        y: margin.top + yScale(value),
        value,
        label: categories[i],
      }
    })

    // Generate path
    const pathD = smooth ? smoothPath(points) : linearPath(points)

    // Line element
    const lineEl = `
      <path
        d="${pathD}"
        fill="none"
        stroke="${color}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="line"
      />
    `

    // Data points
    const pointsEl = points
      .map(
        (p, i) => `
      <circle
        cx="${p.x}"
        cy="${p.y}"
        r="4"
        fill="${color}"
        stroke="${theme.background}"
        stroke-width="2"
        class="point"
      >
        <title>${escapeXml(field)}: ${formatValue(p.value, config.yAxis?.format)}</title>
      </circle>
      ${showValues ? `<text x="${p.x}" y="${p.y - 10}" text-anchor="middle" class="value-label">${formatValue(p.value, 'compact')}</text>` : ''}
    `
      )
      .join('')

    return `
      <g class="series" data-series="${escapeXml(field)}">
        ${lineEl}
        ${pointsEl}
      </g>
    `
  })

  // Build series for legend
  const series = yFields.map((field, i) => ({
    name: field,
    color: getColorFromPalette(colors, i),
  }))

  // Build reference line if specified
  let refLine = ''
  if (config.referenceLine) {
    let refValue: number
    const refConfig = config.referenceLine

    if (refConfig.value === 'average') {
      refValue = average(allValues)
    } else if (refConfig.value === 'median') {
      refValue = median(allValues)
    } else {
      refValue = refConfig.value
    }

    refLine = createReferenceLine(
      ctx,
      refValue,
      minValue,
      maxValue,
      refConfig.label,
      refConfig.color,
      refConfig.style
    )
  }

  // Generate axis elements
  const categoryPositions = categories.map(
    (cat) => margin.left + xScale(cat) + xScale.bandwidth() / 2
  )

  // Build annotations if specified
  const annotationsEl = config.annotations
    ? renderAnnotations(ctx, config.annotations, minValue, maxValue, false)
    : ''

  return `${createSvgContainer(config, theme)}
    ${createStyles(theme)}
    ${createTitle(ctx)}
    ${createYAxis(ctx, minValue, maxValue)}
    ${createXAxis(ctx, categories, categoryPositions)}
    ${annotationsEl}
    ${refLine}
    <g class="lines">${lines.join('')}</g>
    ${createLegend(ctx, series)}
  </svg>`
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
