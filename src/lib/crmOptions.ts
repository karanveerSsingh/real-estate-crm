export const PURPOSE_OPTIONS = [
  'Investment',
  'Residential',
  'Villa',
  'Flat',
  'Bungalow',
  'Plot',
  'Commercial',
  'Shop',
  'Office',
  'Farm House',
  'Rent',
] as const;

export const BUDGET_OPTIONS = [
  'Below 10-20 Lakh',
  '20-30 Lakh',
  '30-40 Lakh',
  '40-50 Lakh',
  '50-75 Lakh',
  '75 Lakh-1 Crore',
  'Above 1 Crore',
] as const;

export const DEFAULT_LOCATIONS = [
  'Agra Road',
  'Delhi Road',
  'Ajmer Road',
  'Diggi Road',
  'Tonk Road',
] as const;

export const ROAD_OPTIONS = [
  'Agra Road',
  'Delhi Road',
  'Ajmer Road',
  'Diggi Road',
  'Tonk Road',
  'Jagatpura',
  'Mansarovar',
  'Sanganer',
  'Sitapura',
  'Vaishali Nagar',
  'Kalwar Road',
  'Sirsi Road',
  'Muhana',
  'Pratap Nagar',
] as const;

export const PROPERTY_CATEGORY_OPTIONS = [
  'Plot',
  'Villa',
  'Flat',
  'Bungalow',
  'Commercial',
  'Shop',
  'Office',
] as const;

export const PAYMENT_MODE_OPTIONS = [
  'Cash',
  'Cheque',
  'DD',
  'RTGS',
  'NEFT',
  'UPI',
  'Bank Transfer',
  'Other',
] as const;

/**
 * Formats a stored rupee amount for UI display without changing the value used
 * in forms, APIs, or the database. Example: 640000 → "6,40,000 (6.4 Lakh)".
 */
export const formatINR = (value: number | null | undefined) => {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const absoluteAmount = Math.abs(safeAmount);
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(safeAmount);

  const compact = (divisor: number, suffix: string) => {
    const compactValue = absoluteAmount / divisor;
    const readable = Number.isInteger(compactValue)
      ? String(compactValue)
      : compactValue.toFixed(1).replace(/\.0$/, '');
    return `${safeAmount < 0 ? '-' : ''}${readable}${suffix === 'K' ? '' : ' '}${suffix}`;
  };

  if (absoluteAmount >= 10_000_000) return `${formattedAmount} (${compact(10_000_000, 'Crore')})`;
  if (absoluteAmount >= 100_000) return `${formattedAmount} (${compact(100_000, 'Lakh')})`;
  if (absoluteAmount >= 1_000) return `${formattedAmount} (${compact(1_000, 'K')})`;
  return formattedAmount;
};
