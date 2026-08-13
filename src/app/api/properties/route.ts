import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Property from '@/models/Property';
import Customer from '@/models/Customer';
import { rankPropertiesForCustomer } from '@/lib/matching';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const road = searchParams.get('road') || '';
    const facing = searchParams.get('facing') || '';
    const jda = searchParams.get('jda') || '';
    const rera = searchParams.get('rera') || '';
    const customerId = searchParams.get('customerId') || '';

    await connectDB();

    const query: any = {};

    if (search) {
      query.$or = [
        { propertyName: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { societyName: { $regex: search, $options: 'i' } },
        { developerName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (road) query.road = road;
    if (facing) query.facing = facing;
    if (jda) query.jdaApproved = jda === 'true';
    if (rera) query.rera = rera === 'true';

    const properties = await Property.find(query).sort({ createdAt: -1 }).lean();
    if (customerId) {
      const customer = await Customer.findById(customerId).lean();
      if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      return NextResponse.json(rankPropertiesForCustomer(customer as any, properties as any));
    }
    return NextResponse.json(properties);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    const property = await Property.create(body);
    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
