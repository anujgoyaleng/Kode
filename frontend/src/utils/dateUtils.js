/**
 * Date utility functions for handling date validation and formatting
 */

/**
 * Validates if a date string is valid
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Formats a date string safely
 * @param {string} dateStr - Date string to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string or 'Invalid Date'
 */
export const formatDate = (dateStr, options = {}) => {
  try {
    if (!isValidDate(dateStr)) {
      console.warn('Invalid date string:', dateStr);
      return 'Invalid Date';
    }
    
    const date = new Date(dateStr);
    const defaultOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return 'Invalid Date';
  }
};

/**
 * Generates a date string in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const toISODateString = (date) => {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date object:', date);
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error converting date to ISO string:', error);
    return null;
  }
};

/**
 * Creates a date object from a date string with validation
 * @param {string} dateStr - Date string
 * @returns {Date|null} - Date object or null if invalid
 */
export const createValidDate = (dateStr) => {
  try {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateStr);
      return null;
    }
    return date;
  } catch (error) {
    console.error('Error creating date:', dateStr, error);
    return null;
  }
};

/**
 * Checks if a date is within a valid range (not too old, not in future)
 * @param {string|Date} date - Date to check
 * @param {number} maxDaysOld - Maximum days old (default: 7)
 * @returns {Object} - { isValid: boolean, isOld: boolean, isFuture: boolean, message: string }
 */
export const validateDateRange = (date, maxDaysOld = 7) => {
  try {
    const dateObj = typeof date === 'string' ? createValidDate(date) : date;
    
    if (!dateObj) {
      return {
        isValid: false,
        isOld: false,
        isFuture: false,
        message: 'Invalid date format'
      };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));
    const isOld = daysDifference > maxDaysOld;
    const isFuture = dateObj > today;
    
    let message = '';
    if (isOld) {
      message = `Cannot update attendance older than ${maxDaysOld} days`;
    } else if (isFuture) {
      message = 'Cannot mark attendance for future dates';
    }
    
    return {
      isValid: !isOld && !isFuture,
      isOld,
      isFuture,
      message
    };
  } catch (error) {
    console.error('Error validating date range:', error);
    return {
      isValid: false,
      isOld: false,
      isFuture: false,
      message: 'Error validating date'
    };
  }
};
