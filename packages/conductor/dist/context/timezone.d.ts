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
export declare function getTimezoneOffset(timezone: string): number;
/**
 * Get timezone offset in hours (rounded)
 *
 * @param timezone - IANA timezone identifier
 * @returns Offset in hours from UTC
 */
export declare function getTimezoneOffsetHours(timezone: string): number;
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
export declare function isDST(timezone: string): boolean;
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
export declare function formatTime(timezone: string, date?: Date): string;
/**
 * Format just the time portion in a specific timezone
 *
 * @param timezone - IANA timezone identifier
 * @param date - Date to format (defaults to now)
 * @returns Formatted time string like "2:30 PM"
 */
export declare function formatTimeOnly(timezone: string, date?: Date): string;
/**
 * Format just the date portion in a specific timezone
 *
 * @param timezone - IANA timezone identifier
 * @param date - Date to format (defaults to now)
 * @returns Formatted date string like "Dec 6, 2024"
 */
export declare function formatDateOnly(timezone: string, date?: Date): string;
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
export declare function nowInTimezone(timezone: string): Date;
/**
 * Get the current hour in a specific timezone (0-23)
 *
 * @param timezone - IANA timezone identifier
 * @returns Current hour (0-23) in the timezone
 */
export declare function getCurrentHour(timezone: string): number;
/**
 * Check if it's currently business hours in a timezone
 *
 * @param timezone - IANA timezone identifier
 * @param startHour - Start of business hours (default: 9)
 * @param endHour - End of business hours (default: 17)
 * @returns True if current time is within business hours
 */
export declare function isBusinessHours(timezone: string, startHour?: number, endHour?: number): boolean;
/**
 * Get a greeting based on time of day in a timezone
 *
 * @param timezone - IANA timezone identifier
 * @returns "morning", "afternoon", or "evening"
 */
export declare function getTimeOfDay(timezone: string): 'morning' | 'afternoon' | 'evening';
//# sourceMappingURL=timezone.d.ts.map