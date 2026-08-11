'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#060814] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
        <p className="text-gray-400 text-sm font-medium text-[var(--muted)]">Redirecting to system...</p>
      </div>
    </div>
  );
}
