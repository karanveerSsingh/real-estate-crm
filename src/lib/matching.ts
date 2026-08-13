import { BUDGET_OPTIONS, PROPERTY_CATEGORY_OPTIONS } from '@/lib/crmOptions';

type CustomerLike = {
  budget: string;
  preferredLocations?: string[];
  purpose?: string;
  requirement?: string;
  leadStatus?: string;
  [key: string]: unknown;
};

type PropertyLike = {
  price: number;
  location: string;
  road?: string;
  propertyCategory?: string;
  facing?: string;
  jdaApproved?: boolean;
  rera?: boolean;
  societyApproved?: boolean;
  status?: string;
  [key: string]: unknown;
};

export type BudgetRange = { min: number; max: number };
export type MatchResult<T> = T & { matchScore: number; matchReasons: string[] };

export function normalizeMatchValue(value: string | undefined | null) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseBudgetRange(value: string): BudgetRange | null {
  const input = value.toLowerCase().replace(/,/g, ' ').trim();
  const matches = [...input.matchAll(/(\d+(?:\.\d+)?)\s*(lakh|lac|crore|cr)?/g)];
  if (!matches.length) return null;
  const inheritedUnit = matches[matches.length - 1][2];
  const amounts = matches.map((match) => {
    const number = Number(match[1]);
    const unit = match[2] || inheritedUnit;
    return number * (unit === 'crore' || unit === 'cr' ? 10_000_000 : 100_000);
  }).filter(Number.isFinite);
  if (!amounts.length) return null;
  if (input.includes('above')) return { min: amounts[0], max: Number.POSITIVE_INFINITY };
  if (input.includes('below')) return { min: 0, max: Math.max(...amounts) };
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

export function budgetMatchesPrice(budget: string, price: number, tolerance = true) {
  const range = parseBudgetRange(budget);
  if (!range || !Number.isFinite(price)) return false;
  const lower = tolerance ? range.min * 0.9 : range.min;
  const upper = tolerance && Number.isFinite(range.max) ? range.max * 1.1 : range.max;
  return price >= lower && price <= upper;
}

export function matchingBudgetOptions(price: number, tolerance = true) {
  return BUDGET_OPTIONS.filter((budget) => budgetMatchesPrice(budget, price, tolerance));
}

export function locationMatches(preferredLocations: string[] | undefined, property: Pick<PropertyLike, 'location' | 'road'>) {
  const candidates = [property.location, property.road].map(normalizeMatchValue).filter(Boolean);
  return (preferredLocations || []).some((location) => {
    const preferred = normalizeMatchValue(location);
    return preferred.length >= 3 && candidates.some((candidate) => candidate === preferred || candidate.includes(preferred) || preferred.includes(candidate));
  });
}

function requestedPropertyCategory(purpose: string | undefined) {
  const normalizedPurpose = normalizeMatchValue(purpose);
  return PROPERTY_CATEGORY_OPTIONS.find((category) => normalizeMatchValue(category) === normalizedPurpose);
}

function requirementFeaturesMatch(requirement: string | undefined, property: PropertyLike) {
  const text = normalizeMatchValue(requirement);
  if (!text) return true;
  const checks = [
    property.facing && text.includes(normalizeMatchValue(property.facing)),
    property.jdaApproved && text.includes('jda'),
    property.rera && text.includes('rera'),
    property.societyApproved && text.includes('society'),
  ].filter(Boolean);
  return checks.length > 0 || !/(jda|rera|society|facing|east|west|north|south)/.test(text);
}

export function scorePropertyForCustomer(customer: CustomerLike, property: PropertyLike, tolerance = true): MatchResult<PropertyLike> {
  const requiredCategory = requestedPropertyCategory(customer.purpose);
  const hasLocationMatch = locationMatches(customer.preferredLocations, property);
  const hasBudgetMatch = budgetMatchesPrice(customer.budget, property.price, tolerance);
  const hasCategoryMatch = !requiredCategory || normalizeMatchValue(property.propertyCategory) === normalizeMatchValue(requiredCategory);

  let score = 20;
  const reasons: string[] = ['General listing'];

  if (hasLocationMatch) {
    score += 35;
    reasons[0] = 'Location match';
  } else if ((customer.preferredLocations || []).length > 0) {
    score += 5;
    reasons.push('Location review');
  }

  if (hasBudgetMatch) {
    score += 30;
    reasons.push('Within budget');
  } else {
    score += 5;
    reasons.push('Budget review');
  }

  if (requiredCategory) {
    if (hasCategoryMatch) {
      score += 15;
      reasons.push(`${requiredCategory} match`);
    } else {
      score += 5;
      reasons.push('Category review');
    }
  } else {
    score += 10;
    reasons.push('Open category');
  }

  if (requirementFeaturesMatch(customer.requirement, property)) {
    score += 5;
    if (customer.requirement) reasons.push('Requirement match');
  }

  if (property.status === 'Available') {
    score += 10;
    reasons.push('Available');
  }

  return { ...property, matchScore: Math.min(score, 100), matchReasons: Array.from(new Set(reasons)) };
}

export function matchPropertyForCustomer(customer: CustomerLike, property: PropertyLike, tolerance = true): MatchResult<PropertyLike> | null {
  const scored = scorePropertyForCustomer(customer, property, tolerance);
  const hasLocationMatch = locationMatches(customer.preferredLocations, property);
  const hasBudgetMatch = budgetMatchesPrice(customer.budget, property.price, tolerance);
  const requiredCategory = requestedPropertyCategory(customer.purpose);
  const hasCategoryMatch = !requiredCategory || normalizeMatchValue(property.propertyCategory) === normalizeMatchValue(requiredCategory);
  if (property.status === 'Sold' || !hasLocationMatch || !hasBudgetMatch || !hasCategoryMatch) return null;
  return scored;
}

export function rankPropertiesForCustomer(customer: CustomerLike, properties: PropertyLike[], tolerance = true) {
  return properties
    .filter((property) => property.status !== 'Sold')
    .map((property) => scorePropertyForCustomer(customer, property, tolerance))
    .sort((a, b) => b.matchScore - a.matchScore || (String((a as any).projectName || (a as any).propertyName || '')).localeCompare(String((b as any).projectName || (b as any).propertyName || '')));
}

export function matchLeadForProperty(customer: CustomerLike, property: PropertyLike, tolerance = true): MatchResult<CustomerLike> | null {
  const match = matchPropertyForCustomer(customer, property, tolerance);
  if (!match || customer.leadStatus === 'Sold' || customer.leadStatus === 'Lost') return null;
  return { ...customer, matchScore: match.matchScore, matchReasons: match.matchReasons };
}
