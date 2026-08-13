import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import Property from '@/models/Property';
import { escapeRegex, matchPropertyForCustomer, parseBudgetRange } from '@/lib/matching';

function dateValue(value: unknown) {
  return value instanceof Date || typeof value === 'string' || typeof value === 'number' ? new Date(value).getTime() : 0;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await getServerSession(authOptions)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tolerance = searchParams.get('tolerance') !== 'strict';
    const sort = searchParams.get('sort') || 'match';
    const location = searchParams.get('location') || '';
    const propertyType = searchParams.get('propertyType') || '';
    await connectDB();
    const customer = await Customer.findById(id).lean();
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const budget = parseBudgetRange(customer.budget);
    const priceQuery = budget ? { $gte: tolerance ? budget.min * 0.9 : budget.min, ...(Number.isFinite(budget.max) ? { $lte: tolerance ? budget.max * 1.1 : budget.max } : {}) } : undefined;
    const preferredLocations: string[] = location ? [location] : customer.preferredLocations || [];
    const locationClauses = preferredLocations.map((value: string) => [{ location: { $regex: escapeRegex(value), $options: 'i' } }, { road: { $regex: escapeRegex(value), $options: 'i' } }]);
    const query: Record<string, unknown> = { status: { $in: ['Available', 'Booked'] }, ...(priceQuery ? { price: priceQuery } : {}) };
    if (locationClauses.length) query.$or = locationClauses.flat();
    if (propertyType) query.propertyCategory = propertyType;
    const candidates = await Property.find(query).lean().limit(200);
    const matches = candidates.map((property) => matchPropertyForCustomer(customer, property, tolerance)).filter((match): match is NonNullable<typeof match> => Boolean(match));
    const sorted = [...matches].sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'oldest' ? dateValue(a.createdAt) - dateValue(b.createdAt) : sort === 'newest' ? dateValue(b.createdAt) - dateValue(a.createdAt) : b.matchScore - a.matchScore);
    return NextResponse.json({ customer, matches: sorted });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to match properties' }, { status: 500 });
  }
}
