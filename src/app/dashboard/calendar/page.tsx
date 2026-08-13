'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  ExternalLink,
  Cake
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CalendarPage() {
  type Customer = {
    _id: string;
    fullName: string;
    leadStatus: string;
    dateOfBirth?: string;
    mobileNumber?: string;
    whatsAppNumber?: string;
  };

  type FollowupEvent = {
    _id: string;
    title: string;
    date: string;
    time: string;
    status: string;
    priority: string;
    type?: 'Follow-up' | 'Property Visit';
    propertyName?: string;
    projectName?: string;
    customerName?: string;
    customerId?: string;
  };

  const [followups, setFollowups] = useState<FollowupEvent[]>([]);

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
  const [scheduleType, setScheduleType] = useState<'Follow-up' | 'Property Visit'>('Follow-up');
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const router = useRouter();

  const fetchFollowups = async () => {
    try {
      const resCust = await fetch('/api/customers');
      if (resCust.ok) {
        const custList = await resCust.json();

        const followupsPromises = custList.map(async (c: Customer) => {
          const resF = await fetch(`/api/customers/${c._id}/followups`);
          if (resF.ok) {
            const dataF = await resF.json() as FollowupEvent[];
            return dataF.map((f) => ({
              ...f,
              customerName: c.fullName,
              customerId: c._id,
            }));
          }
          return [] as FollowupEvent[];
        });

        const nestedFollowups = await Promise.all(followupsPromises);
        const flatFollowups = nestedFollowups.flat();
        setFollowups(flatFollowups);
      }
    } catch {
      toast.error('Error fetching calendar schedule');
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const list = await res.json() as Customer[];
        setAllCustomers(list);
        setCustomers(list.filter((c) => c.leadStatus !== 'Sold' && c.leadStatus !== 'Lost'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProperties = async () => {
    const res = await fetch('/api/properties?status=Available');
    if (res.ok) setProperties(await res.json());
  };

  useEffect(() => {
    void fetchFollowups();
    void fetchCustomers();
    void fetchProperties();
  }, []);

  const handleQuickScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || (!newTitle.trim() && scheduleType !== 'Property Visit') || !newTime || (scheduleType === 'Property Visit' && !selectedProperty)) {
      toast.error(scheduleType === 'Property Visit' ? 'Please select customer, property and time' : 'Please select customer, title and time');
      return;
    }

    try {
      setScheduling(true);
      const dateString = selectedDate.toISOString().split('T')[0];

      const res = await fetch(`/api/customers/${selectedCustomer}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim() || 'Property Visit',
          date: dateString,
          time: newTime,
          remark: newRemark.trim(),
          priority: newPriority,
          type: scheduleType,
          status: scheduleType === 'Property Visit' ? 'Planned' : 'Pending',
          ...(scheduleType === 'Property Visit' ? (() => {
            const property = properties.find((item) => item._id === selectedProperty);
            return property ? { propertyId: property._id, propertyName: property.propertyName, projectName: property.projectName || '', location: property.location || '' } : {};
          })() : {})
        })
      });

      if (res.ok) {
        toast.success('Follow-up scheduled on calendar');
        setNewTitle('');
        setNewRemark('');
        setSelectedProperty('');
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

  const handleFollowupStatusChange = async (customerId: string, fId: string, status: 'Planned' | 'Pending' | 'Completed') => {
    const res = await fetch(`/api/customers/${customerId}/followups`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followUpId: fId, status })
    });
    if (res.ok) {
      toast.success(`Visit marked ${status.toLowerCase()}`);
      fetchFollowups();
    } else toast.error('Failed to update visit status');
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

  const getBirthdayEventsForDay = (date: Date) => {
    return allCustomers
      .filter((customer): customer is Customer & { dateOfBirth: string } => Boolean(customer.dateOfBirth))
      .map((customer) => {
        const dob = new Date(customer.dateOfBirth);
        return {
          ...customer,
          birthdayDate: new Date(date.getFullYear(), dob.getMonth(), dob.getDate()),
          isLeapDay: dob.getMonth() === 1 && dob.getDate() === 29,
        };
      })
      .filter((customer) => isSameDay(customer.birthdayDate, date));
  };

  const getFollowupsForDay = (date: Date) => {
    return followups.filter(f => isSameDay(new Date(f.date), date));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDayBirthdays = getBirthdayEventsForDay(selectedDate);
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
                const plannedVisits = dayFollowups.filter(f => f.type === 'Property Visit' && f.status === 'Planned');
                
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());

                const birthdayEvents = getBirthdayEventsForDay(date);
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[75px] p-1.5 border rounded-lg flex flex-col justify-between cursor-pointer transition-all duration-150 ${
                      isSelected ? 'border-blue-600 bg-blue-600/5' : 'border-[var(--border)] hover:border-blue-500 bg-[var(--card)]'
                    } ${!currentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-blue-600 text-white font-extrabold' : 'text-[var(--foreground)]'
                      }`}>
                        {date.getDate()}
                      </span>
                      {birthdayEvents.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded-full">
                          <Cake className="h-3.5 w-3.5" />
                          {birthdayEvents.length}
                        </span>
                      )}
                    </div>
                    
                    {/* Event indicators */}
                    <div className="space-y-1">
                      {plannedVisits.length > 0 && <div className="text-[9px] font-semibold text-blue-500 bg-blue-500/10 px-1 rounded truncate">🔵 {plannedVisits.length} Visit Planned</div>}
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
                              : f.type === 'Property Visit' && f.status === 'Planned'
                                ? 'bg-blue-500/5 text-blue-500 border-blue-500/10'
                                : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
                          }`}
                          title={f.title}
                        >
                          {f.time} - {f.type === 'Property Visit' ? `🔵 ${f.projectName || f.propertyName}` : f.title}
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
              {selectedDayBirthdays.length === 0 && selectedDayFollowups.length === 0 ? (
                <div className="text-center text-xs text-[var(--muted)] py-16">
                  No tasks or reminders scheduled for this date.
                </div>
              ) : (
                <>
                  {selectedDayBirthdays.map((birthday) => (
                    <button
                      key={`birthday-${birthday._id}`}
                      type="button"
                      onClick={() => router.push(`/dashboard/leads/${birthday._id}`)}
                      className="w-full text-left p-3.5 bg-pink-500/5 border border-pink-500/10 rounded-xl space-y-2 hover:bg-pink-500/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-pink-500 uppercase tracking-wider">
                            <Cake className="h-4 w-4" /> Birthday
                          </div>
                          <h5 className="text-sm font-semibold text-[var(--foreground)] truncate">
                            {birthday.fullName}
                          </h5>
                        </div>
                        <span className="text-[10px] font-semibold text-pink-500">
                          {birthday.birthdayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--muted)]">
                        Celebrate their special day and open full profile.
                      </p>
                    </button>
                  ))}

                  {selectedDayFollowups.map((task) => (
                    <div key={task._id} className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h5 className={`text-xs font-bold ${task.status === 'Completed' ? 'line-through text-[var(--muted)]' : ''}`}>
                            {task.type === 'Property Visit' ? `Property Visit: ${task.projectName || task.propertyName}` : task.title}
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

                        {task.type === 'Property Visit' && task.customerId ? (
                          <select value={task.status} onChange={(event) => handleFollowupStatusChange(task.customerId!, task._id, event.target.value as 'Planned' | 'Pending' | 'Completed')} className={`rounded border border-[var(--border)] bg-[var(--card)] p-1 text-[9px] font-bold ${task.status === 'Completed' ? 'text-green-500' : task.status === 'Pending' ? 'text-amber-500' : 'text-blue-500'}`}>
                            <option value="Planned">🔵 Planned</option><option value="Pending">🟠 Pending</option><option value="Completed">🟢 Completed</option>
                          </select>
                        ) : task.status === 'Pending' && task.customerId ? (
                          <button
                            onClick={() => handleCompleteFollowup(task.customerId!, task._id)}
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
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Quick Schedule form */}
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] mb-3 flex items-center gap-1">
              <Plus className="h-4 w-4" /> Inline Quick Scheduler
            </h4>

            <form onSubmit={handleQuickScheduleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Schedule Type</label>
                <select value={scheduleType} onChange={(e) => { setScheduleType(e.target.value as 'Follow-up' | 'Property Visit'); setSelectedProperty(''); }} className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none">
                  <option value="Follow-up">Regular Follow-up</option><option value="Property Visit">Property Visit</option>
                </select>
              </div>
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

              {scheduleType === 'Property Visit' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Property / Project</label>
                  <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none">
                    <option value="">Select available property...</option>
                    {properties.map((property) => <option key={property._id} value={property._id}>{property.propertyName}{property.projectName ? ` — ${property.projectName}` : ''} · {property.location}</option>)}
                  </select>
                </div>
              )}

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
                disabled={scheduling || !selectedCustomer || (scheduleType === 'Property Visit' ? !selectedProperty : !newTitle.trim())}
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
