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

export const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
