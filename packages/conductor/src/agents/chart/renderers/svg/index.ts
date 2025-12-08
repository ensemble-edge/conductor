/**
 * SVG Chart Renderers
 *
 * Exports all SVG chart rendering functions.
 */

export { renderBarChart } from './bar.js'
export { renderLineChart } from './line.js'
export { renderAreaChart } from './area.js'
export { renderPieChart } from './pie.js'
export { renderScatterPlot } from './scatter.js'
export { renderSparkline } from './sparkline.js'

export {
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
