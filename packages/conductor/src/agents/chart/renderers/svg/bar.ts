/**
 * Bar Chart Renderer
 *
 * Renders vertical and horizontal bar charts with support for
 * grouped, stacked, and single series data.
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
  createHorizontalXAxis,
  createHorizontalYAxis,
  createLegend,
  createReferenceLine,
  createVerticalReferenceLine,
  escapeXml,
} from './utils.js'
import { average, median } from '../../utils/scales.js'
import { renderAnnotations } from './annotations.js'

/**
 * Render a bar chart
 */
export function renderBarChart(config: ChartConfig, theme: ChartTheme): string {
  const { data = [], x, y, horizontal = false, stacked = false, showValues = false } = config

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
    // For stacked, we need sum of all series per category
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
  const categoryScale = createBandScale(categories, [0, horizontal ? innerHeight : innerWidth])
  const valueScale = createLinearScale(
    [adjustedMin, maxValue],
    horizontal ? [0, innerWidth] : [innerHeight, 0]
  )

  // Build bars
  const bars = renderBars(
    data,
    x,
    yFields,
    categoryScale,
    valueScale,
    colors,
    ctx,
    horizontal,
    stacked,
    showValues
  )

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

    if (horizontal) {
      // For horizontal charts, reference line is vertical
      refLine = createVerticalReferenceLine(
        ctx,
        refValue,
        adjustedMin,
        maxValue,
        refConfig.label,
        refConfig.color,
        refConfig.style
      )
    } else {
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
  }

  // Generate axis elements
  let axisElements: string
  if (horizontal) {
    // For horizontal bars: Y-axis shows categories, X-axis shows values
    const categoryPositions = categories.map(
      (cat) => margin.top + categoryScale(cat) + categoryScale.bandwidth() / 2
    )
    axisElements = `
      ${createHorizontalYAxis(ctx, categories, categoryPositions)}
      ${createHorizontalXAxis(ctx, adjustedMin, maxValue)}
    `
  } else {
    // For vertical bars: X-axis shows categories, Y-axis shows values
    const categoryPositions = categories.map(
      (cat) => margin.left + categoryScale(cat) + categoryScale.bandwidth() / 2
    )
    axisElements = `
      ${createYAxis(ctx, adjustedMin, maxValue)}
      ${createXAxis(ctx, categories, categoryPositions)}
    `
  }

  // Build annotations if specified
  const annotationsEl = config.annotations
    ? renderAnnotations(ctx, config.annotations, adjustedMin, maxValue, horizontal)
    : ''

  return `${createSvgContainer(config, theme)}
    ${createStyles(theme)}
    ${createTitle(ctx)}
    ${axisElements}
    ${annotationsEl}
    <g class="bars">${bars}</g>
    ${refLine}
    ${createLegend(ctx, series)}
  </svg>`
}

/**
 * Render bar elements
 */
function renderBars(
  data: unknown[],
  x: string,
  yFields: string[],
  categoryScale: ReturnType<typeof createBandScale>,
  valueScale: ReturnType<typeof createLinearScale>,
  colors: string[],
  ctx: ReturnType<typeof createRenderContext>,
  horizontal: boolean,
  stacked: boolean,
  showValues: boolean
): string {
  const { margin, innerHeight, config } = ctx
  const bandwidth = categoryScale.bandwidth()
  const barWidth = stacked ? bandwidth : bandwidth / yFields.length
  const format = config.yAxis?.format
  const prefix = config.yAxis?.prefix || ''
  const suffix = config.yAxis?.suffix || ''

  const elements: string[] = []

  data.forEach((d, i) => {
    const record = d as Record<string, unknown>
    const category = String(record[x])
    const categoryPos = categoryScale(category)

    if (stacked) {
      // Stacked bars
      let cumulative = 0

      yFields.forEach((field, j) => {
        const value = Number(record[field]) || 0
        const color = getColorFromPalette(colors, j)

        if (horizontal) {
          const barLength = valueScale(value) - valueScale(0)
          elements.push(`
            <rect
              x="${margin.left + cumulative}"
              y="${margin.top + categoryPos}"
              width="${barLength}"
              height="${bandwidth}"
              fill="${color}"
              rx="2"
              class="bar"
            >
              <title>${escapeXml(field)}: ${formatValue(value, format, { prefix, suffix })}</title>
            </rect>
          `)
          cumulative += barLength
        } else {
          const barHeight = valueScale(0) - valueScale(value)
          const yPos = margin.top + valueScale(0) - cumulative - barHeight
          elements.push(`
            <rect
              x="${margin.left + categoryPos}"
              y="${yPos}"
              width="${bandwidth}"
              height="${barHeight}"
              fill="${color}"
              rx="2"
              class="bar"
            >
              <title>${escapeXml(field)}: ${formatValue(value, format, { prefix, suffix })}</title>
            </rect>
          `)
          cumulative += barHeight
        }
      })
    } else {
      // Grouped bars
      yFields.forEach((field, j) => {
        const value = Number(record[field]) || 0
        const color = getColorFromPalette(colors, j)

        if (horizontal) {
          const barLength = valueScale(value) - valueScale(0)
          const yPos = margin.top + categoryPos + j * barWidth
          elements.push(`
            <rect
              x="${margin.left + valueScale(0)}"
              y="${yPos}"
              width="${barLength}"
              height="${barWidth - 2}"
              fill="${color}"
              rx="2"
              class="bar"
            >
              <title>${escapeXml(field)}: ${formatValue(value, format, { prefix, suffix })}</title>
            </rect>
          `)

          if (showValues) {
            elements.push(`
              <text
                x="${margin.left + valueScale(0) + barLength + 5}"
                y="${yPos + barWidth / 2 + 4}"
                class="value-label"
              >${formatValue(value, format, { prefix, suffix })}</text>
            `)
          }
        } else {
          const barHeight = Math.abs(valueScale(value) - valueScale(0))
          const xPos = margin.left + categoryPos + j * barWidth
          const yPos = value >= 0 ? valueScale(value) : valueScale(0)
          elements.push(`
            <rect
              x="${xPos}"
              y="${margin.top + yPos}"
              width="${barWidth - 2}"
              height="${barHeight}"
              fill="${color}"
              rx="2"
              class="bar"
            >
              <title>${escapeXml(field)}: ${formatValue(value, format, { prefix, suffix })}</title>
            </rect>
          `)

          if (showValues) {
            elements.push(`
              <text
                x="${xPos + barWidth / 2}"
                y="${margin.top + yPos - 5}"
                text-anchor="middle"
                class="value-label"
              >${formatValue(value, 'compact')}</text>
            `)
          }
        }
      })
    }
  })

  return elements.join('')
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
