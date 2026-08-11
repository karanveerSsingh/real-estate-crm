'use client';

import React, { Suspense, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex transition-all duration-300">
      
      {/* Sidebar Navigation */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-64 h-full">
            <Sidebar collapsed={false} setCollapsed={() => {}} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <Suspense fallback={<div className="h-16 border-b border-[var(--border)] bg-[var(--card)]" />}>
          <Header 
            sidebarCollapsed={collapsed} 
            setSidebarOpen={setMobileOpen} 
            sidebarOpen={mobileOpen} 
          />
        </Suspense>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
