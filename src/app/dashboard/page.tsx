"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  TrendingUp,
  CircleDollarSign,
  FolderLock,
  CalendarClock,
  CalendarDays,
  AlertTriangle,
  Building,
  CheckCircle,
  FileCheck2,
  BellRing,
  ArrowUpRight,
  Clock,
  Sparkles,
  PhoneCall,
  Loader2,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import Link from "next/link";
import toast from "react-hot-toast";
import OverdueFollowupsModal from "@/components/OverdueFollowupsModal";
import { formatINR } from "@/lib/crmOptions";

export default function DashboardHome() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  // Automatic dashboard polling is disabled. Data still loads when this page opens.
  // useEffect(() => {
  //   const interval = setInterval(fetchDashboardData, 300000);
  //   return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
    const refreshOverdueCount = async () => {
      try {
        const res = await fetch("/api/followups/overdue?countOnly=true");
        if (res.ok) {
          const { total } = await res.json();
          setData((prev: any) =>
            prev
              ? { ...prev, stats: { ...prev.stats, overdueFollowups: total } }
              : prev,
          );
        }
      } catch {
        // silent refresh failure
      }
    };

    const interval = setInterval(refreshOverdueCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const payload = await res.json();
        setData(payload);

        // Show reminder popup if there are overdue or today followups
        const hasUrgent =
          payload.stats.overdueFollowups > 0 ||
          payload.stats.todayFollowups > 0;
        if (hasUrgent && !sessionStorage.getItem("reminderDismissed")) {
          setShowReminderPopup(true);
        }
      } else {
        toast.error("Failed to load dashboard metrics");
      }
    } catch (err) {
      toast.error("Network error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const dismissReminder = () => {
    setShowReminderPopup(false);
    sessionStorage.setItem("reminderDismissed", "true");
  };

  const handleOverdueCountChange = (count: number) => {
    setData((prev: any) =>
      prev
        ? { ...prev, stats: { ...prev.stats, overdueFollowups: count } }
        : prev,
    );
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <span className="text-sm text-[var(--muted)]">
          Gathering real-time CRM intelligence...
        </span>
      </div>
    );
  }

  const { stats, widgets, graphs } = data;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return (
    <div className="space-y-6">
      {/* 0. Header & Event Live Hot Sale Property or Up Comming Projects */}
      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/5 p-4 rounded-xl border border-blue-500/10"></div> */}

      {/* 1. Header & Quick Message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/5 p-4 rounded-xl border border-blue-500/10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Welcome back, Administrator
            {/* <Sparkles className="h-4.5 w-4.5 text-yellow-500 animate-spin" /> */}
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Your real estate sales funnel has generated{" "}
            <span className="font-semibold text-blue-500">
              {stats.totalSales} deals
            </span>{" "}
            closed and {formatINR(stats.totalRevenue)} in revenue.
          </p>
        </div>
        <div className="flex gap-2">
          {stats.overdueFollowups > 0 && (
            <button
              type="button"
              onClick={() => setShowOverdueModal(true)}
              className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-semibold rounded-lg flex items-center gap-1 border border-red-500/20 animate-pulse hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {stats.overdueFollowups} Overdue Follow-up
              {stats.overdueFollowups === 1 ? "" : "s"}!
            </button>
          )}
        </div>
      </div>

      {/* 2. CORE STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads Card */}
        <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase">
                Total Lead Pool
              </span>
              <h3 className="text-2xl font-bold">{stats.totalLeads}</h3>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-3 flex items-center gap-2">
            <span className="text-green-500 font-semibold flex items-center gap-0.5">
              <UserPlus className="h-3 w-3" />
              {stats.newLeads}
            </span>{" "}
            New Leads
            <span className="text-indigo-500 font-semibold">
              {stats.interestedLeads}
            </span>{" "}
            Interested
          </div>
        </div>

        {/* Today's customer visits */}
        <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase">
                Today&apos;s Customer Visits
              </span>
              <h3 className="text-2xl font-bold">
                <span className="text-green-500">
                  {stats.todayCompletedVisits} Completed
                </span>{" "}
                /{" "}
                <span className="text-amber-500">
                  {stats.todayPendingVisits} Pending
                </span>
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <Building className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-3 flex items-center gap-1">
            <span className="font-semibold text-blue-500">
              {stats.todayPlannedVisits} planned visits
            </span>{" "}
            scheduled for today
          </div>
        </div>

        {/* Revenue Card */}
        <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase">
                Gross Revenue closed
              </span>
              <h3 className="text-2xl font-bold">
                {formatINR(stats.totalRevenue)}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-3 flex items-center gap-1.5">
            Booking values:{" "}
            <span className="font-semibold text-indigo-400">
              {formatINR(stats.totalBookings)}
            </span>{" "}
            ({stats.totalSales} deals)
          </div>
        </div>

        {/* Reminders Card */}
        <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase">
                Follow-up schedule
              </span>
              <h3 className="text-2xl font-bold">
                {stats.todayFollowups} Today
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-3 flex items-center gap-2">
            <span className="text-amber-500 font-semibold">
              {stats.tomorrowFollowups} Tomorrow
            </span>
            {stats.overdueFollowups > 0 && (
              <button
                type="button"
                onClick={() => setShowOverdueModal(true)}
                className="text-red-500 font-semibold hover:underline cursor-pointer"
              >
                {stats.overdueFollowups} Overdue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. RECHARTS GRAPHS PANEL */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Leads (Area Chart) */}
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">
              Monthly Lead Velocity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphs.monthlyLeads}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} />
                  <YAxis stroke="var(--muted)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Leads"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Sales (Bar Chart) */}
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">
              Monthly Closed Sales Volume (₹)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphs.monthlySales}>
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} />
                  <YAxis
                    stroke="var(--muted)"
                    fontSize={10}
                    tickFormatter={formatINR}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                    formatter={(value: unknown) => [
                      formatINR(
                        Number(Array.isArray(value) ? value[0] : value),
                      ),
                      "Closed Sales",
                    ]}
                  />
                  <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Location Wise Leads */}
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">
              Preferred Location Heatmap
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphs.locationWiseLeads} layout="vertical">
                  <XAxis type="number" stroke="var(--muted)" fontSize={10} />
                  <YAxis
                    dataKey="location"
                    type="category"
                    stroke="var(--muted)"
                    fontSize={10}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="Leads" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. DASHBOARD WIDGETS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget 1: Pending & Overdue Follow-ups */}
        <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--border)] mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Follow-ups
            </h4>
            <Link
              href="/dashboard/calendar"
              className="text-xs text-blue-500 hover:underline"
            >
              View Calendar
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {widgets.pendingFollowups.length === 0 ? (
              <div className="text-center text-xs text-[var(--muted)] py-12">
                All follow-ups complete!
              </div>
            ) : (
              widgets.pendingFollowups.map((task: any) => {
                const date = new Date(task.date);
                const isOverdue =
                  date <
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    new Date().getDate(),
                  );

                return (
                  <div
                    key={task._id}
                    className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg flex items-start gap-2.5"
                  >
                    <div
                      className={`p-1 rounded shrink-0 ${
                        task.priority === "High"
                          ? "bg-red-500/10 text-red-500"
                          : task.priority === "Medium"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {task.title}
                      </h5>
                      <p className="text-[10px] text-[var(--muted)] truncate">
                        Client: {task.customerId?.fullName || "Unknown"} |{" "}
                        {task.customerId?.mobileNumber || ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            isOverdue
                              ? "bg-red-500/10 text-red-500 font-bold"
                              : "bg-slate-500/10 text-[var(--muted)]"
                          }`}
                        >
                          {new Date(task.date).toLocaleDateString()} at{" "}
                          {task.time}
                        </span>
                        {isOverdue && (
                          <span className="text-[9px] text-red-500 font-semibold animate-pulse">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Widget 2: Recent Activity Timeline Log */}
        <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--border)] mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <BellRing className="h-4 w-4 text-blue-500" /> Recent Activity
              Timeline
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pl-2">
            {widgets.recentActivities.length === 0 ? (
              <div className="text-center text-xs text-[var(--muted)] py-12">
                No activity logs found.
              </div>
            ) : (
              widgets.recentActivities.map((act: any) => {
                const dateFormatted = new Date(
                  act.timestamp,
                ).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={act._id}
                    className="relative pl-4 border-l border-blue-500/20 last:border-0 pb-1.5"
                  >
                    <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-[var(--card)]" />
                    <div className="text-xs">
                      <span className="font-semibold">
                        {act.customerId?.fullName || "System"}
                      </span>
                      <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1 py-0.2 rounded ml-2 font-medium">
                        {act.type}
                      </span>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        {act.description}
                      </p>
                      <span className="text-[9px] text-[var(--muted)] block mt-0.5">
                        {dateFormatted}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Widget 3: Recently Sold & High Priority Leads */}
        <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--border)] mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-green-500" /> Recently Closed
              Sales
            </h4>
            <Link
              href="/dashboard/sold"
              className="text-xs text-green-500 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {widgets.recentlySold.length === 0 ? (
              <div className="text-center text-xs text-[var(--muted)] py-12">
                No sales records yet.
              </div>
            ) : (
              widgets.recentlySold.map((deal: any) => (
                <div
                  key={deal._id}
                  className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-[var(--foreground)] truncate">
                      {deal.customerName}
                    </h5>
                    <p className="text-[10px] text-[var(--muted)] truncate">
                      {deal.projectName} | {deal.location}
                    </p>
                    <span className="text-[9px] text-green-500 bg-green-500/10 px-1 rounded font-semibold mt-1 inline-block">
                      Amount: {formatINR(deal.totalAmount)}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/leads/${deal.customerId}`}
                    className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0 cursor-pointer"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. POPUP REMINDER MODAL (ON LOGIN / FRESH ENTRY) */}
      {showReminderPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={dismissReminder}
          />

          <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={dismissReminder}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)] mb-4 text-amber-500">
              <BellRing className="h-6 w-6 animate-bounce" />
              <div>
                <h3 className="text-md font-bold text-[var(--foreground)]">
                  Urgent Reminders
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  You have pending items requiring immediate attention today.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Overdue alerts */}
              {stats.overdueFollowups > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Missed / Overdue
                      Follow-ups ({stats.overdueFollowups})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        dismissReminder();
                        setShowOverdueModal(true);
                      }}
                      className="text-[10px] font-semibold text-blue-500 hover:underline cursor-pointer"
                    >
                      View all
                    </button>
                  </div>

                  <div className="space-y-2">
                    {widgets.pendingFollowups
                      .filter((f: any) => new Date(f.date) < startOfToday)
                      .slice(0, 3)
                      .map((task: any) => (
                        <div
                          key={task._id}
                          className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex justify-between items-center"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {task.title}
                            </p>
                            <p className="text-[10px] text-[var(--muted)] mt-0.5">
                              Client: {task.customerId?.fullName || "Unknown"}
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/leads/${task.customerId?._id || task.customerId}`}
                            className="text-[11px] font-semibold text-blue-500 hover:underline shrink-0 pl-2"
                            onClick={dismissReminder}
                          >
                            Open Profile
                          </Link>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Today's follow-ups */}
              {stats.todayFollowups > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> Scheduled for Today
                    ({stats.todayFollowups})
                  </span>

                  <div className="space-y-2">
                    {widgets.pendingFollowups
                      .filter((f: any) => {
                        const d = new Date(f.date);
                        return d >= startOfToday && d <= endOfToday;
                      })
                      .slice(0, 3)
                      .map((task: any) => (
                        <div
                          key={task._id}
                          className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex justify-between items-center"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {task.title}
                            </p>
                            <p className="text-[10px] text-[var(--muted)] mt-0.5">
                              Time: {task.time} | Client:{" "}
                              {task.customerId?.fullName || "Unknown"}
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/leads/${task.customerId?._id || task.customerId}`}
                            className="text-[11px] font-semibold text-blue-500 hover:underline shrink-0 pl-2"
                            onClick={dismissReminder}
                          >
                            Open Profile
                          </Link>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] text-right">
              <button
                onClick={dismissReminder}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <OverdueFollowupsModal
        open={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        onCountChange={handleOverdueCountChange}
      />
    </div>
  );
}
