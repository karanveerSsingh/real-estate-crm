'use client';

import React, { Suspense, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex transition-all duration-300">
      <div className="hidden md:block"><Sidebar collapsed={collapsed} setCollapsed={setCollapsed} /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative h-full w-64"><Sidebar collapsed={false} setCollapsed={() => {}} onClose={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <div className={`flex-1 flex min-w-0 flex-col transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <Suspense fallback={<div className="h-16 border-b border-[var(--border)] bg-[var(--card)]" />}>
          <Header sidebarCollapsed={collapsed} setSidebarOpen={setMobileOpen} sidebarOpen={mobileOpen} />
        </Suspense>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
