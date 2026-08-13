import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*'],
};
