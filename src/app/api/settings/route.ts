import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    let settings = await Setting.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = await Setting.create({
        companyName: 'Apex Real Estate',
        logoUrl: '',
        officeAddress: '123 Business Park, Tonk Road, Jaipur',
        phone: '+919876543210',
        whatsApp: '+919876543210',
        email: 'info@apexrealestate.com',
        theme: 'dark',
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    let settings = await Setting.findOne();
    if (settings) {
      settings = await Setting.findByIdAndUpdate(settings._id, body, { new: true });
    } else {
      settings = await Setting.create(body);
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(request: Request) {
  return PUT(request);
}
