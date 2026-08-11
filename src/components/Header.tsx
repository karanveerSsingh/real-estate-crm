'use client';
// @refresh reset

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  User, 
  Menu,
  LogOut,
  Cake,
  CalendarDays,
  FileBadge,
  Sparkles
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { playNotificationSound, primeNotificationSound } from '@/lib/notificationSound';

type NotificationType = 'FollowUp' | 'Booking' | 'Registry' | 'System' | 'Birthday';

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  date?: string;
  createdAt?: string;
  customerId?: { _id: string } | string;
};

interface HeaderProps {
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
}

export default function Header({ sidebarCollapsed: _sidebarCollapsed, setSidebarOpen, sidebarOpen }: HeaderProps) {
  void _sidebarCollapsed;
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearchValue = searchParams.get('search') || '';

  // Search input state
  const [searchVal, setSearchVal] = useState('');
  
  // Sync searchVal with URL search param
  useEffect(() => {
    setSearchVal(urlSearchValue);
  }, [urlSearchValue]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/dashboard/leads?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push('/dashboard/leads');
    }
  };

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const knownNotificationIds = useRef<Set<string> | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const data = await res.json();
      const notificationsList = Array.isArray(data) ? data as NotificationItem[] : [];
      const notificationIds = notificationsList.map((notification) => notification._id).filter(Boolean);

      if (knownNotificationIds.current) {
        const newNotifications = notificationsList.filter(
          (notification) => notification._id && !knownNotificationIds.current?.has(notification._id)
        );

        newNotifications.forEach((notification) => {
          void playNotificationSound();
          toast(notification.title || 'New notification', {
            icon: '🔔',
            duration: 5000,
          });
        });
      }

      knownNotificationIds.current = new Set(notificationIds);
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter((n) => !n.read).length);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
      console.error('Failed to fetch notifications', err);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 45 seconds for real-time reminders
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unlockSound = () => {
      void primeNotificationSound();
      window.removeEventListener('pointerdown', unlockSound);
      window.removeEventListener('keydown', unlockSound);
    };

    window.addEventListener('pointerdown', unlockSound);
    window.addEventListener('keydown', unlockSound);
    return () => {
      window.removeEventListener('pointerdown', unlockSound);
      window.removeEventListener('keydown', unlockSound);
    };
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.read) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif._id })
        });
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setShowNotifDropdown(false);
      if (notif.customerId) {
        const customerId = typeof notif.customerId === 'string' ? notif.customerId : notif.customerId._id;
        router.push(`/dashboard/leads/${customerId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Humanize path for breadcrumbs
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview Dashboard';
    if (pathname.startsWith('/dashboard/leads')) {
      if (pathname.includes('/leads/')) return 'Lead Detail Profile';
      return 'Customer Lead Management';
    }
    if (pathname.startsWith('/dashboard/sold')) return 'Sold Property Closed Deals';
    if (pathname.startsWith('/dashboard/inventory')) return 'Property Inventory Catalog';
    if (pathname.startsWith('/dashboard/calendar')) return 'Follow-up Calendar Planner';
    if (pathname.startsWith('/dashboard/settings')) return 'Preferences & Branding';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md transition-all duration-300">
      
      {/* Menu / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="hidden sm:block text-md font-semibold text-[var(--foreground)] truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4 relative">
        <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-[var(--muted)] pointer-events-none" />
        <input
          type="text"
          placeholder="Global Search (Name, Phone, Status, Budget...)"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full pl-10 pr-20 py-2 border rounded-lg text-sm bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] transition-all"
        />
        <button
          type="submit"
          aria-label="Search customer leads"
          className="absolute right-1 top-1 bottom-1 px-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Right side items */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] relative transition-colors cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-30 overflow-hidden flex flex-col max-h-[480px]">
              <div className="p-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]">
                <span className="text-sm font-semibold">Reminders & Alerts</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[var(--muted)] text-sm">
                    No notifications or reminders.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnread = !notif.read;
                    const dateFormatted = new Date(notif.date || notif.createdAt || Date.now()).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[var(--secondary)] ${
                          isUnread ? 'bg-blue-600/5' : ''
                        }`}
                      >
                        {/* Dynamic Notification Icon Type */}
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          notif.type === 'FollowUp' ? 'bg-amber-500/10 text-amber-500' :
                          notif.type === 'Booking' ? 'bg-green-500/10 text-green-500' :
                          notif.type === 'Registry' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {notif.type === 'Birthday' ? <Cake className="h-4 w-4" /> :
                           notif.type === 'FollowUp' ? <CalendarDays className="h-4 w-4" /> :
                           notif.type === 'Registry' ? <FileBadge className="h-4 w-4" /> :
                           <Sparkles className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold uppercase text-[var(--muted)]">
                              {notif.type}
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">
                              {dateFormatted}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold truncate text-[var(--foreground)]">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-2 border-t border-[var(--border)] text-center bg-[var(--background)]">
                <Link 
                  href="/dashboard/calendar" 
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-medium inline-block py-1 cursor-pointer"
                  onClick={() => setShowNotifDropdown(false)}
                >
                  View calendar schedule &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown info */}
        <div className="relative flex items-center gap-2 border-l pl-3 border-[var(--border)]" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0"
            aria-label="Open user menu"
          >
            <User className="h-4 w-4" />
          </button>

          <div className="hidden lg:block text-left select-none">
            <p className="text-xs font-bold leading-3 text-[var(--foreground)] truncate max-w-[100px]">
              {session?.user?.name || 'Admin User'}
            </p>
            <span className="text-[10px] font-medium text-[var(--muted)]">
              System Admin
            </span>
          </div>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-[var(--muted)]">System Admin</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[var(--secondary)] transition-colors text-sm text-[var(--foreground)]"
              >
                {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  void signOut({ callbackUrl: '/login' });
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5  text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-150 cursor-pointer text-left"
              >
                <LogOut className="text-red-500  h-4.5 w-4.5" />
                <span className="text-red-500 ">Logout</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  void signOut({ callbackUrl: '/login' });
                }}
                className="w-full lg:hidden flex items-center gap-2 px-4 py-3 hover:bg-[var(--secondary)] transition-colors text-sm text-[var(--foreground)]"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
