/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date string to a readable format
 * @param dateString The date string to format
 * @param format The format to use (default: 'medium')
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string, 
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : format === 'medium' ? 'short' : 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Format a percentage
 * @param value The value to format as percentage
 * @param decimals The number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals = 0): string => {
  return `${value.toFixed(decimals)}%`;
};