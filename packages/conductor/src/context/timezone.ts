/**
 * Timezone Helpers
 *
 * Utilities for working with timezones: offset calculation, DST detection,
 * time formatting, and getting current time in a specific timezone.
 */

/**
 * Get timezone offset from UTC in minutes
 *
 * Returns a positive number for timezones ahead of UTC (e.g., +120 for UTC+2)
 * and negative for timezones behind UTC (e.g., -300 for UTC-5).
 *
 * Note: This is DST-aware - it returns the current offset including any
 * daylight saving time adjustment.
 *
 * @param timezone - IANA timezone identifier (e.g., "America/Chicago")
 * @returns Offset in minutes from UTC
 *
 * @example
 * ```typescript
 * getTimezoneOffset('America/Chicago')  // -360 (CST) or -300 (CDT)
 * getTimezoneOffset('Europe/Berlin')    // +60 (CET) or +120 (CEST)
 * getTimezoneOffset('Asia/Tokyo')       // +540 (always, no DST)
 * ```
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date()

    // Get time string in UTC
    const utcString = now.toLocaleString('en-US', { timeZone: 'UTC' })
    const utcDate = new Date(utcString)

    // Get time string in target timezone
    const tzString = now.toLocaleString('en-US', { timeZone: timezone })
    const tzDate = new Date(tzString)

    // Calculate difference in minutes
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000)
  } catch {
    // Invalid timezone, assume UTC
    return 0
  }
}

/**
 * Get timezone offset in hours (rounded)
 *
 * @param timezone - IANA timezone identifier
 * @returns Offset in hours from UTC
 */
export function getTimezoneOffsetHours(timezone: string): number {
  return Math.round(getTimezoneOffset(timezone) / 60)
}

/**
 * Check if daylight saving time is currently active for a timezone
 *
 * Compares January and July offsets to determine standard time,
 * then checks if current offset differs.
 *
 * @param timezone - IANA timezone identifier
 * @returns True if DST is currently active
 *
 * @example
 * ```typescript
 * // In Chicago during summer
 * isDST('America/Chicago')  // true
 *
 * // In Chicago during winter
 * isDST('America/Chicago')  // false
 *
 * // Tokyo (no DST)
 * isDST('Asia/Tokyo')       // always false
 * ```
 */
export function isDST(timezone: string): boolean {
  try {
    const year = new Date().getFullYear()

    // Get offset in January (winter in Northern Hemisphere)
    const jan = new Date(year, 0, 1)
    const janOffset = getOffsetForDate(timezone, jan)

    // Get offset in July (summer in Northern Hemisphere)
    const jul = new Date(year, 6, 1)
    const julOffset = getOffsetForDate(timezone, jul)

    // If offsets are the same, no DST in this timezone
    if (janOffset === julOffset) return false

    // Standard time has the smaller (more negative / less positive) offset
    const stdOffset = Math.min(janOffset, julOffset)

    // Get current offset
    const currentOffset = getTimezoneOffset(timezone)

    // DST is active if current offset differs from standard
    return currentOffset !== stdOffset
  } catch {
    return false
  }
}

/**
 * Get offset for a specific date (internal helper)
 */
function getOffsetForDate(timezone: string, date: Date): number {
  try {
    const utcString = date.toLocaleString('en-US', { timeZone: 'UTC' })
    const utcDate = new Date(utcString)

    const tzString = date.toLocaleString('en-US', { timeZone: timezone })
    const tzDate = new Date(tzString)

    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000)
  } catch {
    return 0
  }
}

/**
 * Format a date/time in a specific timezone
 *
 * Returns a human-readable string like "Dec 6, 2024, 2:30 PM"
 *
 * @param timezone - IANA timezone identifier
 * @param date - Date to format (defaults to now)
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatTime('America/Chicago')
 * // => "Dec 6, 2024, 2:30 PM"
 *
 * formatTime('Asia/Tokyo', new Date('2024-12-25T00:00:00Z'))
 * // => "Dec 25, 2024, 9:00 AM"
 * ```
 */
export function formatTime(timezone: string, date: Date = new Date()): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    // Fallback to UTC if timezone invalid
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }
}

/**
 * Format just the time portion in a specific timezone
 *
 * @param timezone - IANA timezone identifier
 * @param date - Date to format (defaults to now)
 * @returns Formatted time string like "2:30 PM"
 */
export function formatTimeOnly(timezone: string, date: Date = new Date()): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      timeStyle: 'short',
    })
  } catch {
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      timeStyle: 'short',
    })
  }
}

/**
 * Format just the date portion in a specific timezone
 *
 * @param timezone - IANA timezone identifier
 * @param date - Date to format (defaults to now)
 * @returns Formatted date string like "Dec 6, 2024"
 */
export function formatDateOnly(timezone: string, date: Date = new Date()): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      dateStyle: 'medium',
    })
  } catch {
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
    })
  }
}

/**
 * Get current time in a specific timezone as a Date object
 *
 * Note: The returned Date object, when accessed with methods like getHours(),
 * getMinutes(), etc., will return values as if the local machine were in
 * the target timezone.
 *
 * @param timezone - IANA timezone identifier
 * @returns Date object representing current time in the timezone
 *
 * @example
 * ```typescript
 * const chicagoNow = nowInTimezone('America/Chicago');
 * const hour = chicagoNow.getHours();  // Hour in Chicago, not your local time
 *
 * // Check business hours in user's timezone
 * const userTime = nowInTimezone(ctx.location.timezone);
 * const isBusinessHours = userTime.getHours() >= 9 && userTime.getHours() < 17;
 * ```
 */
export function nowInTimezone(timezone: string): Date {
  const now = new Date()
  const offset = getTimezoneOffset(timezone)
  const utcOffset = now.getTimezoneOffset() // Local machine's offset (note: getTimezoneOffset returns opposite sign)

  // Adjust by difference between target TZ and local TZ
  // getTimezoneOffset() returns minutes west of UTC (negative for east)
  // So we need to add both offsets to convert to target timezone
  return new Date(now.getTime() + (offset + utcOffset) * 60000)
}

/**
 * Get the current hour in a specific timezone (0-23)
 *
 * @param timezone - IANA timezone identifier
 * @returns Current hour (0-23) in the timezone
 */
export function getCurrentHour(timezone: string): number {
  try {
    const hourStr = new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })
    return parseInt(hourStr, 10)
  } catch {
    return new Date().getUTCHours()
  }
}

/**
 * Check if it's currently business hours in a timezone
 *
 * @param timezone - IANA timezone identifier
 * @param startHour - Start of business hours (default: 9)
 * @param endHour - End of business hours (default: 17)
 * @returns True if current time is within business hours
 */
export function isBusinessHours(timezone: string, startHour = 9, endHour = 17): boolean {
  const hour = getCurrentHour(timezone)
  return hour >= startHour && hour < endHour
}

/**
 * Get a greeting based on time of day in a timezone
 *
 * @param timezone - IANA timezone identifier
 * @returns "morning", "afternoon", or "evening"
 */
export function getTimeOfDay(timezone: string): 'morning' | 'afternoon' | 'evening' {
  const hour = getCurrentHour(timezone)
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
