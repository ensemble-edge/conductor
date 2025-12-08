/**
 * Chart Scale Utilities
 *
 * Functions for scaling data values to chart coordinates.
 */

/**
 * Linear scale - maps values from data domain to pixel range
 */
export interface LinearScale {
  (value: number): number
  domain: [number, number]
  range: [number, number]
  invert: (pixel: number) => number
}

/**
 * Create a linear scale
 */
export function createLinearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const domainSpan = d1 - d0 || 1
  const rangeSpan = r1 - r0

  const scale = (value: number): number => {
    return r0 + ((value - d0) / domainSpan) * rangeSpan
  }

  scale.domain = domain
  scale.range = range
  scale.invert = (pixel: number): number => {
    return d0 + ((pixel - r0) / rangeSpan) * domainSpan
  }

  return scale as LinearScale
}

/**
 * Band scale - maps categorical values to pixel ranges (for bar charts)
 */
export interface BandScale {
  (value: string | number): number
  bandwidth: () => number
  domain: (string | number)[]
  range: [number, number]
}

/**
 * Create a band scale for categorical data
 */
export function createBandScale(
  domain: (string | number)[],
  range: [number, number],
  padding: number = 0.2
): BandScale {
  const [r0, r1] = range
  const rangeSpan = r1 - r0
  const n = domain.length || 1

  // Calculate step and bandwidth with padding
  const step = rangeSpan / n
  const bandwidth = step * (1 - padding)
  const paddingOffset = (step * padding) / 2

  const domainMap = new Map(domain.map((d, i) => [String(d), i]))

  const scale = (value: string | number): number => {
    const index = domainMap.get(String(value)) ?? 0
    return r0 + index * step + paddingOffset
  }

  scale.bandwidth = () => bandwidth
  scale.domain = domain
  scale.range = range

  return scale as BandScale
}

/**
 * Calculate data extent (min, max) from an array of values
 */
export function extent(values: number[]): [number, number] {
  if (values.length === 0) return [0, 0]

  let min = Infinity
  let max = -Infinity

  for (const v of values) {
    if (v < min) min = v
    if (v > max) max = v
  }

  return [min, max]
}

/**
 * Calculate data extent with optional padding
 */
export function extentWithPadding(values: number[], padding: number = 0.1): [number, number] {
  const [min, max] = extent(values)
  const range = max - min || Math.abs(min) || 1
  const pad = range * padding

  // For positive-only data, start at 0
  const adjustedMin = min >= 0 ? 0 : min - pad
  const adjustedMax = max + pad

  return [adjustedMin, adjustedMax]
}

/**
 * Get unique values from an array
 */
export function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

/**
 * Group data by a field
 */
export function groupBy<T>(data: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const item of data) {
    const key = keyFn(item)
    const group = groups.get(key) || []
    group.push(item)
    groups.set(key, group)
  }

  return groups
}

/**
 * Calculate sum of values
 */
export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}

/**
 * Calculate average of values
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0
  return sum(values) / values.length
}

/**
 * Calculate median of values
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}
