/**
 * Vega-Lite Spec Builder
 *
 * Generates Vega-Lite specifications for interactive client-side charts.
 * The spec can be rendered using vega-embed on the client.
 */

import type { ChartConfig, ChartTheme } from '../types/index.js'

/**
 * Build a Vega-Lite specification from chart config
 */
export function buildVegaLiteSpec(config: ChartConfig, theme: ChartTheme): object {
  const {
    type,
    data = [],
    x,
    y,
    labels,
    values,
    title,
    subtitle,
    width = 600,
    height = 400,
  } = config

  const baseSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: width - 100,
    height: height - 100,
    title: title
      ? {
          text: title,
          subtitle: subtitle,
          anchor: 'start',
          font: theme.fontFamily,
          color: theme.text,
        }
      : undefined,
    data: { values: data },
    config: {
      background: theme.background,
      font: theme.fontFamily,
      axis: {
        labelColor: theme.textSecondary,
        titleColor: theme.text,
        gridColor: theme.grid,
        domainColor: theme.axis,
      },
      legend: {
        labelColor: theme.text,
        titleColor: theme.text,
      },
    },
  }

  switch (type) {
    case 'bar':
      return buildBarSpec(baseSpec, config, theme)
    case 'line':
      return buildLineSpec(baseSpec, config, theme)
    case 'area':
      return buildAreaSpec(baseSpec, config, theme)
    case 'pie':
    case 'donut':
      return buildPieSpec(baseSpec, config, theme)
    case 'scatter':
      return buildScatterSpec(baseSpec, config, theme)
    case 'sparkline':
      return buildSparklineSpec(baseSpec, config, theme)
    default:
      return buildBarSpec(baseSpec, config, theme)
  }
}

/**
 * Build bar chart spec
 */
function buildBarSpec(baseSpec: object, config: ChartConfig, theme: ChartTheme): object {
  const { x, y, horizontal, stacked } = config
  const yFields = Array.isArray(y) ? y : [y!]

  if (yFields.length > 1) {
    // Multi-series: use layer or fold transform
    return {
      ...baseSpec,
      transform: [
        {
          fold: yFields,
          as: ['series', 'value'],
        },
      ],
      mark: { type: 'bar', tooltip: true },
      encoding: {
        x: horizontal
          ? { field: 'value', type: 'quantitative', stack: stacked ? 'zero' : null }
          : { field: x, type: 'nominal' },
        y: horizontal
          ? { field: x, type: 'nominal' }
          : { field: 'value', type: 'quantitative', stack: stacked ? 'zero' : null },
        color: {
          field: 'series',
          type: 'nominal',
          scale: { range: theme.colors },
        },
        xOffset: !stacked && !horizontal ? { field: 'series' } : undefined,
      },
    }
  }

  // Single series
  return {
    ...baseSpec,
    mark: { type: 'bar', tooltip: true, color: theme.colors[0] },
    encoding: {
      x: horizontal ? { field: yFields[0], type: 'quantitative' } : { field: x, type: 'nominal' },
      y: horizontal ? { field: x, type: 'nominal' } : { field: yFields[0], type: 'quantitative' },
    },
  }
}

/**
 * Build line chart spec
 */
function buildLineSpec(baseSpec: object, config: ChartConfig, theme: ChartTheme): object {
  const { x, y, smooth } = config
  const yFields = Array.isArray(y) ? y : [y!]

  if (yFields.length > 1) {
    return {
      ...baseSpec,
      transform: [{ fold: yFields, as: ['series', 'value'] }],
      mark: {
        type: 'line',
        tooltip: true,
        point: true,
        interpolate: smooth ? 'monotone' : 'linear',
      },
      encoding: {
        x: { field: x, type: 'temporal' },
        y: { field: 'value', type: 'quantitative' },
        color: {
          field: 'series',
          type: 'nominal',
          scale: { range: theme.colors },
        },
      },
    }
  }

  return {
    ...baseSpec,
    mark: {
      type: 'line',
      tooltip: true,
      point: true,
      color: theme.colors[0],
      interpolate: smooth ? 'monotone' : 'linear',
    },
    encoding: {
      x: { field: x, type: 'temporal' },
      y: { field: yFields[0], type: 'quantitative' },
    },
  }
}

/**
 * Build area chart spec
 */
function buildAreaSpec(baseSpec: object, config: ChartConfig, theme: ChartTheme): object {
  const { x, y, stacked, smooth } = config
  const yFields = Array.isArray(y) ? y : [y!]

  if (yFields.length > 1) {
    return {
      ...baseSpec,
      transform: [{ fold: yFields, as: ['series', 'value'] }],
      mark: {
        type: 'area',
        tooltip: true,
        opacity: 0.7,
        interpolate: smooth ? 'monotone' : 'linear',
      },
      encoding: {
        x: { field: x, type: 'temporal' },
        y: { field: 'value', type: 'quantitative', stack: stacked ? 'zero' : null },
        color: {
          field: 'series',
          type: 'nominal',
          scale: { range: theme.colors },
        },
      },
    }
  }

  return {
    ...baseSpec,
    mark: {
      type: 'area',
      tooltip: true,
      color: theme.colors[0],
      opacity: 0.7,
      interpolate: smooth ? 'monotone' : 'linear',
    },
    encoding: {
      x: { field: x, type: 'temporal' },
      y: { field: yFields[0], type: 'quantitative' },
    },
  }
}

/**
 * Build pie/donut chart spec
 */
function buildPieSpec(baseSpec: object, config: ChartConfig, theme: ChartTheme): object {
  const { labels, values, type } = config

  return {
    ...baseSpec,
    mark: {
      type: 'arc',
      tooltip: true,
      innerRadius: type === 'donut' ? 60 : 0,
    },
    encoding: {
      theta: { field: values, type: 'quantitative' },
      color: {
        field: labels,
        type: 'nominal',
        scale: { range: theme.colors },
      },
    },
  }
}

/**
 * Build scatter plot spec
 */
function buildScatterSpec(baseSpec: object, config: ChartConfig, theme: ChartTheme): object {
  const { x, y, series: seriesField } = config
  const yField = Array.isArray(y) ? y[0] : y!

  return {
    ...baseSpec,
    mark: { type: 'point', tooltip: true, filled: true, size: 60 },
    encoding: {
      x: { field: x, type: 'quantitative' },
      y: { field: yField, type: 'quantitative' },
      color: seriesField
        ? {
            field: seriesField,
            type: 'nominal',
            scale: { range: theme.colors },
          }
        : { value: theme.colors[0] },
    },
  }
}

/**
 * Build sparkline spec (minimal line chart)
 */
function buildSparklineSpec(baseSpec: object, config: ChartConfig, theme: ChartTheme): object {
  const { y } = config
  const yField = Array.isArray(y) ? y[0] : y!

  return {
    ...baseSpec,
    width: config.width || 120,
    height: config.height || 40,
    mark: {
      type: 'line',
      color: theme.colors[0],
      strokeWidth: 2,
    },
    encoding: {
      x: { field: 'index', type: 'quantitative', axis: null },
      y: { field: yField, type: 'quantitative', axis: null },
    },
    config: {
      ...((baseSpec as { config: object }).config || {}),
      view: { stroke: null },
    },
  }
}
