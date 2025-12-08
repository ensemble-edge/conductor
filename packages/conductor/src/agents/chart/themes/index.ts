/**
 * Chart Themes
 *
 * Built-in themes for chart styling.
 */

import type { ChartTheme, ChartThemeName } from '../types/index.js'

/**
 * Light theme - clean, professional look
 */
export const lightTheme: ChartTheme = {
  background: '#ffffff',
  text: '#374151',
  textSecondary: '#6b7280',
  grid: '#e5e7eb',
  axis: '#d1d5db',
  colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

/**
 * Dark theme - for dark backgrounds
 */
export const darkTheme: ChartTheme = {
  background: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  grid: '#374151',
  axis: '#4b5563',
  colors: ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c'],
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

/**
 * Minimal theme - subtle, understated
 */
export const minimalTheme: ChartTheme = {
  background: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  grid: '#f3f4f6',
  axis: '#e5e7eb',
  colors: ['#111827', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'],
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

/**
 * Brand theme - Ensemble brand colors
 */
export const brandTheme: ChartTheme = {
  background: '#ffffff',
  text: '#1e1b4b',
  textSecondary: '#4338ca',
  grid: '#e0e7ff',
  axis: '#c7d2fe',
  colors: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#818cf8', '#a5b4fc'],
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

/**
 * All built-in themes
 */
export const themes: Record<ChartThemeName, ChartTheme> = {
  light: lightTheme,
  dark: darkTheme,
  minimal: minimalTheme,
  brand: brandTheme,
}

/**
 * Get a theme by name, with fallback to light
 */
export function getTheme(name?: string): ChartTheme {
  if (!name) return lightTheme
  return themes[name as ChartThemeName] || lightTheme
}

/**
 * Create a custom theme by extending a base theme
 */
export function extendTheme(base: ChartThemeName, overrides: Partial<ChartTheme>): ChartTheme {
  return { ...themes[base], ...overrides }
}
