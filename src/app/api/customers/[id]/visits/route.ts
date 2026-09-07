import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import CustomerVisit from '@/models/CustomerVisit';
import Activity from '@/models/Activity';
import Customer from '@/models/Customer';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const visits = await CustomerVisit.find({ customerId: id, userId: session.user.id }).sort({ visitedAt: -1, createdAt: -1 });
    return NextResponse.json(visits);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { propertyId, propertyName, projectName, location, visitedAt, notes } = body;

    if (!propertyId || !propertyName) {
      return NextResponse.json({ error: 'Property is required' }, { status: 400 });
    }

    await connectDB();

    // Verify customer belongs to current user
    const customer = await Customer.findOne({ _id: id, userId: session.user.id });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    try {
      await CustomerVisit.collection.dropIndex('customerId_1_propertyId_1');
    } catch (error: any) {
      if (error?.codeName !== 'IndexNotFound') throw error;
    }

    const visitDate = visitedAt ? new Date(visitedAt) : new Date();
    const visit = await CustomerVisit.create({
      userId: session.user.id,
      customerId: id,
      propertyId,
      propertyName,
      projectName: projectName || '',
      location: location || '',
      actualVisitAt: visitDate,
      visitedAt: visitDate,
      status: 'Completed',
      notes: notes || ''
    });

    await Activity.create({
      userId: session.user.id,
      customerId: id,
      type: 'Site Visit',
      description: `Visited ${projectName || propertyName}${location ? ` in ${location}` : ''}.${notes ? ` Note: ${notes}` : ''}`
    });

    await Customer.updateOne(
      { _id: id, userId: session.user.id, leadStatus: { $nin: ['Sold', 'Lost'] } },
      { leadStatus: 'Site Visit' }
    );

    return NextResponse.json(visit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
