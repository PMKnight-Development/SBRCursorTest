/**
 * Utility functions for handling coordinates
 */

/**
 * Safely converts a coordinate value to a number
 * @param value - The coordinate value (could be string, number, or null/undefined)
 * @returns The coordinate as a number, or null if invalid
 */
export const safeCoordinate = (value: any): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? null : num;
};

/**
 * Checks if a coordinate pair is valid
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns True if both coordinates are valid numbers
 */
export const isValidCoordinatePair = (lat: any, lng: any): boolean => {
  const latitude = safeCoordinate(lat);
  const longitude = safeCoordinate(lng);
  
  return latitude !== null && longitude !== null &&
         latitude >= -90 && latitude <= 90 &&
         longitude >= -180 && longitude <= 180;
};

/**
 * Formats coordinates for display
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @param precision - Number of decimal places (default: 6)
 * @returns Formatted coordinate string or null if invalid
 */
export const formatCoordinates = (lat: any, lng: any, precision: number = 6): string | null => {
  if (!isValidCoordinatePair(lat, lng)) {
    return null;
  }
  
  const latitude = safeCoordinate(lat)!;
  const longitude = safeCoordinate(lng)!;
  
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
}; 