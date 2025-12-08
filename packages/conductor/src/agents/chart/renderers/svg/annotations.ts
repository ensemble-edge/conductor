/**
 * Annotations Renderer
 *
 * Renders chart annotations including lines, bands, points, and labels.
 */

import type { ChartRenderContext, AnnotationConfig } from '../../types/index.js'
import { escapeXml } from './utils.js'

/**
 * Render all annotations for a chart
 */
export function renderAnnotations(
  ctx: ChartRenderContext,
  annotations: AnnotationConfig[],
  minValue: number,
  maxValue: number,
  horizontal = false
): string {
  if (!annotations || annotations.length === 0) return ''

  return annotations
    .map((ann) => renderAnnotation(ctx, ann, minValue, maxValue, horizontal))
    .join('')
}

/**
 * Render a single annotation
 */
function renderAnnotation(
  ctx: ChartRenderContext,
  annotation: AnnotationConfig,
  minValue: number,
  maxValue: number,
  horizontal: boolean
): string {
  const { type, value, label, color = '#666666', style = 'solid' } = annotation

  switch (type) {
    case 'line':
      return renderLineAnnotation(ctx, value, label, color, style, minValue, maxValue, horizontal)
    case 'band':
      return renderBandAnnotation(ctx, value, label, color, minValue, maxValue, horizontal)
    case 'point':
      return renderPointAnnotation(ctx, value, label, color, minValue, maxValue, horizontal)
    case 'label':
      return renderLabelAnnotation(ctx, value, label, color, minValue, maxValue, horizontal)
    default:
      return ''
  }
}

/**
 * Render a line annotation (horizontal or vertical line)
 */
function renderLineAnnotation(
  ctx: ChartRenderContext,
  value: number | string | [number, number],
  label: string | undefined,
  color: string,
  style: 'solid' | 'dashed' | 'dotted',
  minValue: number,
  maxValue: number,
  horizontal: boolean
): string {
  const { margin, innerWidth, innerHeight } = ctx
  const numValue = typeof value === 'number' ? value : parseFloat(String(value))
  const dashArray = style === 'dashed' ? '6,4' : style === 'dotted' ? '2,2' : 'none'

  if (horizontal) {
    // For horizontal bar charts, annotation lines are vertical
    const xPos = margin.left + ((numValue - minValue) / (maxValue - minValue || 1)) * innerWidth
    return `
      <line
        x1="${xPos}"
        y1="${margin.top}"
        x2="${xPos}"
        y2="${margin.top + innerHeight}"
        stroke="${color}"
        stroke-width="2"
        stroke-dasharray="${dashArray}"
        class="annotation-line"
      />
      ${label ? `<text x="${xPos}" y="${margin.top - 5}" text-anchor="middle" class="axis-label" fill="${color}">${escapeXml(label)}</text>` : ''}
    `
  } else {
    // For vertical bar charts, annotation lines are horizontal
    const yPos =
      margin.top + innerHeight - ((numValue - minValue) / (maxValue - minValue || 1)) * innerHeight
    return `
      <line
        x1="${margin.left}"
        y1="${yPos}"
        x2="${margin.left + innerWidth}"
        y2="${yPos}"
        stroke="${color}"
        stroke-width="2"
        stroke-dasharray="${dashArray}"
        class="annotation-line"
      />
      ${label ? `<text x="${margin.left + innerWidth + 5}" y="${yPos + 4}" class="axis-label" fill="${color}">${escapeXml(label)}</text>` : ''}
    `
  }
}

/**
 * Render a band annotation (highlighted range)
 */
function renderBandAnnotation(
  ctx: ChartRenderContext,
  value: number | string | [number, number],
  label: string | undefined,
  color: string,
  minValue: number,
  maxValue: number,
  horizontal: boolean
): string {
  const { margin, innerWidth, innerHeight } = ctx

  // Band requires a range [start, end]
  if (!Array.isArray(value) || value.length !== 2) return ''

  const [start, end] = value
  const range = maxValue - minValue || 1

  if (horizontal) {
    const xStart = margin.left + ((start - minValue) / range) * innerWidth
    const xEnd = margin.left + ((end - minValue) / range) * innerWidth
    const width = xEnd - xStart

    return `
      <rect
        x="${xStart}"
        y="${margin.top}"
        width="${width}"
        height="${innerHeight}"
        fill="${color}"
        fill-opacity="0.15"
        class="annotation-band"
      />
      ${label ? `<text x="${xStart + width / 2}" y="${margin.top - 5}" text-anchor="middle" class="axis-label" fill="${color}">${escapeXml(label)}</text>` : ''}
    `
  } else {
    const yStart = margin.top + innerHeight - ((start - minValue) / range) * innerHeight
    const yEnd = margin.top + innerHeight - ((end - minValue) / range) * innerHeight
    const height = yStart - yEnd

    return `
      <rect
        x="${margin.left}"
        y="${yEnd}"
        width="${innerWidth}"
        height="${height}"
        fill="${color}"
        fill-opacity="0.15"
        class="annotation-band"
      />
      ${label ? `<text x="${margin.left + innerWidth + 5}" y="${yEnd + height / 2 + 4}" class="axis-label" fill="${color}">${escapeXml(label)}</text>` : ''}
    `
  }
}

/**
 * Render a point annotation (marker at specific location)
 */
function renderPointAnnotation(
  ctx: ChartRenderContext,
  value: number | string | [number, number],
  label: string | undefined,
  color: string,
  minValue: number,
  maxValue: number,
  horizontal: boolean
): string {
  const { margin, innerWidth, innerHeight } = ctx
  const range = maxValue - minValue || 1

  // Point can be a single value on the value axis or [x, y] coordinate
  let x: number, y: number

  if (Array.isArray(value)) {
    // [x-position (as index or %), y-value]
    x = margin.left + (value[0] / 100) * innerWidth
    y = margin.top + innerHeight - ((value[1] - minValue) / range) * innerHeight
  } else {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value))
    if (horizontal) {
      x = margin.left + ((numValue - minValue) / range) * innerWidth
      y = margin.top + innerHeight / 2
    } else {
      x = margin.left + innerWidth / 2
      y = margin.top + innerHeight - ((numValue - minValue) / range) * innerHeight
    }
  }

  return `
    <circle
      cx="${x}"
      cy="${y}"
      r="6"
      fill="${color}"
      stroke="${ctx.theme.background}"
      stroke-width="2"
      class="annotation-point"
    />
    ${label ? `<text x="${x}" y="${y - 12}" text-anchor="middle" class="axis-label" fill="${color}">${escapeXml(label)}</text>` : ''}
  `
}

/**
 * Render a label annotation (text at specific location)
 */
function renderLabelAnnotation(
  ctx: ChartRenderContext,
  value: number | string | [number, number],
  label: string | undefined,
  color: string,
  minValue: number,
  maxValue: number,
  horizontal: boolean
): string {
  if (!label) return ''

  const { margin, innerWidth, innerHeight } = ctx
  const range = maxValue - minValue || 1

  let x: number, y: number

  if (Array.isArray(value)) {
    // Position as [x%, y-value]
    x = margin.left + (value[0] / 100) * innerWidth
    y = margin.top + innerHeight - ((value[1] - minValue) / range) * innerHeight
  } else {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value))
    if (horizontal) {
      x = margin.left + ((numValue - minValue) / range) * innerWidth
      y = margin.top + 20
    } else {
      x = margin.left + innerWidth - 50
      y = margin.top + innerHeight - ((numValue - minValue) / range) * innerHeight
    }
  }

  return `
    <text
      x="${x}"
      y="${y}"
      text-anchor="middle"
      class="axis-label"
      fill="${color}"
      font-weight="500"
    >${escapeXml(label)}</text>
  `
}
