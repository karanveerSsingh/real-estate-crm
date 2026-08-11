import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import FollowUp from '@/models/FollowUp';
import SoldCustomer from '@/models/SoldCustomer';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';
import { z } from 'zod';
import { PURPOSE_OPTIONS } from '@/lib/crmOptions';
import { createErrorResponse } from '@/lib/apiFallbacks';

const customerUpdateValidator = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
  whatsAppNumber: z.string().min(10, 'WhatsApp number must be at least 10 digits').optional(),
  purpose: z.enum(PURPOSE_OPTIONS).optional(),
  budget: z.string().min(1, 'Budget is required').optional(),
  preferredLocations: z.array(z.string().min(1)).optional(),
  leadSource: z.enum(['Instagram', 'Facebook', 'Website', 'Reference', 'Magicbricks', '99acres', 'Housing', 'Walk-in', 'Cold Calling', 'Other']).optional(),
  leadStatus: z.enum(['New', 'Contacted', 'Follow-up', 'Interested', 'Site Visit', 'Negotiation', 'Booked', 'Sold', 'Lost']).optional(),
  notes: z.string().optional(),
  requirement: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: unknown) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate inputs
    const validated = customerUpdateValidator.parse(body);

    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const oldCustomer = await Customer.findById(id);
    if (!oldCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check if status changed to log activity
    const statusChanged = validated.leadStatus && validated.leadStatus !== oldCustomer.leadStatus;

    const updateData = {
      ...validated,
      dateOfBirth: validated.dateOfBirth === undefined
        ? oldCustomer.dateOfBirth
        : (validated.dateOfBirth ? new Date(validated.dateOfBirth) : null)
    };
    Object.assign(oldCustomer, updateData);
    await oldCustomer.save(); // This triggers calculateLeadScore hook!

    // If status changed, log it in Timeline
    if (statusChanged) {
      await Activity.create({
        customerId: id,
        type: validated.leadStatus === 'Sold' ? 'Sold' : validated.leadStatus === 'Booked' ? 'Booked' : 'Negotiation',
        description: `Lead status changed from ${oldCustomer.leadStatus} to ${validated.leadStatus}.`
      });
    }

    // If notes changed, log a note added activity
    if (validated.notes && validated.notes !== oldCustomer.notes) {
      await Activity.create({
        customerId: id,
        type: 'Note Added',
        description: `Admin updated customer notes.`
      });
    }

    return NextResponse.json(oldCustomer);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return createErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Cascade delete associated records
    await FollowUp.deleteMany({ customerId: id });
    await Activity.deleteMany({ customerId: id });
    await SoldCustomer.deleteMany({ customerId: id });
    await Notification.deleteMany({ customerId: id });

    return NextResponse.json({ message: 'Customer and all associated data deleted successfully' });
  } catch (error: unknown) {
    return createErrorResponse(error);
  }
}
