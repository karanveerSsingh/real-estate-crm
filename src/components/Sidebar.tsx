'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Users, 
  HandCoins, 
  Building2, 
  Calendar, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onClose?: () => void;
}

export default function Sidebar({ collapsed, setCollapsed, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customer Leads', path: '/dashboard/leads', icon: Users },
    { name: 'Sold Customers', path: '/dashboard/sold', icon: HandCoins },
    { name: 'Property Inventory', path: '/dashboard/inventory', icon: Building2 },
    { name: 'Follow-up Calendar', path: '/dashboard/calendar', icon: Calendar },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 z-20 h-screen border-r transition-all duration-300 flex flex-col bg-[var(--sidebar)] border-[var(--sidebar-border)] ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--sidebar-border)]">
        {!collapsed ? (
          <div className="flex items-center gap-2 font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            {/* <Sparkles className="h-5 w-5 text-blue-500" /> */}
            <span>Invest with Karanveer</span>
          </div>
        ) 
        : (
          <div className="mx-auto text-blue-500">
            {/* <Sparkles className="h-6 w-6" /> */}
          </div>
        )
        }
        
        {/* Collapse Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center p-1 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-500 border-l-4 border-blue-600 pl-2' 
                  : 'text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
              }`}
              onClick={() => onClose && onClose()}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-500' : ''}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Log Out */}
      <div className="p-2 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)]">
        <button
          onClick={() => {
            if (onClose) onClose();
            signOut({ callbackUrl: '/login' });
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-150 cursor-pointer text-left"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
