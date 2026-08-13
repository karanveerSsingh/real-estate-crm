import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import Property from '@/models/Property';
import { escapeRegex, matchLeadForProperty, matchingBudgetOptions } from '@/lib/matching';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await getServerSession(authOptions)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const tolerance = new URL(request.url).searchParams.get('tolerance') !== 'strict';
    await connectDB();
    const property = await Property.findById(id).lean();
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    const locations = [property.location, property.road].filter(Boolean);
    const locationClauses = locations.map((value) => ({ preferredLocations: { $regex: escapeRegex(value), $options: 'i' } }));
    const budgets = matchingBudgetOptions(property.price, tolerance);
    const candidates = await Customer.find({ leadStatus: { $nin: ['Sold', 'Lost'] }, $or: [...locationClauses, { budget: { $in: budgets } }] }).lean().limit(200);
    const matches = candidates.map((customer) => matchLeadForProperty(customer, property, tolerance)).filter((match): match is NonNullable<typeof match> => Boolean(match)).sort((a, b) => b.matchScore - a.matchScore);
    return NextResponse.json({ property, matches });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to match customers' }, { status: 500 });
  }
}
