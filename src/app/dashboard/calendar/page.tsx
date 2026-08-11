'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Check, 
  Phone, 
  MessageSquare, 
  Loader2, 
  Sparkles,
  Clock,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CalendarPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar dates state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Quick schedule form states
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newRemark, setNewRemark] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    fetchFollowups();
    fetchCustomers();
  }, []);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      // We can fetch all followups
      const res = await fetch('/api/dashboard'); // dashboard payload has pending followups, but let's query customers to pull all followups.
      // Wait, let's write a quick client helper. Since we want to display all followups for all customers, we can hit `/api/customers` and then aggregate their followups, or we can fetch a combined list.
      // Wait! We can hit a specific endpoint or write a quick loop. We know `/api/dashboard` returns widgets.pendingFollowups which contains a list. But for a calendar, we want both completed and pending followups.
      // Let's check: can we retrieve followups from a combined query?
      // Let's fetch all customers and pull all followups for each customer, or query `/api/customers` then query followups.
      // Let's implement an aggregation. Let's fetch all customers. Then, for each customer, fetch their followups.
      // Actually, let's look at a simpler, more robust way: we can fetch all followups directly by hitting the DB.
      // Since we don't have a global `/api/followups` endpoint, let's check: can we fetch all customer followups?
      // Yes! Let's write a simple helper route or just query `/api/customers` and fetch follow-ups in a `Promise.all` loop.
      // Wait, we can fetch all customers. If we loop and fetch `/api/customers/[id]/followups`, it will fetch all followups. Since there are only a few customers in seed, that is fine.
      // But wait! Is there a more performant way? Let's check: we can fetch all customers, and since we already have the customer list, let's fetch follow-ups for all of them.
      const resCust = await fetch('/api/customers');
      if (resCust.ok) {
        const custList = await resCust.json();
        setCustomers(custList);

        // Fetch followups for all customers in parallel
        const followupsPromises = custList.map(async (c: any) => {
          const resF = await fetch(`/api/customers/${c._id}/followups`);
          if (resF.ok) {
            const dataF = await resF.json();
            // Attach customer name to each followup
            return dataF.map((f: any) => ({ ...f, customerName: c.fullName, mobileNumber: c.mobileNumber, whatsAppNumber: c.whatsAppNumber }));
          }
          return [];
        });

        const nestedFollowups = await Promise.all(followupsPromises);
        const flatFollowups = nestedFollowups.flat();
        setFollowups(flatFollowups);
      }
    } catch (err) {
      toast.error('Error fetching calendar schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const list = await res.json();
        // Filter out Sold or Lost if we don't want to schedule followups for them, but keep them for selection
        setCustomers(list.filter((c: any) => c.leadStatus !== 'Sold'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newTitle.trim() || !newTime) {
      toast.error('Please select customer, title and time');
      return;
    }

    try {
      setScheduling(true);
      const dateString = selectedDate.toISOString().split('T')[0];

      const res = await fetch(`/api/customers/${selectedCustomer}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          date: dateString,
          time: newTime,
          remark: newRemark.trim(),
          priority: newPriority
        })
      });

      if (res.ok) {
        toast.success('Follow-up scheduled on calendar');
        setNewTitle('');
        setNewRemark('');
        fetchFollowups();
      } else {
        toast.error('Failed to schedule follow-up');
      }
    } catch (err) {
      toast.error('Error booking task');
    } finally {
      setScheduling(false);
    }
  };

  const handleCompleteFollowup = async (customerId: string, fId: string) => {
    try {
      const res = await fetch(`/api/customers/${customerId}/followups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUpId: fId,
          status: 'Completed'
        })
      });

      if (res.ok) {
        toast.success('Task completed');
        fetchFollowups();
      } else {
        toast.error('Failed to complete task');
      }
    } catch (err) {
      toast.error('Error completing task');
    }
  };

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Week navigation helpers
  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  // Generate days array for Month View
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const lastDate = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Padding for previous month days
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i + 1),
        currentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true
      });
    }

    // Padding for next month days to complete grid (multiples of 7)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false
      });
    }

    return days;
  };

  // Generate days array for Week View
  const getDaysInWeek = () => {
    const days = [];
    const temp = new Date(currentDate);
    const dayOfWeek = temp.getDay();
    
    // Set to starting Sunday of that week
    temp.setDate(temp.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      days.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }
    return days;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getFollowupsForDay = (date: Date) => {
    return followups.filter(f => isSameDay(new Date(f.date), date));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDayFollowups = getFollowupsForDay(selectedDate);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Follow-up Schedule Calendar <CalendarIcon className="h-4.5 w-4.5 text-blue-500" />
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Monitor calling schedules, site visit targets, and book direct client follow-ups.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              viewMode === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-[var(--secondary)] text-[var(--muted)]'
            }`}
          >
            Month View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              viewMode === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-[var(--secondary)] text-[var(--muted)]'
            }`}
          >
            Week View
          </button>
        </div>
      </div>

      {/* CALENDAR BODY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Grid Pane */}
        <div className="lg:col-span-8 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm space-y-4">
          
          {/* Navigation bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              {viewMode === 'month' 
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }
            </h3>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={viewMode === 'month' ? prevMonth : prevWeek}
                className="p-1.5 border border-[var(--border)] hover:bg-[var(--secondary)] rounded-lg cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                className="px-2.5 py-1.5 border border-[var(--border)] hover:bg-[var(--secondary)] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Today
              </button>
              <button 
                onClick={viewMode === 'month' ? nextMonth : nextWeek}
                className="p-1.5 border border-[var(--border)] hover:bg-[var(--secondary)] rounded-lg cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MONTH VIEW GRID */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headings */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center font-semibold text-[10px] text-[var(--muted)] py-1.5 uppercase tracking-wider">
                  {d}
                </div>
              ))}
              
              {/* Day Boxes */}
              {getDaysInMonth().map(({ date, currentMonth }, index) => {
                const dayFollowups = getFollowupsForDay(date);
                const pendingTasks = dayFollowups.filter(f => f.status === 'Pending');
                const completedTasks = dayFollowups.filter(f => f.status === 'Completed');
                
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[75px] p-1.5 border rounded-lg flex flex-col justify-between cursor-pointer transition-all duration-150 ${
                      isSelected ? 'border-blue-600 bg-blue-600/5' : 'border-[var(--border)] hover:border-blue-500 bg-[var(--card)]'
                    } ${!currentMonth ? 'opacity-40' : ''}`}
                  >
                    <span className={`text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-blue-600 text-white font-extrabold' : 'text-[var(--foreground)]'
                    }`}>
                      {date.getDate()}
                    </span>
                    
                    {/* Event indicators */}
                    <div className="space-y-1">
                      {pendingTasks.length > 0 && (
                        <div className="text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-1 rounded truncate">
                          {pendingTasks.length} Pending
                        </div>
                      )}
                      {completedTasks.length > 0 && (
                        <div className="text-[9px] font-semibold text-green-500 bg-green-500/10 px-1 rounded truncate">
                          {completedTasks.length} Completed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WEEK VIEW GRID */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7 gap-2">
              {getDaysInWeek().map((date, index) => {
                const dayFollowups = getFollowupsForDay(date);
                const pendingTasks = dayFollowups.filter(f => f.status === 'Pending');
                const completedTasks = dayFollowups.filter(f => f.status === 'Completed');

                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[220px] p-2 border rounded-xl flex flex-col cursor-pointer transition-all ${
                      isSelected ? 'border-blue-600 bg-blue-600/5' : 'border-[var(--border)] hover:border-blue-500'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col items-center pb-2 border-b">
                      <span className="text-[10px] font-semibold text-[var(--muted)] uppercase">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center mt-1 ${
                        isToday ? 'bg-blue-600 text-white font-extrabold' : ''
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Followup lists items */}
                    <div className="flex-1 overflow-y-auto pt-2 space-y-1">
                      {dayFollowups.slice(0, 3).map((f) => (
                        <div 
                          key={f._id}
                          className={`p-1.5 rounded text-[9px] font-semibold truncate border ${
                            f.status === 'Completed' 
                              ? 'bg-green-500/5 text-green-500 border-green-500/10 line-through' 
                              : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
                          }`}
                          title={f.title}
                        >
                          {f.time} - {f.title}
                        </div>
                      ))}
                      {dayFollowups.length > 3 && (
                        <div className="text-[9px] text-[var(--muted)] text-center font-bold">
                          +{dayFollowups.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Selected Date Actions Sidebar Drawer */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Followups on active day list */}
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl flex flex-col h-[300px]">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)] mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
                Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {selectedDayFollowups.length === 0 ? (
                <div className="text-center text-xs text-[var(--muted)] py-16">
                  No tasks or reminders scheduled for this date.
                </div>
              ) : (
                selectedDayFollowups.map((task) => (
                  <div key={task._id} className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h5 className={`text-xs font-bold ${task.status === 'Completed' ? 'line-through text-[var(--muted)]' : ''}`}>
                          {task.title}
                        </h5>
                        <p className="text-[10px] text-[var(--muted)] mt-0.5">
                          Time: <span className="font-semibold">{task.time}</span> | Priority:{' '}
                          <span className={`font-semibold ${
                            task.priority === 'High' ? 'text-red-500 font-bold' :
                            task.priority === 'Medium' ? 'text-amber-500' :
                            'text-slate-500'
                          }`}>
                            {task.priority}
                          </span>
                        </p>
                      </div>

                      {task.status === 'Pending' ? (
                        <button
                          onClick={() => handleCompleteFollowup(task.customerId, task._id)}
                          className="p-1 rounded bg-[var(--card)] border border-[var(--border)] text-green-500 hover:bg-green-500/10 cursor-pointer shrink-0"
                          title="Complete Follow-up"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-[9px] text-green-500 font-bold uppercase shrink-0">Done</span>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-[var(--border)] flex justify-between items-center text-[10px]">
                      <span className="font-semibold">{task.customerName}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <Link 
                          href={`/dashboard/leads/${task.customerId}`}
                          className="text-[10px] hover:text-blue-500"
                          title="Go to customer profile"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Schedule form */}
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] mb-3 flex items-center gap-1">
              <Plus className="h-4 w-4" /> Inline Quick Scheduler
            </h4>

            <form onSubmit={handleQuickScheduleSubmit} className="space-y-3">
              {/* Customer Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Target Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                >
                  <option value="">Select active customer...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.fullName} ({c.leadStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Call for site plan feedback..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                />
              </div>

              {/* Time & Priority */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Remarks</label>
                <input
                  type="text"
                  placeholder="Details for this schedule reminder..."
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={scheduling || !selectedCustomer || !newTitle.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow disabled:opacity-50"
              >
                {scheduling ? 'Scheduling...' : `Book for ${selectedDate.toLocaleDateString('en-US', {month:'short', day:'numeric'})}`}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
