export const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: 'INR (₹ - Indian Rupees)' },
  { code: 'USD', symbol: '$', label: 'USD ($ - US Dollars)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€ - Euros)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£ - British Pounds)' },
];

export function getCurrencySymbol(code: string = 'INR') {
  const match = CURRENCY_OPTIONS.find((c) => c.code === code);
  return match ? match.symbol : '₹';
}

export function formatCoursePrice(price: number, currency: string = 'INR') {
  if (!price || price === 0) return 'FREE ACCESS';
  const sym = getCurrencySymbol(currency);
  return `${sym}${price.toLocaleString()}`;
}
