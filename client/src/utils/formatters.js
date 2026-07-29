/**
 * Formats a number as a currency string.
 * e.g. formatCurrency(1234.56) => "$1,234.56"
 */
export const formatCurrency = (amount, currency = 'USD', decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Formats a date into a readable short date string.
 * e.g. formatDate("2026-07-29T12:00:00Z") => "29/07/2026"
 */
export const formatDate = (dateInput, options) => {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  const defaultOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options || defaultOptions);
};

/**
 * Formats a date into a readable datetime string.
 * e.g. "29/07/2026, 12:34"
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
