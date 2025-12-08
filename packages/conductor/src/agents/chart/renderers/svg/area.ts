/**
 * Area Chart Renderer
 *
 * Renders area charts with support for multiple series,
 * smooth curves, stacking, and gradient fills.
 */

import type { ChartConfig, ChartTheme } from '../../types/index.js'
import { createBandScale, createLinearScale, extentWithPadding } from '../../utils/scales.js'
import { formatValue } from '../../utils/format.js'
import { getColorFromPalette, withOpacity } from '../../utils/colors.js'
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

/**
 * Render an area chart
 */
export function renderAreaChart(config: ChartConfig, theme: ChartTheme): string {
  const { data = [], x, y, smooth = true, stacked = false } = config

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

  // Calculate value extent
  let allValues: number[]
  if (stacked) {
    allValues = data.map((d) => {
      const record = d as Record<string, unknown>
      return yFields.reduce((sum, field) => sum + (Number(record[field]) || 0), 0)
    })
  } else {
    allValues = data.flatMap((d) => {
      const record = d as Record<string, unknown>
      return yFields.map((field) => Number(record[field]) || 0)
    })
  }

  const [minValue, maxValue] = extentWithPadding(allValues, 0.1)
  const adjustedMin = Math.min(0, minValue)

  // Create scales
  const xScale = createBandScale(categories, [0, innerWidth])
  const yScale = createLinearScale([adjustedMin, maxValue], [innerHeight, 0])

  // Generate gradient definitions
  const gradients = yFields
    .map((field, i) => {
      const color = getColorFromPalette(colors, i)
      const id = `area-gradient-${i}`
      return `
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.4" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0.05" />
      </linearGradient>
    `
    })
    .join('')

  // Build areas for each series
  const baseline = margin.top + yScale(0)
  let cumulativeValues: number[] = new Array(data.length).fill(0)

  const areas = yFields.map((field, seriesIndex) => {
    const color = getColorFromPalette(colors, seriesIndex)

    // Generate points
    const points = data.map((d, i) => {
      const record = d as Record<string, unknown>
      const value = Number(record[field]) || 0
      const yValue = stacked ? cumulativeValues[i] + value : value

      return {
        x: margin.left + xScale(categories[i]) + xScale.bandwidth() / 2,
        y: margin.top + yScale(yValue),
        baseY: stacked ? margin.top + yScale(cumulativeValues[i]) : baseline,
        value,
        label: categories[i],
      }
    })

    // Update cumulative for stacking
    if (stacked) {
      data.forEach((d, i) => {
        const record = d as Record<string, unknown>
        cumulativeValues[i] += Number(record[field]) || 0
      })
    }

    // Generate paths
    const topPath = smooth ? smoothPath(points) : linearPath(points)

    // Close the area path
    const bottomPoints = [...points].reverse().map((p) => ({ x: p.x, y: p.baseY }))
    const bottomPath = stacked
      ? smooth
        ? smoothPath(bottomPoints)
        : linearPath(bottomPoints)
      : `L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline}`

    const areaPath = `${topPath} ${stacked ? bottomPath : bottomPath} Z`

    return `
      <g class="series" data-series="${escapeXml(field)}">
        <!-- Area fill -->
        <path
          d="${areaPath}"
          fill="url(#area-gradient-${seriesIndex})"
          class="area"
        />

        <!-- Line -->
        <path
          d="${topPath}"
          fill="none"
          stroke="${color}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="line"
        />

        <!-- Data points -->
        ${points
          .map(
            (p) => `
          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="3"
            fill="${color}"
            stroke="${theme.background}"
            stroke-width="2"
            class="point"
          >
            <title>${escapeXml(field)}: ${formatValue(p.value, config.yAxis?.format)}</title>
          </circle>
        `
          )
          .join('')}
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
      adjustedMin,
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

  return `${createSvgContainer(config, theme)}
    <defs>${gradients}</defs>
    ${createStyles(theme)}
    ${createTitle(ctx)}
    ${createYAxis(ctx, adjustedMin, maxValue)}
    ${createXAxis(ctx, categories, categoryPositions)}
    ${refLine}
    <g class="areas">${areas.join('')}</g>
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
