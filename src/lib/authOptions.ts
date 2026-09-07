import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from './db';
import User from '../models/User';

const DEMO_ADMIN = {
  id: 'demo-admin',
  email: 'admin123@gmail.com',
  name: 'Admin CRM',
  role: 'admin',
  brandName: 'Invest with Karanveer',
  profileImage: '/investWithKaranveer.jpeg'
};

function canUseDemoAdminFallback(credentials: Record<'email' | 'password', string>) {
  return (
    process.env.NODE_ENV !== 'production' &&
    credentials.email.toLowerCase() === DEMO_ADMIN.email &&
    credentials.password === 'admin123'
  );
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin123@gmail.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide both email and password');
        }

        try {
          await connectDB();
        } catch {
          if (canUseDemoAdminFallback(credentials)) {
            console.warn('MongoDB unavailable. Using local demo admin fallback for credentials auth.');
            return DEMO_ADMIN;
          }

          throw new Error('Database unavailable. Start MongoDB, then try signing in again.');
        }

        // Find the user in the database
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          if (canUseDemoAdminFallback(credentials)) {
            console.warn('User not found in database. Using local demo admin fallback.');
            return DEMO_ADMIN;
          }
          throw new Error('Invalid email or password');
        }

        // Verify the password
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          if (canUseDemoAdminFallback(credentials)) {
            console.warn('Password mismatch. Using local demo admin fallback.');
            return DEMO_ADMIN;
          }
          throw new Error('Invalid email or password');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || 'admin',
          brandName: user.brandName || 'Invest with',
          profileImage: user.profileImage || ''
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.brandName = (user as any).brandName;
        token.profileImage = (user as any).profileImage;
      }
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.brandName) token.brandName = session.brandName;
        if (session.profileImage) token.profileImage = session.profileImage;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.brandName = token.brandName as string;
        session.user.profileImage = token.profileImage as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
