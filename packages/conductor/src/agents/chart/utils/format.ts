/**
 * Chart Formatting Utilities
 *
 * Number and date formatting for chart labels and axes.
 */

import type { NumberFormat } from '../types/index.js'

export interface FormatOptions {
  currency?: string
  locale?: string
  decimals?: number
  prefix?: string
  suffix?: string
}

/**
 * Format a numeric value based on format type
 */
export function formatValue(
  value: number,
  format?: NumberFormat | string,
  options?: FormatOptions
): string {
  const { prefix = '', suffix = '' } = options || {}

  if (value === null || value === undefined || isNaN(value)) {
    return ''
  }

  let formatted: string

  switch (format) {
    case 'number':
      formatted = value.toLocaleString(options?.locale || 'en-US')
      break

    case 'currency':
      formatted = new Intl.NumberFormat(options?.locale || 'en-US', {
        style: 'currency',
        currency: options?.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
      // Return early since currency format includes its own prefix
      return formatted
      break

    case 'percent':
      // Assume value is already a decimal (0.125 = 12.5%)
      formatted = `${(value * 100).toFixed(1)}%`
      break

    case 'compact':
      formatted = formatCompact(value)
      break

    default:
      // Default to plain number with locale formatting
      formatted =
        typeof options?.decimals === 'number' ? value.toFixed(options.decimals) : value.toString()
  }

  return `${prefix}${formatted}${suffix}`
}

/**
 * Format number in compact notation (1.5K, 2.3M, etc.)
 */
export function formatCompact(value: number): string {
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(1)}B`
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1)}M`
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(1)}K`
  }
  return `${sign}${absValue.toFixed(absValue % 1 === 0 ? 0 : 1)}`
}

/**
 * Format a date value for axis labels
 */
export function formatDate(value: string | Date, format?: string): string {
  const date = value instanceof Date ? value : new Date(value)

  if (isNaN(date.getTime())) {
    return String(value)
  }

  // Simple format patterns
  switch (format) {
    case 'MMM':
      return date.toLocaleDateString('en-US', { month: 'short' })
    case 'MMM YYYY':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    case 'MM/DD':
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
    case 'YYYY':
      return date.getFullYear().toString()
    case 'DD':
      return date.getDate().toString()
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

/**
 * Calculate nice tick values for an axis
 */
export function calculateNiceTicks(min: number, max: number, targetCount: number = 5): number[] {
  const range = max - min
  if (range === 0) return [min]

  // Calculate a nice step size
  const roughStep = range / (targetCount - 1)
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const residual = roughStep / magnitude

  let niceStep: number
  if (residual <= 1.5) niceStep = magnitude
  else if (residual <= 3) niceStep = 2 * magnitude
  else if (residual <= 7) niceStep = 5 * magnitude
  else niceStep = 10 * magnitude

  // Calculate nice min and max
  const niceMin = Math.floor(min / niceStep) * niceStep
  const niceMax = Math.ceil(max / niceStep) * niceStep

  // Generate ticks
  const ticks: number[] = []
  for (let tick = niceMin; tick <= niceMax; tick += niceStep) {
    ticks.push(tick)
  }

  return ticks
}

/**
 * Truncate text with ellipsis if too long
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '…'
}
