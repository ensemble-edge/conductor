/**
 * Scatter Plot Renderer
 *
 * Renders scatter plots with support for multiple series
 * and configurable point sizes.
 */

import type { ChartConfig, ChartTheme } from '../../types/index.js'
import { createLinearScale, extentWithPadding, groupBy } from '../../utils/scales.js'
import { formatValue } from '../../utils/format.js'
import { getColorFromPalette } from '../../utils/colors.js'
import {
  createSvgContainer,
  createRenderContext,
  createStyles,
  createTitle,
  createYAxis,
  createLegend,
  escapeXml,
} from './utils.js'
import { calculateNiceTicks } from '../../utils/format.js'

/**
 * Render a scatter plot
 */
export function renderScatterPlot(config: ChartConfig, theme: ChartTheme): string {
  const { data = [], x, y, series: seriesField } = config

  if (!x || !y || data.length === 0) {
    return renderEmptyChart(config, theme, 'No data available')
  }

  const ctx = createRenderContext(config, theme)
  const { margin, innerWidth, innerHeight } = ctx
  const colors = config.colors || theme.colors
  const yField = Array.isArray(y) ? y[0] : y

  // Extract all x and y values
  const xValues = data.map((d) => Number((d as Record<string, unknown>)[x]) || 0)
  const yValues = data.map((d) => Number((d as Record<string, unknown>)[yField]) || 0)

  // Calculate extents
  const [minX, maxX] = extentWithPadding(xValues, 0.1)
  const [minY, maxY] = extentWithPadding(yValues, 0.1)

  // Create scales
  const xScale = createLinearScale([minX, maxX], [0, innerWidth])
  const yScale = createLinearScale([minY, maxY], [innerHeight, 0])

  // Group data by series if specified
  let seriesGroups: Map<string, unknown[]>
  if (seriesField) {
    seriesGroups = groupBy(data, (d) => String((d as Record<string, unknown>)[seriesField]))
  } else {
    seriesGroups = new Map([['data', data]])
  }

  // Render points for each series
  const seriesNames = [...seriesGroups.keys()]
  const points = seriesNames.flatMap((seriesName, seriesIndex) => {
    const seriesData = seriesGroups.get(seriesName) || []
    const color = getColorFromPalette(colors, seriesIndex)

    return seriesData.map((d) => {
      const record = d as Record<string, unknown>
      const xVal = Number(record[x]) || 0
      const yVal = Number(record[yField]) || 0
      const px = margin.left + xScale(xVal)
      const py = margin.top + yScale(yVal)

      return `
        <circle
          cx="${px}"
          cy="${py}"
          r="5"
          fill="${color}"
          stroke="${theme.background}"
          stroke-width="1.5"
          class="point"
        >
          <title>${seriesField ? `${escapeXml(seriesName)}: ` : ''}${escapeXml(x)}=${formatValue(xVal)}, ${escapeXml(yField)}=${formatValue(yVal)}</title>
        </circle>
      `
    })
  })

  // Build series for legend
  const legendSeries = seriesNames.map((name, i) => ({
    name,
    color: getColorFromPalette(colors, i),
  }))

  // Create X-axis
  const xTicks = calculateNiceTicks(minX, maxX, config.xAxis?.ticks || 5)
  const xAxisElements = xTicks
    .map((tick) => {
      const xPos = margin.left + xScale(tick)
      return `
      <line
        x1="${xPos}"
        y1="${margin.top + innerHeight}"
        x2="${xPos}"
        y2="${margin.top + innerHeight + 5}"
        class="axis-line"
      />
      <text
        x="${xPos}"
        y="${margin.top + innerHeight + 18}"
        text-anchor="middle"
        class="axis-value"
      >${formatValue(tick, config.xAxis?.format)}</text>
    `
    })
    .join('')

  // X-axis line
  const xAxisLine = `
    <line
      x1="${margin.left}"
      y1="${margin.top + innerHeight}"
      x2="${margin.left + innerWidth}"
      y2="${margin.top + innerHeight}"
      class="axis-line"
    />
  `

  // X-axis label
  const xAxisLabel = config.xAxis?.label
    ? `
    <text
      x="${margin.left + innerWidth / 2}"
      y="${ctx.height - 10}"
      text-anchor="middle"
      class="axis-title"
    >${escapeXml(config.xAxis.label)}</text>
  `
    : ''

  return `${createSvgContainer(config, theme)}
    ${createStyles(theme)}
    ${createTitle(ctx)}
    ${createYAxis(ctx, minY, maxY)}
    ${xAxisLine}
    ${xAxisElements}
    ${xAxisLabel}
    <g class="points">${points.join('')}</g>
    ${seriesField ? createLegend(ctx, legendSeries) : ''}
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
