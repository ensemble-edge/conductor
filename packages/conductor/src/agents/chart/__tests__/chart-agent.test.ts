/**
 * Chart Agent Tests
 */

import { describe, it, expect } from 'vitest'
import { ChartAgent } from '../chart-agent.js'
import type { AgentConfig } from '../../../runtime/parser.js'
import { Operation } from '../../../types/operation.js'

// Helper to create test agent
function createChartAgent(config: Record<string, unknown>): ChartAgent {
  const agentConfig: AgentConfig = {
    name: 'test-chart',
    operation: Operation.chart,
    config,
  }
  return new ChartAgent(agentConfig)
}

// Mock execution context
function createContext(config: Record<string, unknown> = {}) {
  return {
    input: {},
    env: {} as any,
    state: {} as any,
    config,
    executionId: 'test-exec-id',
  }
}

describe('ChartAgent', () => {
  describe('Validation', () => {
    it('should return error when data is empty', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [],
        x: 'month',
        y: 'value',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(false)
      expect(result.error).toContain('config.data must be a non-empty array')
    })

    it('should return error when type is missing and auto is false', async () => {
      const agent = createChartAgent({
        data: [{ month: 'Jan', value: 100 }],
        x: 'month',
        y: 'value',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(false)
      expect(result.error).toContain('config.type is required')
    })

    it('should return error for invalid chart type', async () => {
      const agent = createChartAgent({
        type: 'invalid',
        data: [{ month: 'Jan', value: 100 }],
        x: 'month',
        y: 'value',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(false)
      expect(result.error).toContain('invalid type "invalid"')
    })

    it('should return error when bar chart missing x or y', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [{ month: 'Jan', value: 100 }],
        x: 'month',
        // y is missing
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(false)
      expect(result.error).toContain('bar chart requires config.x and config.y')
    })

    it('should return error when pie chart missing labels or values', async () => {
      const agent = createChartAgent({
        type: 'pie',
        data: [{ category: 'A', amount: 100 }],
        // labels and values missing
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(false)
      expect(result.error).toContain('pie chart requires config.labels and config.values')
    })
  })

  describe('Bar Chart', () => {
    it('should render bar chart as SVG', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { month: 'Jan', revenue: 10000 },
          { month: 'Feb', revenue: 15000 },
          { month: 'Mar', revenue: 12000 },
        ],
        x: 'month',
        y: 'revenue',
        title: 'Monthly Revenue',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(typeof result.data).toBe('string')
      expect(result.data).toContain('<svg')
      expect(result.data).toContain('Monthly Revenue')
      expect(result.data).toContain('</svg>')
    })

    it('should render multi-series bar chart', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { month: 'Jan', sales: 100, costs: 50 },
          { month: 'Feb', sales: 150, costs: 60 },
        ],
        x: 'month',
        y: ['sales', 'costs'],
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
      // Should have multiple bars per category
      expect((result.data as string).match(/<rect/g)?.length).toBeGreaterThan(2)
    })

    it('should render stacked bar chart', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { quarter: 'Q1', north: 100, south: 80 },
          { quarter: 'Q2', north: 120, south: 90 },
        ],
        x: 'quarter',
        y: ['north', 'south'],
        stacked: true,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
    })
  })

  describe('Line Chart', () => {
    it('should render line chart as SVG', async () => {
      const agent = createChartAgent({
        type: 'line',
        data: [
          { date: '2024-01', users: 1000 },
          { date: '2024-02', users: 1500 },
          { date: '2024-03', users: 1200 },
        ],
        x: 'date',
        y: 'users',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
      expect(result.data).toContain('<path')
      expect(result.data).toContain('class="line"')
    })

    it('should render smooth line chart', async () => {
      const agent = createChartAgent({
        type: 'line',
        data: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
          { x: 3, y: 15 },
        ],
        x: 'x',
        y: 'y',
        smooth: true,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
      // Smooth paths use C (cubic bezier) commands
      expect(result.data).toContain('C ')
    })
  })

  describe('Area Chart', () => {
    it('should render area chart as SVG', async () => {
      const agent = createChartAgent({
        type: 'area',
        data: [
          { date: '2024-01', value: 100 },
          { date: '2024-02', value: 150 },
          { date: '2024-03', value: 120 },
        ],
        x: 'date',
        y: 'value',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
      expect(result.data).toContain('class="area"')
      expect(result.data).toContain('linearGradient')
    })
  })

  describe('Pie Chart', () => {
    it('should render pie chart as SVG', async () => {
      const agent = createChartAgent({
        type: 'pie',
        data: [
          { category: 'A', amount: 30 },
          { category: 'B', amount: 50 },
          { category: 'C', amount: 20 },
        ],
        labels: 'category',
        values: 'amount',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
      // Pie charts use path elements with arc commands
      expect(result.data).toContain('<path')
      expect(result.data).toContain('A ') // Arc command
    })

    it('should render donut chart with inner radius', async () => {
      const agent = createChartAgent({
        type: 'donut',
        data: [
          { category: 'A', amount: 30 },
          { category: 'B', amount: 70 },
        ],
        labels: 'category',
        values: 'amount',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
    })
  })

  describe('Scatter Plot', () => {
    it('should render scatter plot as SVG', async () => {
      const agent = createChartAgent({
        type: 'scatter',
        data: [
          { price: 100, rating: 4.5 },
          { price: 200, rating: 4.0 },
          { price: 150, rating: 4.8 },
        ],
        x: 'price',
        y: 'rating',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
      expect(result.data).toContain('class="point"')
    })
  })

  describe('Sparkline', () => {
    it('should render sparkline from number array', async () => {
      const agent = createChartAgent({
        type: 'sparkline',
        data: [10, 15, 12, 18, 14, 22, 19],
        width: 100,
        height: 30,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
      expect(result.data).toContain('viewBox="0 0 100 30"')
    })

    it('should render sparkline from object array', async () => {
      const agent = createChartAgent({
        type: 'sparkline',
        data: [{ value: 10 }, { value: 20 }, { value: 15 }],
        y: 'value',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
    })
  })

  describe('Auto Detection', () => {
    it('should auto-detect pie chart for small categorical data', async () => {
      const agent = createChartAgent({
        auto: true,
        data: [
          { category: 'A', value: 30 },
          { category: 'B', value: 40 },
          { category: 'C', value: 30 },
        ],
        labels: 'category',
        values: 'value',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
    })
  })

  describe('Output Formats', () => {
    it('should generate QuickChart URL', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { month: 'Jan', value: 100 },
          { month: 'Feb', value: 200 },
        ],
        x: 'month',
        y: 'value',
        output: 'url',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(typeof result.data).toBe('string')
      expect(result.data).toContain('quickchart.io')
    })

    it('should generate Vega-Lite spec', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { month: 'Jan', value: 100 },
          { month: 'Feb', value: 200 },
        ],
        x: 'month',
        y: 'value',
        output: 'vega',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(typeof result.data).toBe('object')
      expect((result.data as any).$schema).toContain('vega-lite')
    })

    it('should generate HTML output', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [{ month: 'Jan', value: 100 }],
        x: 'month',
        y: 'value',
        output: 'html',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<!DOCTYPE html>')
      expect(result.data).toContain('<svg')
    })
  })

  describe('Theming', () => {
    it('should apply dark theme', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [{ x: 'A', y: 100 }],
        x: 'x',
        y: 'y',
        theme: 'dark',
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      // Dark theme uses different colors than light theme
      // Check for dark theme text color (#f9fafb) which differs from light theme (#111827)
      expect(result.data).toContain('#f9fafb')
    })

    it('should apply custom colors', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [{ x: 'A', y: 100 }],
        x: 'x',
        y: 'y',
        colors: ['#FF0000'],
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('#FF0000')
    })
  })

  describe('Reference Lines', () => {
    it('should render reference line', async () => {
      const agent = createChartAgent({
        type: 'line',
        data: [
          { x: 'Jan', y: 100 },
          { x: 'Feb', y: 150 },
          { x: 'Mar', y: 120 },
        ],
        x: 'x',
        y: 'y',
        referenceLine: {
          value: 130,
          label: 'Target',
          style: 'dashed',
        },
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('Target')
      expect(result.data).toContain('stroke-dasharray')
    })
  })

  describe('Horizontal Bar Charts', () => {
    it('should render horizontal bar chart', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { name: 'Product A', sales: 100 },
          { name: 'Product B', sales: 150 },
          { name: 'Product C', sales: 80 },
        ],
        x: 'name',
        y: 'sales',
        horizontal: true,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
      expect(result.data).toContain('<rect')
    })

    it('should render horizontal stacked bar chart', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { region: 'North', q1: 100, q2: 120 },
          { region: 'South', q1: 80, q2: 90 },
        ],
        x: 'region',
        y: ['q1', 'q2'],
        horizontal: true,
        stacked: true,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('<svg')
    })

    it('should render horizontal bar chart with reference line', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { name: 'A', value: 100 },
          { name: 'B', value: 200 },
        ],
        x: 'name',
        y: 'value',
        horizontal: true,
        referenceLine: {
          value: 150,
          label: 'Target',
          style: 'dashed',
        },
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('Target')
      expect(result.data).toContain('stroke-dasharray')
    })
  })

  describe('showValues', () => {
    it('should render value labels on bar chart', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { x: 'A', y: 100 },
          { x: 'B', y: 200 },
        ],
        x: 'x',
        y: 'y',
        showValues: true,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('class="value-label"')
    })

    it('should render value labels on horizontal bar chart', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { name: 'A', value: 100 },
          { name: 'B', value: 200 },
        ],
        x: 'name',
        y: 'value',
        horizontal: true,
        showValues: true,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('class="value-label"')
    })

    it('should render value labels on line chart', async () => {
      const agent = createChartAgent({
        type: 'line',
        data: [
          { x: 'Jan', y: 100 },
          { x: 'Feb', y: 150 },
        ],
        x: 'x',
        y: 'y',
        showValues: true,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('class="value-label"')
    })

    it('should render labels on pie chart by default', async () => {
      const agent = createChartAgent({
        type: 'pie',
        data: [
          { category: 'A', value: 60 },
          { category: 'B', value: 40 },
        ],
        labels: 'category',
        values: 'value',
        showValues: true,
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      // Pie charts show percentage labels
      expect(result.data).toContain('%')
    })
  })

  describe('Annotations', () => {
    it('should render line annotation on bar chart', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { x: 'A', y: 100 },
          { x: 'B', y: 200 },
          { x: 'C', y: 150 },
        ],
        x: 'x',
        y: 'y',
        annotations: [
          {
            type: 'line',
            value: 150,
            label: 'Threshold',
            color: '#FF0000',
            style: 'dashed',
          },
        ],
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('Threshold')
      expect(result.data).toContain('#FF0000')
    })

    it('should render band annotation', async () => {
      const agent = createChartAgent({
        type: 'line',
        data: [
          { x: 'Jan', y: 100 },
          { x: 'Feb', y: 150 },
          { x: 'Mar', y: 120 },
        ],
        x: 'x',
        y: 'y',
        annotations: [
          {
            type: 'band',
            value: [100, 130],
            label: 'Target Range',
            color: '#00FF00',
          },
        ],
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('Target Range')
      expect(result.data).toContain('annotation-band')
    })

    it('should render point annotation', async () => {
      const agent = createChartAgent({
        type: 'line',
        data: [
          { x: 'Jan', y: 100 },
          { x: 'Feb', y: 150 },
        ],
        x: 'x',
        y: 'y',
        annotations: [
          {
            type: 'point',
            value: 125,
            label: 'Peak',
            color: '#0000FF',
          },
        ],
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('Peak')
      expect(result.data).toContain('annotation-point')
    })

    it('should render annotations on horizontal bar chart', async () => {
      const agent = createChartAgent({
        type: 'bar',
        data: [
          { name: 'A', value: 100 },
          { name: 'B', value: 200 },
        ],
        x: 'name',
        y: 'value',
        horizontal: true,
        annotations: [
          {
            type: 'line',
            value: 150,
            label: 'Target',
            style: 'dashed',
          },
        ],
      })

      const result = await agent.execute(createContext())
      expect(result.success).toBe(true)
      expect(result.data).toContain('Target')
    })
  })
})
