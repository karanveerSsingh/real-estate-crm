import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import EventShare from '@/models/EventShare';
import { z } from 'zod';

const shareSchema = z.object({
  customerIds: z.array(z.string()).min(1, 'Select at least one customer.'),
  platforms: z.array(z.enum(['whatsapp', 'facebook', 'instagram', 'linkedin', 'x', 'other'])).min(1, 'Select at least one platform.'),
  message: z.string().trim().min(1, 'Write a message before sharing.').max(4000, 'Message must be 4,000 characters or fewer.'),
  files: z.array(z.object({ name: z.string().min(1), url: z.string().url(), mimeType: z.string().min(1), size: z.number().nonnegative() })).default([]),
});

export async function POST(request: Request) {
  try {
    if (!await getServerSession(authOptions)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = shareSchema.parse(await request.json());
    await connectDB();
    const customers = await Customer.find({ _id: { $in: payload.customerIds } }).select('_id fullName whatsAppNumber');
    if (customers.length !== new Set(payload.customerIds).size) return NextResponse.json({ error: 'One or more selected customers no longer exist.' }, { status: 400 });
    const eventShare = await EventShare.create({ ...payload, status: 'ready' });
    return NextResponse.json({ shareId: eventShare._id, customers }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || 'Invalid share request.' }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to prepare share' }, { status: 500 });
  }
}

const updateStatusSchema = z.object({
  shareId: z.string().min(1),
  status: z.enum(['opened', 'failed']),
});

export async function PATCH(request: Request) {
  try {
    if (!await getServerSession(authOptions)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { shareId, status } = updateStatusSchema.parse(await request.json());
    await connectDB();
    const eventShare = await EventShare.findByIdAndUpdate(shareId, { $set: { status } }, { new: true });
    if (!eventShare) return NextResponse.json({ error: 'Share record not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || 'Invalid share update.' }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update share status' }, { status: 500 });
  }
}
