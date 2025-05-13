
import { format, parse, isValid } from "date-fns";

export const parseSlotDateTime = (dateTimeStr: string): Date => {
  try {
    if (!dateTimeStr) {
      return new Date();
    }
    
    const parsedDate = parse(dateTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    
    // Check if the parsed date is valid
    if (!isValid(parsedDate)) {
      console.warn(`Invalid date format: ${dateTimeStr}, using current date instead`);
      return new Date();
    }
    
    return parsedDate;
  } catch (error) {
    console.warn(`Error parsing date: ${dateTimeStr}`, error);
    return new Date();
  }
};

export const formatDateTimeForDisplay = (dateTimeStr: string): string => {
  try {
    if (!dateTimeStr) {
      return "N/A";
    }
    
    const date = parse(dateTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    
    // Check if the parsed date is valid
    if (!isValid(date)) {
      console.warn(`Invalid date format: ${dateTimeStr}, returning original string`);
      return dateTimeStr;
    }
    
    return format(date, 'MMM dd, yyyy hh:mm a');
  } catch (error) {
    console.warn(`Error formatting date: ${dateTimeStr}`, error);
    return dateTimeStr;
  }
};

export const getTimePickerValues = () => {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];
  return { hours, minutes, periods };
};

/**
 * Safely formats a date with fallback for invalid dates
 * @param date A Date object or string to format
 * @param formatStr The format string
 * @param fallback Fallback string to return if date is invalid
 */
export const safeFormat = (date: Date | string | null | undefined, formatStr: string, fallback: string = "N/A"): string => {
  try {
    if (!date) return fallback;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!isValid(dateObj)) {
      console.warn(`Invalid date value: ${date}`);
      return fallback;
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn(`Error formatting date: ${date}`, error);
    return fallback;
  }
};

/**
 * Format time string into 12-hour format with AM/PM as shown in the reference image
 * @param dateTimeStr Date time string in format 'YYYY-MM-DD HH:MM:SS' or ISO string
 * @returns Formatted time string like '10:30 AM'
 */
export const formatTimeWithAmPm = (dateTimeStr: string): string => {
  try {
    if (!dateTimeStr) {
      return "N/A";
    }
    
    // Handle ISO string format (with T) or space-separated format
    const dateStr = dateTimeStr.includes('T') 
      ? dateTimeStr 
      : dateTimeStr.replace(' ', 'T');
    
    const date = new Date(dateStr);
    
    // Check if the parsed date is valid
    if (!isValid(date)) {
      // Try alternative parsing for 'YYYY-MM-DD HH:MM:SS' format
      const parsedDate = parse(dateTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date());
      if (!isValid(parsedDate)) {
        console.warn(`Invalid date format: ${dateTimeStr}, returning N/A`);
        return "N/A";
      }
      return format(parsedDate, 'h:mm a');
    }
    
    return format(date, 'h:mm a');
  } catch (error) {
    console.warn(`Error formatting time: ${dateTimeStr}`, error);
    return "N/A";
  }
};
