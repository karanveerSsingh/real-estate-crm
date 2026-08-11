import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import FollowUp from '@/models/FollowUp';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const followUps = await FollowUp.find({ customerId: id }).sort({ date: -1, time: -1 });
    return NextResponse.json(followUps);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, date, time, remark, priority } = body;

    if (!title || !date || !time) {
      return NextResponse.json({ error: 'Title, date, and time are required' }, { status: 400 });
    }

    await connectDB();

    // Create the Follow-up
    const followUp = await FollowUp.create({
      customerId: id,
      title,
      date: new Date(date),
      time,
      remark,
      priority,
      status: 'Pending'
    });

    // Log Activity
    await Activity.create({
      customerId: id,
      type: 'Called',
      description: `Scheduled follow-up: "${title}" for ${date} at ${time}.`
    });

    // Add In-App Notification
    await Notification.create({
      title: 'Follow-up Scheduled',
      message: `Follow-up "${title}" scheduled for ${date} at ${time} (Priority: ${priority}).`,
      type: 'FollowUp',
      customerId: id,
      date: new Date(date)
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const { followUpId, status, title, date, time, remark, priority } = body;

    if (!followUpId) {
      return NextResponse.json({ error: 'FollowUp ID is required' }, { status: 400 });
    }

    await connectDB();

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (title) updateFields.title = title;
    if (date) updateFields.date = new Date(date);
    if (time) updateFields.time = time;
    if (remark) updateFields.remark = remark;
    if (priority) updateFields.priority = priority;

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: followUpId, customerId: id },
      { $set: updateFields },
      { new: true }
    );

    if (!followUp) {
      return NextResponse.json({ error: 'FollowUp not found' }, { status: 404 });
    }

    // Log complete activity
    if (status === 'Completed') {
      await Activity.create({
        customerId: id,
        type: 'Follow-up Done',
        description: `Completed follow-up task: "${followUp.title}".`
      });
    }

    return NextResponse.json(followUp);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
