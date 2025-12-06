/**
 * Utility functions for date formatting
 */
class DateFormatter {
  /**
   * Detect date format from string
   * @param {string} dateStr - Date string to detect
   * @returns {string} Format type: 'ISO', 'VN', 'US', 'EU', 'UNKNOWN'
   */
  static detectFormat(dateStr) {
    if (!dateStr) return 'UNKNOWN';

    const str = dateStr.trim();

    // ISO: 2025-11-20 or 2025/11/20
    if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(str)) return 'ISO';

    // VN: 20/11/2025 or 20-11-2025
    if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(str)) return 'VN';

    // US: 11/20/2025 or 11-20-2025 (month first)
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(str)) return 'US';

    return 'UNKNOWN';
  }

  /**
   * Parse date string to Date object
   * @param {string} dateStr - Date string
   * @param {string} fromFormat - Source format (auto-detect if not provided)
   * @returns {Date|null} Date object or null if invalid
   */
  static parseDate(dateStr, fromFormat = null) {
    if (!dateStr) return null;

    const str = dateStr.trim();
    const format = fromFormat || this.detectFormat(str);

    let year, month, day;

    switch (format) {
      case 'ISO':
        // 2025-11-20 or 2025/11/20
        const isoParts = str.split(/[-/]/);
        [year, month, day] = isoParts.map(Number);
        break;

      case 'VN':
        // 20/11/2025 or 20-11-2025
        const vnParts = str.split(/[-/]/);
        [day, month, year] = vnParts.map(Number);
        break;

      case 'US':
        // 11/20/2025 or 11-20-2025
        const usParts = str.split(/[-/]/);
        [month, day, year] = usParts.map(Number);
        break;

      default:
        // Try native Date parsing
        const date = new Date(str);
        return isNaN(date.getTime()) ? null : date;
    }

    // Validate
    if (!year || !month || !day) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    // Create Date object (month is 0-indexed)
    const date = new Date(year, month - 1, day);

    // Verify the date is valid (handles things like Feb 31)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  /**
   * Format Date object to string
   * @param {Date|string} date - Date object or string
   * @param {string} toFormat - Target format: 'ISO', 'VN', 'US', 'EU'
   * @param {string} separator - Separator character: '-', '/', '.'
   * @returns {string} Formatted date string
   */
  static formatDate(date, toFormat = 'ISO', separator = '-') {
    // If date is string, parse it first
    if (typeof date === 'string') {
      date = this.parseDate(date);
    }

    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (toFormat.toUpperCase()) {
      case 'ISO':
        // yyyy-MM-dd
        return `${year}${separator}${month}${separator}${day}`;

      case 'VN':
        // dd-MM-yyyy
        return `${day}${separator}${month}${separator}${year}`;

      case 'US':
        // MM-dd-yyyy
        return `${month}${separator}${day}${separator}${year}`;

      case 'EU':
        // dd.MM.yyyy
        return `${day}${separator}${month}${separator}${year}`;

      default:
        return `${year}${separator}${month}${separator}${day}`;
    }
  }

  /**
   * Convert date from one format to another
   * @param {string} dateStr - Source date string
   * @param {string} fromFormat - Source format (auto-detect if null)
   * @param {string} toFormat - Target format
   * @param {string} separator - Separator for output
   * @returns {string} Converted date string
   */
  static convert(dateStr, fromFormat = null, toFormat = 'ISO', separator = '-') {
    const date = this.parseDate(dateStr, fromFormat);
    return this.formatDate(date, toFormat, separator);
  }

  /**
   * Format date for Vietnamese display (dd/MM/yyyy)
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static toVietnamese(date) {
    return this.formatDate(date, 'VN', '/');
  }

  /**
   * Format date for ISO (yyyy-MM-dd)
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static toISO(date) {
    return this.formatDate(date, 'ISO', '-');
  }

  /**
   * Format date for file names (yyyyMMdd)
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static toFileName(date) {
    if (typeof date === 'string') {
      date = this.parseDate(date);
    }

    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }
}

// Export for use in other modules
export default DateFormatter;

// Usage examples:
// Import
// import DateFormatter from './utils/date-formatter.js';

// // Detect format
// DateFormatter.detectFormat('20/11/2025'); // 'VN'
// DateFormatter.detectFormat('2025-11-20'); // 'ISO'

// // Convert VN to ISO
// DateFormatter.convert('20/11/2025', 'VN', 'ISO'); // '2025-11-20'

// // Convert ISO to VN
// DateFormatter.convert('2025-11-20', 'ISO', 'VN', '/'); // '20/11/2025'

// // Auto-detect and convert
// DateFormatter.convert('20/11/2025', null, 'ISO'); // '2025-11-20'

// // Quick helpers
// DateFormatter.toVietnamese('2025-11-20'); // '20/11/2025'
// DateFormatter.toISO('20/11/2025'); // '2025-11-20'
// DateFormatter.toFileName('20/11/2025'); // '20251120'

// // Custom separator
// DateFormatter.convert('20/11/2025', 'VN', 'ISO', '.'); // '2025.11.20'
