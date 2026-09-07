import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

const validateEmail = (email: unknown) => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let email = '';
    let password = '';
    let brandName = '';
    let role = 'admin';
    let profileImageUrl = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = (formData.get('name') as string)?.trim() || '';
      email = (formData.get('email') as string)?.toLowerCase().trim() || '';
      password = (formData.get('password') as string) || '';
      brandName = (formData.get('brandName') as string)?.trim() || '';
      role = (formData.get('role') as string)?.trim() || 'admin';

      const file = formData.get('profileImage') as File | null;
      if (file && file instanceof File && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        await fs.mkdir(uploadsDir, { recursive: true });

        const cleanFileName = `profile_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadsDir, cleanFileName);
        await fs.writeFile(filePath, buffer);
        profileImageUrl = `/uploads/avatars/${cleanFileName}`;
      }
    } else {
      const body = await request.json();
      name = typeof body.name === 'string' ? body.name.trim() : '';
      email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
      password = typeof body.password === 'string' ? body.password : '';
      brandName = typeof body.brandName === 'string' ? body.brandName.trim() : '';
      role = typeof body.role === 'string' && body.role ? body.role : 'admin';
      profileImageUrl = typeof body.profileImage === 'string' ? body.profileImage.trim() : '';
    }

    if (!name || !email || !password || !brandName) {
      return NextResponse.json(
        { success: false, message: 'Name, email, password, and Page/Brand Name are required.' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      brandName,
      profileImage: profileImageUrl,
      role: role || 'admin',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully.',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          brandName: newUser.brandName,
          profileImage: newUser.profileImage,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[register] error', error);
    return NextResponse.json(
      { success: false, message: 'Unable to create account at this time.' },
      { status: 500 }
    );
  }
}
