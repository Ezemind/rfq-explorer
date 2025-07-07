/**
 * Time zone utility for GMT+2 (South Africa/Johannesburg)
 */

// South Africa is UTC+2 (no daylight saving time)
const SOUTH_AFRICA_OFFSET = 2; // hours ahead of UTC

/**
 * Convert UTC date to South Africa time (GMT+2)
 * @param {Date|string} date - Date to convert
 * @returns {Date} - Date adjusted to South Africa timezone
 */
export function toSouthAfricaTime(date) {
  const utcDate = new Date(date);
  // Add 2 hours to UTC time
  return new Date(utcDate.getTime() + (SOUTH_AFRICA_OFFSET * 60 * 60 * 1000));
}

/**
 * Format time for South Africa timezone (GMT+2)
 * @param {Date|string} timestamp - Timestamp to format
 * @param {object} options - Formatting options
 * @returns {string} - Formatted time string
 */
export function formatSATime(timestamp, options = {}) {
  if (!timestamp) return '';
  
  // Parse the timestamp properly
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  // Use Intl.DateTimeFormat for proper timezone handling
  const formatter = new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
    hour12: false,
    ...options
  });
  
  return formatter.format(date);
}

/**
 * Format date for South Africa timezone
 * @param {Date|string} timestamp - Timestamp to format
 * @param {object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export function formatSADate(timestamp, options = {}) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const formatter = new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Johannesburg',
    ...options
  });
  
  return formatter.format(date);
}

/**
 * Format full date and time for South Africa
 * @param {Date|string} timestamp - Timestamp to format
 * @returns {string} - Full formatted datetime string
 */
export function formatSADateTime(timestamp) {
  const saDate = toSouthAfricaTime(timestamp);
  
  return saDate.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
    hour12: false
  });
}

/**
 * Get current South Africa time
 * @returns {Date} - Current date in SA timezone
 */
export function nowInSouthAfrica() {
  return toSouthAfricaTime(new Date());
}
