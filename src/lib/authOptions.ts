import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from './db';
import User from '../models/User';

const DEMO_ADMIN = {
  id: 'demo-admin',
  email: 'admin@crm.com',
  name: 'Admin CRM',
  role: 'admin'
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
        email: { label: 'Email', type: 'email', placeholder: 'admin@crm.com' },
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
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: unknown;
          role?: unknown;
        };

        sessionUser.id = token.id;
        sessionUser.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
