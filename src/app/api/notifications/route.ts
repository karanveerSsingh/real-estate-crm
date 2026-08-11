import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import Notification from '@/models/Notification';
import { createErrorResponse } from '@/lib/apiFallbacks';

async function createBirthdayNotifications() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const customers = await Customer.find({ dateOfBirth: { $ne: null } });

  for (const customer of customers) {
    if (!customer.dateOfBirth) continue;
    const dob = new Date(customer.dateOfBirth);
    const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const birthdayTarget = birthdayThisYear < today ? new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate()) : birthdayThisYear;

    if (birthdayTarget < today || birthdayTarget > inSevenDays) continue;

    const diffDays = Math.round((birthdayTarget.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const title = diffDays === 0
      ? `Birthday Today: ${customer.fullName}`
      : `Upcoming Birthday: ${customer.fullName}`;

    const message = diffDays === 0
      ? `Today is ${customer.fullName}'s birthday.`
      : `${customer.fullName}'s birthday is in ${diffDays} day${diffDays === 1 ? '' : 's'} on ${birthdayTarget.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`;

    const existing = await Notification.findOne({
      type: 'Birthday',
      customerId: customer._id,
      date: birthdayTarget,
    });

    if (existing) continue;

    await Notification.create({
      title,
      message,
      type: 'Birthday',
      customerId: customer._id,
      date: birthdayTarget,
    });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json([], { status: 200 });
    }

    try {
      await connectDB();
      await createBirthdayNotifications();
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
