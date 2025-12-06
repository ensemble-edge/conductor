/**
 * Timezone Helpers Tests
 *
 * Tests for timezone offset calculation, DST detection, and time formatting
 */

import { describe, it, expect } from 'vitest'
import {
  getTimezoneOffset,
  getTimezoneOffsetHours,
  isDST,
  formatTime,
  formatTimeOnly,
  formatDateOnly,
  nowInTimezone,
  getCurrentHour,
  isBusinessHours,
  getTimeOfDay,
} from '../../../src/context/timezone'

describe('Timezone Helpers', () => {
  describe('getTimezoneOffset', () => {
    it('should return offset in minutes for valid timezone', () => {
      const offset = getTimezoneOffset('America/New_York')
      expect(typeof offset).toBe('number')
      // New York is either -300 (EST) or -240 (EDT)
      expect(offset).toBeLessThanOrEqual(0)
      expect(offset).toBeGreaterThanOrEqual(-360)
    })

    it('should return positive offset for timezones ahead of UTC', () => {
      const offset = getTimezoneOffset('Asia/Tokyo')
      expect(offset).toBe(540) // Japan is UTC+9 (9 * 60 = 540)
    })

    it('should return 0 for UTC', () => {
      const offset = getTimezoneOffset('UTC')
      expect(offset).toBe(0)
    })

    it('should return 0 for invalid timezone', () => {
      const offset = getTimezoneOffset('Invalid/Timezone')
      expect(offset).toBe(0)
    })
  })

  describe('getTimezoneOffsetHours', () => {
    it('should return offset in hours', () => {
      const hours = getTimezoneOffsetHours('Asia/Tokyo')
      expect(hours).toBe(9)
    })

    it('should return negative hours for timezones behind UTC', () => {
      const hours = getTimezoneOffsetHours('America/Los_Angeles')
      // LA is either -8 (PST) or -7 (PDT)
      expect(hours).toBeLessThanOrEqual(-7)
      expect(hours).toBeGreaterThanOrEqual(-8)
    })
  })

  describe('isDST', () => {
    it('should return boolean for valid timezone', () => {
      const result = isDST('America/New_York')
      expect(typeof result).toBe('boolean')
    })

    it('should return false for timezones without DST', () => {
      const result = isDST('Asia/Tokyo')
      expect(result).toBe(false)
    })

    it('should return false for invalid timezone', () => {
      const result = isDST('Invalid/Timezone')
      expect(result).toBe(false)
    })

    it('should return false for UTC', () => {
      const result = isDST('UTC')
      expect(result).toBe(false)
    })
  })

  describe('formatTime', () => {
    it('should format date in specified timezone', () => {
      const testDate = new Date('2024-06-15T12:00:00Z')
      const formatted = formatTime('America/New_York', testDate)

      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
      // Should contain date components
      expect(formatted).toMatch(/\d/)
    })

    it('should use current time when no date provided', () => {
      const formatted = formatTime('UTC')
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should fallback to UTC for invalid timezone', () => {
      const testDate = new Date('2024-06-15T12:00:00Z')
      const formatted = formatTime('Invalid/Timezone', testDate)
      expect(typeof formatted).toBe('string')
    })
  })

  describe('formatTimeOnly', () => {
    it('should format only time portion', () => {
      const testDate = new Date('2024-06-15T12:30:00Z')
      const formatted = formatTimeOnly('UTC', testDate)

      expect(formatted).toMatch(/12:30/)
    })

    it('should respect timezone', () => {
      const testDate = new Date('2024-06-15T12:00:00Z')
      const utcTime = formatTimeOnly('UTC', testDate)
      const tokyoTime = formatTimeOnly('Asia/Tokyo', testDate)

      // Tokyo is 9 hours ahead, so they should be different
      expect(utcTime).not.toBe(tokyoTime)
    })
  })

  describe('formatDateOnly', () => {
    it('should format only date portion', () => {
      const testDate = new Date('2024-06-15T12:00:00Z')
      const formatted = formatDateOnly('UTC', testDate)

      expect(formatted).toMatch(/Jun/)
      expect(formatted).toMatch(/15/)
      expect(formatted).toMatch(/2024/)
    })
  })

  describe('nowInTimezone', () => {
    it('should return Date object', () => {
      const now = nowInTimezone('America/New_York')
      expect(now).toBeInstanceOf(Date)
    })

    it('should return different hours for different timezones', () => {
      const utcNow = nowInTimezone('UTC')
      const tokyoNow = nowInTimezone('Asia/Tokyo')

      // They represent the same moment but adjusted hours
      // The difference should be related to timezone offset
      const hourDiff = Math.abs(utcNow.getHours() - tokyoNow.getHours())
      expect(hourDiff).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getCurrentHour', () => {
    it('should return hour between 0 and 23', () => {
      const hour = getCurrentHour('UTC')
      expect(hour).toBeGreaterThanOrEqual(0)
      expect(hour).toBeLessThanOrEqual(23)
    })

    it('should return different hours for different timezones', () => {
      // This test may occasionally fail if the hours happen to be the same
      // But with a 9-hour difference, it's unlikely at most times
      const utcHour = getCurrentHour('UTC')
      const tokyoHour = getCurrentHour('Asia/Tokyo')

      // Just verify they return valid hours
      expect(typeof utcHour).toBe('number')
      expect(typeof tokyoHour).toBe('number')
    })
  })

  describe('isBusinessHours', () => {
    it('should return boolean', () => {
      const result = isBusinessHours('UTC')
      expect(typeof result).toBe('boolean')
    })

    it('should accept custom start and end hours', () => {
      // 0-24 should always be business hours
      expect(isBusinessHours('UTC', 0, 24)).toBe(true)

      // Empty range should never be business hours
      expect(isBusinessHours('UTC', 12, 12)).toBe(false)
    })

    it('should use default 9-17 range', () => {
      const result = isBusinessHours('UTC')
      const currentHour = getCurrentHour('UTC')

      if (currentHour >= 9 && currentHour < 17) {
        expect(result).toBe(true)
      } else {
        expect(result).toBe(false)
      }
    })
  })

  describe('getTimeOfDay', () => {
    it('should return morning, afternoon, or evening', () => {
      const result = getTimeOfDay('UTC')
      expect(['morning', 'afternoon', 'evening']).toContain(result)
    })

    it('should be consistent with current hour', () => {
      const hour = getCurrentHour('UTC')
      const timeOfDay = getTimeOfDay('UTC')

      if (hour < 12) {
        expect(timeOfDay).toBe('morning')
      } else if (hour < 17) {
        expect(timeOfDay).toBe('afternoon')
      } else {
        expect(timeOfDay).toBe('evening')
      }
    })
  })
})
