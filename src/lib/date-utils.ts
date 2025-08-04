import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { format as formatDateFns } from 'date-fns';

const TIME_ZONE = 'Asia/Kolkata';

/**
 * Converts a date from a 'yyyy-MM-ddTHH:mm' string (assumed to be in IST)
 * to a UTC Date object for storing in Firestore.
 * @param dateString - The date string from a datetime-local input.
 * @returns A JavaScript Date object representing the specified time in UTC.
 */
export function localStringToUtc(dateString: string): Date {
  return zonedTimeToUtc(dateString, TIME_ZONE);
}

/**
 * Converts a UTC Date object (from Firestore) to a formatted string in IST.
 * @param date - The JavaScript Date object.
 * @param format - The desired output format string (e.g., 'dd/MM/yyyy p').
 * @returns A formatted date string in IST.
 */
export function utcToLocalString(date: Date, format: string = 'PPpp'): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return formatInTimeZone(date, TIME_ZONE, format);
}


/**
 * Converts a UTC Date object (from Firestore) to a 'yyyy-MM-ddTHH:mm' string
 * for populating datetime-local input fields in IST.
 * @param date - The JavaScript Date object.
 * @returns A date string suitable for datetime-local input value, in IST.
 */
export function utcToDateTimeLocalString(date?: Date): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }
    const zonedDate = utcToZonedTime(date, TIME_ZONE);
    return formatDateFns(zonedDate, "yyyy-MM-dd'T'HH:mm");
}


/**
 * Returns the current date and time in the standard IST timezone.
 * @returns A JavaScript Date object for the current time.
 */
export function getCurrentDateInUTC(): Date {
    return new Date();
}
