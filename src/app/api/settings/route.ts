import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();
    
    let user = await User.findById(userId);
    let settings = await Setting.findOne({ userId });

    if (!settings) {
      settings = await Setting.create({
        userId,
        companyName: user?.brandName || session.user.brandName || 'Invest with Karanveer',
        logoUrl: user?.profileImage || '',
        officeAddress: '123 Business Park, Tonk Road, Jaipur',
        phone: '+919876543210',
        whatsApp: '+919876543210',
        email: user?.email || session.user.email || 'info@crm.com',
        theme: 'dark',
      });
    }

    return NextResponse.json({
      ...settings.toObject(),
      companyName: user?.brandName || settings.companyName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    await connectDB();

    let settings = await Setting.findOne({ userId });
    if (settings) {
      settings = await Setting.findOneAndUpdate({ userId }, body, { new: true });
    } else {
      settings = await Setting.create({ ...body, userId });
    }

    if (body.companyName) {
      await User.findByIdAndUpdate(userId, { $set: { brandName: body.companyName.trim() } });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
