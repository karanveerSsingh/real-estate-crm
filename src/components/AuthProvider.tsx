'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Keep browser authentication requests on this deployment's origin. This also
  // prevents a malformed NEXTAUTH_URL deployment variable from making the
  // client wait forever while it tries to restore a session from another URL.
  return <SessionProvider basePath="/api/auth">{children}</SessionProvider>;
}
