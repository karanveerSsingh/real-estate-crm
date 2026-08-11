import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import Activity from '@/models/Activity';
import { z } from 'zod';
import { PURPOSE_OPTIONS } from '@/lib/crmOptions';
import { createErrorResponse } from '@/lib/apiFallbacks';

const customerValidator = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  whatsAppNumber: z.string().min(10, 'WhatsApp number must be at least 10 digits'),
  purpose: z.enum(PURPOSE_OPTIONS),
  budget: z.string().min(1, 'Budget is required'),
  preferredLocations: z.array(z.string().min(1)).default([]),
  leadSource: z.enum(['Instagram', 'Facebook', 'Website', 'Reference', 'Magicbricks', '99acres', 'Housing', 'Walk-in', 'Cold Calling', 'Other']),
  leadStatus: z.enum(['New', 'Contacted', 'Follow-up', 'Interested', 'Site Visit', 'Negotiation', 'Booked', 'Sold', 'Lost']).default('New'),
  notes: z.string().optional().default(''),
  requirement: z.string().optional().default(''),
  dateOfBirth: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const purpose = searchParams.get('purpose') || '';
    const budget = searchParams.get('budget') || '';
    const leadSource = searchParams.get('leadSource') || '';
    const leadStatus = searchParams.get('leadStatus') || '';
    const locationStr = searchParams.get('location') || ''; // comma separated or single
    const startDateStr = searchParams.get('startDate') || '';
    const endDateStr = searchParams.get('endDate') || '';

    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json([], { status: 200 });
    }

    const query: any = {};

    // Global Search across multiple fields
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { whatsAppNumber: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
        { budget: { $regex: search, $options: 'i' } },
        { leadSource: { $regex: search, $options: 'i' } },
        { leadStatus: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { requirement: { $regex: search, $options: 'i' } },
        { preferredLocations: { $regex: search, $options: 'i' } }
      ];
    }

    // Specific Filters
    if (purpose) query.purpose = purpose;
    if (budget) query.budget = budget;
    if (leadSource) query.leadSource = leadSource;
    if (leadStatus) query.leadStatus = leadStatus;

    if (locationStr) {
      const locations = locationStr.split(',').map(l => l.trim()).filter(Boolean);
      if (locations.length > 0) {
        query.preferredLocations = { $in: locations };
      }
    }

    // Date Range Filter
    if (startDateStr || endDateStr) {
      query.createdAt = {};
      if (startDateStr) {
        query.createdAt.$gte = new Date(startDateStr);
      }
      if (endDateStr) {
        // Extend to end of that day
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    return NextResponse.json(customers);
  } catch (error: unknown) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate inputs
    const validated = customerValidator.parse(body);

    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Create Customer
    const customer = await Customer.create({
      ...validated,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null
    });

    // Log Activity
    await Activity.create({
      customerId: customer._id,
      type: 'Lead Created',
      description: `Lead created for ${customer.fullName} from source ${customer.leadSource}.`
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return createErrorResponse(error);
  }
}
