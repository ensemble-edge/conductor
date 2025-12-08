/**
 * Chart Agent
 *
 * Data visualization agent for generating charts as SVG, image URLs, or interactive specs.
 * All rendering is Workers-compatible with no DOM or Canvas dependencies.
 *
 * Supported chart types:
 * - bar: Vertical/horizontal bar charts, grouped or stacked
 * - line: Line charts with multi-series support
 * - area: Area charts with gradient fills
 * - pie/donut: Pie and donut charts
 * - scatter: Scatter plots
 * - sparkline: Minimal inline charts
 *
 * Output formats:
 * - svg: Server-rendered SVG string (default)
 * - url: QuickChart.io image URL
 * - vega: Vega-Lite spec for client-side rendering
 * - html: Self-contained HTML with embedded SVG
 */

import { BaseAgent, type AgentExecutionContext } from '../base-agent.js'
import type { AgentConfig } from '../../runtime/parser.js'
import type { ChartConfig, ChartTheme, ChartType, ChartOutput } from './types/index.js'
import { getTheme } from './themes/index.js'
import {
  renderBarChart,
  renderLineChart,
  renderAreaChart,
  renderPieChart,
  renderScatterPlot,
  renderSparkline,
} from './renderers/svg/index.js'
import { generateQuickChartUrl } from './renderers/quickchart.js'
import { buildVegaLiteSpec } from './renderers/vega.js'

export class ChartAgent extends BaseAgent {
  private chartConfig: ChartConfig

  constructor(config: AgentConfig) {
    super(config)
    this.chartConfig = (config.config as ChartConfig) || {}
  }

  /**
   * Execute chart generation
   */
  protected async run(context: AgentExecutionContext): Promise<ChartOutput> {
    // Merge static config with runtime config
    const config: ChartConfig = {
      ...this.chartConfig,
      ...(context.config as Partial<ChartConfig>),
    }

    // Validate configuration
    this.validate(config)

    // Resolve theme
    const theme = this.resolveTheme(config)

    // Auto-detect chart type if requested
    const chartType = config.auto ? this.detectChartType(config) : config.type!

    // Route to appropriate output generator
    const output = config.output || 'svg'

    switch (output) {
      case 'svg':
        return this.renderSvg({ ...config, type: chartType }, theme)

      case 'url':
        return generateQuickChartUrl({ ...config, type: chartType })

      case 'vega':
        return buildVegaLiteSpec({ ...config, type: chartType }, theme)

      case 'html':
        return this.renderHtml({ ...config, type: chartType }, theme)

      case 'echarts':
        // ECharts support could be added in the future
        throw new Error('chart: echarts output not yet implemented')

      default:
        throw new Error(`chart: unsupported output format "${output}"`)
    }
  }

  /**
   * Render chart as SVG
   */
  private renderSvg(config: ChartConfig, theme: ChartTheme): string {
    switch (config.type) {
      case 'bar':
        return renderBarChart(config, theme)

      case 'line':
        return renderLineChart(config, theme)

      case 'area':
        return renderAreaChart(config, theme)

      case 'pie':
      case 'donut':
        return renderPieChart(config, theme)

      case 'scatter':
        return renderScatterPlot(config, theme)

      case 'sparkline':
        return renderSparkline(config, theme)

      default:
        throw new Error(`chart: unsupported chart type "${config.type}"`)
    }
  }

  /**
   * Render chart as self-contained HTML
   */
  private renderHtml(config: ChartConfig, theme: ChartTheme): string {
    const svg = this.renderSvg(config, theme)
    const { title, width = 600, height = 400 } = config

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${title ? `<title>${this.escapeHtml(title)}</title>` : ''}
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: ${theme.fontFamily};
      background: ${theme.background};
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 40px);
    }
    .chart-container {
      max-width: ${width}px;
      width: 100%;
    }
    svg {
      width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="chart-container">
    ${svg}
  </div>
</body>
</html>`
  }

  /**
   * Resolve theme from config
   */
  private resolveTheme(config: ChartConfig): ChartTheme {
    const baseTheme = getTheme(config.theme)

    // Allow color override
    if (config.colors) {
      return { ...baseTheme, colors: config.colors }
    }

    return baseTheme
  }

  /**
   * Auto-detect best chart type from data
   */
  private detectChartType(config: ChartConfig): ChartType {
    const { data = [] } = config

    if (data.length === 0) return 'bar'

    const sample = data[0] as Record<string, unknown>
    const fields = Object.keys(sample)

    // Single numeric array (or data with only numbers) → sparkline
    if (fields.length === 1 && typeof sample[fields[0]] === 'number') {
      return 'sparkline'
    }

    // Array of plain numbers → sparkline
    if (typeof sample === 'number') {
      return 'sparkline'
    }

    // Category + single value with few items → pie
    if (fields.length === 2 && data.length <= 6) {
      const hasString = fields.some((f) => typeof sample[f] === 'string')
      const hasNumber = fields.some((f) => typeof sample[f] === 'number')
      if (hasString && hasNumber) {
        return 'pie'
      }
    }

    // Has date-like field + numeric → line
    if (this.hasDateField(sample) && this.hasNumericField(sample)) {
      return 'line'
    }

    // Multiple numeric fields without category → scatter
    const numericFields = fields.filter((f) => typeof sample[f] === 'number')
    if (numericFields.length >= 2 && !this.hasStringField(sample)) {
      return 'scatter'
    }

    // Default to bar
    return 'bar'
  }

  /**
   * Check if sample has a date-like field
   */
  private hasDateField(sample: Record<string, unknown>): boolean {
    const datePatterns = ['date', 'time', 'created', 'updated', 'timestamp']
    return Object.keys(sample).some(
      (field) =>
        datePatterns.some((p) => field.toLowerCase().includes(p)) ||
        (typeof sample[field] === 'string' && !isNaN(Date.parse(sample[field] as string)))
    )
  }

  /**
   * Check if sample has a numeric field
   */
  private hasNumericField(sample: Record<string, unknown>): boolean {
    return Object.values(sample).some((v) => typeof v === 'number')
  }

  /**
   * Check if sample has a string field
   */
  private hasStringField(sample: Record<string, unknown>): boolean {
    return Object.values(sample).some((v) => typeof v === 'string')
  }

  /**
   * Validate chart configuration
   */
  private validate(config: ChartConfig): void {
    const { type, data, auto } = config

    // Data is required
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('chart: config.data must be a non-empty array')
    }

    // Type is required unless auto is enabled
    if (!type && !auto) {
      throw new Error('chart: config.type is required (or set config.auto: true)')
    }

    // Validate type if specified
    const validTypes: ChartType[] = ['bar', 'line', 'area', 'pie', 'donut', 'scatter', 'sparkline']
    if (type && !validTypes.includes(type)) {
      throw new Error(`chart: invalid type "${type}". Must be one of: ${validTypes.join(', ')}`)
    }

    // Validate required fields for cartesian charts
    if (type && ['bar', 'line', 'area', 'scatter'].includes(type)) {
      if (!config.x || !config.y) {
        throw new Error(`chart: ${type} chart requires config.x and config.y`)
      }
    }

    // Validate required fields for pie/donut
    if (type && ['pie', 'donut'].includes(type)) {
      if (!config.labels || !config.values) {
        throw new Error(`chart: ${type} chart requires config.labels and config.values`)
      }
    }
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}
