import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

const validateEmail = (email: unknown) => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateRole = (role: unknown) => {
  return typeof role === 'string' && ['admin', 'sales', 'manager'].includes(role);
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = typeof body.role === 'string' ? body.role : '';

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
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

    if (!validateRole(role)) {
      return NextResponse.json(
        { success: false, message: 'Please select a valid role.' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return NextResponse.json({ success: true, message: 'Account created successfully' }, { status: 201 });
  } catch (error) {
    console.error('[register] error', error);
    return NextResponse.json(
      { success: false, message: 'Unable to create account at this time.' },
      { status: 500 }
    );
  }
}
