/**
 * QuickChart URL Generator
 *
 * Generates chart image URLs using the QuickChart.io service.
 * Useful for embedding charts in emails, PDFs, and Slack messages.
 */

import type { ChartConfig } from '../types/index.js'

/**
 * Default color palette for QuickChart (rgba format)
 */
const defaultColors = [
  'rgba(99, 102, 241, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(20, 184, 166, 0.8)',
  'rgba(249, 115, 22, 0.8)',
]

/**
 * Generate a QuickChart.io URL for the chart
 */
export function generateQuickChartUrl(config: ChartConfig): string {
  const { width = 600, height = 400 } = config

  const chartConfig = buildChartJsConfig(config)
  const encoded = encodeURIComponent(JSON.stringify(chartConfig))

  return `https://quickchart.io/chart?c=${encoded}&w=${width}&h=${height}&bkg=white`
}

/**
 * Build Chart.js configuration object
 */
function buildChartJsConfig(config: ChartConfig): object {
  const { type, data = [], x, y, labels, values, title, colors, stacked, horizontal } = config

  // Map our types to Chart.js types
  const chartJsType = mapChartType(type, horizontal)

  const palette = colors?.map(toRgba) || defaultColors

  // Handle pie/donut charts
  if (type === 'pie' || type === 'donut') {
    return {
      type: chartJsType,
      data: {
        labels: data.map((d) => (d as Record<string, unknown>)[labels!]),
        datasets: [
          {
            data: data.map((d) => (d as Record<string, unknown>)[values!]),
            backgroundColor: palette,
          },
        ],
      },
      options: {
        title: title ? { display: true, text: title } : undefined,
        plugins: {
          legend: { position: 'right' },
        },
      },
    }
  }

  // Handle cartesian charts (bar, line, area)
  const yFields = Array.isArray(y) ? y : [y!]

  return {
    type: chartJsType,
    data: {
      labels: data.map((d) => (d as Record<string, unknown>)[x!]),
      datasets: yFields.map((field, i) => ({
        label: field,
        data: data.map((d) => (d as Record<string, unknown>)[field]),
        backgroundColor: palette[i % palette.length],
        borderColor: palette[i % palette.length],
        fill: type === 'area',
        tension: config.smooth ? 0.4 : 0,
      })),
    },
    options: {
      title: title ? { display: true, text: title } : undefined,
      scales: {
        x: horizontal
          ? { stacked }
          : {
              title: config.xAxis?.label ? { display: true, text: config.xAxis.label } : undefined,
            },
        y: horizontal
          ? {
              title: config.yAxis?.label ? { display: true, text: config.yAxis.label } : undefined,
            }
          : {
              stacked,
              beginAtZero: true,
              title: config.yAxis?.label ? { display: true, text: config.yAxis.label } : undefined,
            },
      },
      plugins: {
        legend: yFields.length > 1 ? { display: true } : { display: false },
      },
      indexAxis: horizontal ? 'y' : 'x',
    },
  }
}

/**
 * Map our chart types to Chart.js types
 */
function mapChartType(type?: string, horizontal?: boolean): string {
  switch (type) {
    case 'bar':
      return 'bar'
    case 'line':
      return 'line'
    case 'area':
      return 'line'
    case 'pie':
      return 'pie'
    case 'donut':
      return 'doughnut'
    case 'scatter':
      return 'scatter'
    case 'sparkline':
      return 'line'
    default:
      return 'bar'
  }
}

/**
 * Convert hex color to rgba format
 */
function toRgba(color: string, opacity: number = 0.8): string {
  if (color.startsWith('rgba')) return color
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`)
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return color
}
