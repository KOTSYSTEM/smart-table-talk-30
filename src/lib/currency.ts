// Currency formatting utilities for global SaaS app
export const CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

// GST tax configuration for India
export const TAX_CONFIG = {
  CGST: 2.5,
  SGST: 2.5,
  GST: 5,
  SERVICE_CHARGE: 5,
};

export function calculateGST(amount: number): { cgst: number; sgst: number; total: number } {
  const cgst = (amount * TAX_CONFIG.CGST) / 100;
  const sgst = (amount * TAX_CONFIG.SGST) / 100;
  return {
    cgst,
    sgst,
    total: cgst + sgst,
  };
}

export function calculateServiceCharge(amount: number): number {
  return (amount * TAX_CONFIG.SERVICE_CHARGE) / 100;
}
