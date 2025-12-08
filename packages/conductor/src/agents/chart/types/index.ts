/**
 * Chart Agent Types
 *
 * Configuration and output types for data visualization.
 * Supports bar, line, area, pie, donut, scatter, and sparkline charts.
 */

/**
 * Supported chart types
 */
export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'sparkline'

/**
 * Supported output formats
 */
export type ChartOutputFormat = 'svg' | 'vega' | 'echarts' | 'url' | 'html'

/**
 * Chart theme names
 */
export type ChartThemeName = 'light' | 'dark' | 'minimal' | 'brand'

/**
 * Chart theme definition
 */
export interface ChartTheme {
  background: string
  text: string
  textSecondary: string
  grid: string
  axis: string
  colors: string[]
  fontFamily: string
}

/**
 * Number format types
 */
export type NumberFormat = 'number' | 'currency' | 'percent' | 'compact'

/**
 * Axis configuration
 */
export interface AxisConfig {
  /** Axis label */
  label?: string
  /** Number format for values */
  format?: NumberFormat | string
  /** Prefix for values (e.g., "$") */
  prefix?: string
  /** Suffix for values (e.g., "%") */
  suffix?: string
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Show grid lines */
  grid?: boolean
  /** Number of ticks */
  ticks?: number
}

/**
 * Annotation types
 */
export type AnnotationType = 'line' | 'band' | 'point' | 'label'

/**
 * Annotation configuration
 */
export interface AnnotationConfig {
  type: AnnotationType
  value: number | string | [number, number]
  label?: string
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Reference line configuration
 */
export interface ReferenceLineConfig {
  value: number | 'average' | 'median'
  label?: string
  color?: string
  style?: 'solid' | 'dashed'
}

/**
 * Legend position
 */
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right'

/**
 * Chart agent configuration
 */
export interface ChartConfig {
  // === CHART TYPE ===
  /** Chart type */
  type?: ChartType
  /** Auto-detect best chart type from data */
  auto?: boolean

  // === DATA ===
  /** Input data array */
  data?: unknown[]
  /** X-axis field name */
  x?: string
  /** Y-axis field name(s) - single or multiple for multi-series */
  y?: string | string[]
  /** For pie/donut: label field */
  labels?: string
  /** For pie/donut: value field */
  values?: string
  /** Field to group by for multi-series */
  series?: string

  // === OUTPUT FORMAT ===
  /** Output format */
  output?: ChartOutputFormat

  // === DIMENSIONS ===
  /** Chart width in pixels (default: 600) */
  width?: number
  /** Chart height in pixels (default: 400) */
  height?: number
  /** Use viewBox for responsive scaling (default: true) */
  responsive?: boolean

  // === STYLING ===
  /** Chart title */
  title?: string
  /** Chart subtitle */
  subtitle?: string
  /** Theme name or custom theme */
  theme?: ChartThemeName | string
  /** Custom color palette */
  colors?: string[]

  // === AXES ===
  /** X-axis configuration */
  xAxis?: AxisConfig
  /** Y-axis configuration */
  yAxis?: AxisConfig

  // === FEATURES ===
  /** Show legend (true/false or position) */
  legend?: boolean | LegendPosition
  /** Show tooltips (for vega/echarts output) */
  tooltip?: boolean
  /** Enable animations (for client-side outputs) */
  animate?: boolean
  /** Stack multi-series bar/area charts */
  stacked?: boolean
  /** Render horizontal bar charts */
  horizontal?: boolean
  /** Smooth lines for line/area charts */
  smooth?: boolean
  /** Show values on bars/points */
  showValues?: boolean
  /** Show background grid (default: true) */
  showGrid?: boolean

  // === ANNOTATIONS ===
  /** Chart annotations */
  annotations?: AnnotationConfig[]
  /** Reference line */
  referenceLine?: ReferenceLineConfig
}

/**
 * Processed data point for rendering
 */
export interface DataPoint {
  x: number | string
  y: number
  label?: string
  color?: string
  series?: string
}

/**
 * Processed series data
 */
export interface SeriesData {
  name: string
  color: string
  points: DataPoint[]
}

/**
 * Chart rendering context
 */
export interface ChartRenderContext {
  config: ChartConfig
  theme: ChartTheme
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
  innerWidth: number
  innerHeight: number
}

/**
 * Chart output types
 */
export type ChartOutput = string | object
