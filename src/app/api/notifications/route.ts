import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { createErrorResponse } from '@/lib/apiFallbacks';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json([], { status: 200 });
    }

    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json([], { status: 200 });
    }
    const notifications = await Notification.find()
      .populate('customerId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(notifications);
  } catch (error: unknown) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json([], { status: 200 });
    }

    const { id, all } = await request.json();
    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    if (all) {
      await Notification.updateMany({ read: false }, { $set: { read: true } });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      const notification = await Notification.findByIdAndUpdate(
        id,
        { $set: { read: true } },
        { new: true }
      );
      return NextResponse.json(notification);
    }

    return NextResponse.json({ error: 'Missing notification ID or "all" flag' }, { status: 400 });
  } catch (error: unknown) {
    return createErrorResponse(error);
  }
}
export async function POST(request: Request) {
  return PUT(request);
}
