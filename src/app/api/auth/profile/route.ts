import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      brandName: user.brandName || 'Invest with Karanveer',
      profileImage: user.profileImage || '',
      role: user.role
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let name: string | undefined;
    let brandName: string | undefined;
    let profileImageUrl: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = (formData.get('name') as string)?.trim();
      brandName = (formData.get('brandName') as string)?.trim();

      const imageFile = formData.get('profileImage') as File | null;
      if (imageFile && imageFile instanceof File && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        await fs.mkdir(uploadsDir, { recursive: true });

        const cleanFileName = `profile_${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadsDir, cleanFileName);
        await fs.writeFile(filePath, buffer);
        profileImageUrl = `/uploads/avatars/${cleanFileName}`;
      }
    } else {
      const body = await request.json();
      name = typeof body.name === 'string' ? body.name.trim() : undefined;
      brandName = typeof body.brandName === 'string' ? body.brandName.trim() : undefined;
      profileImageUrl = typeof body.profileImage === 'string' ? body.profileImage.trim() : undefined;
    }

    await connectDB();
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (brandName) updateData.brandName = brandName;
    if (profileImageUrl !== undefined) updateData.profileImage = profileImageUrl;

    const user = await User.findByIdAndUpdate(session.user.id, { $set: updateData }, { new: true }).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        brandName: user.brandName,
        profileImage: user.profileImage,
        role: user.role
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
