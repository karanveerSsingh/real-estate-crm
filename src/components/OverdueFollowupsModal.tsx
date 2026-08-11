'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Phone,
  Search,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_LOCATIONS, PURPOSE_OPTIONS } from '@/lib/crmOptions';
import {
  formatDaysOverdueLabel,
  getUrgencyLevel,
  getUrgencyStyles,
} from '@/lib/followUpUtils';

export interface OverdueFollowUpItem {
  _id: string;
  customerId: string;
  date: string;
  time: string;
  title: string;
  remark?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending';
  daysOverdue: number;
  assignedTo: string | null;
  lastRemark: string;
  customer: {
    fullName: string;
    mobileNumber: string;
    whatsAppNumber?: string;
    purpose: string;
    budget: string;
    preferredLocations: string[];
    notes?: string;
    requirement?: string;
  };
}

interface OverdueFollowupsModalProps {
  open: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

type EditMode = 'edit' | 'reschedule' | null;

const DAYS_OVERDUE_OPTIONS = [
  { value: 'all', label: 'All overdue' },
  { value: '1-2', label: '1–2 days' },
  { value: '3-7', label: '3–7 days' },
  { value: '7+', label: 'More than 7 days' },
];

export default function OverdueFollowupsModal({
  open,
  onClose,
  onCountChange,
}: OverdueFollowupsModalProps) {
  const [items, setItems] = useState<OverdueFollowUpItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [daysOverdue, setDaysOverdue] = useState('all');

  const [editTarget, setEditTarget] = useState<OverdueFollowUpItem | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchOverdue = useCallback(async (pageNum = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '50',
      });
      if (search.trim()) params.set('search', search.trim());
      if (location) params.set('location', location);
      if (purpose) params.set('purpose', purpose);
      if (daysOverdue !== 'all') params.set('daysOverdue', daysOverdue);

      const res = await fetch(`/api/followups/overdue?${params.toString()}`);
      if (!res.ok) {
        toast.error('Failed to load overdue follow-ups');
        return;
      }

      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || pageNum);
      onCountChange(data.total || 0);
    } catch {
      toast.error('Network error loading overdue follow-ups');
    } finally {
      setLoading(false);
    }
  }, [page, search, location, purpose, daysOverdue, onCountChange]);

  useEffect(() => {
    if (!open) return;
    fetchOverdue(1);
  }, [open, search, location, purpose, daysOverdue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      fetchOverdue(page);
    }, 30000);

    return () => clearInterval(interval);
  }, [open, page, fetchOverdue]);

  const resetEditForm = () => {
    setEditTarget(null);
    setEditMode(null);
    setEditTitle('');
    setEditDate('');
    setEditTime('');
    setEditRemark('');
    setEditPriority('Medium');
  };

  const openEditForm = (item: OverdueFollowUpItem, mode: EditMode) => {
    setEditTarget(item);
    setEditMode(mode);
    setEditTitle(item.title);
    setEditDate(new Date(item.date).toISOString().split('T')[0]);
    setEditTime(item.time);
    setEditRemark(item.remark || '');
    setEditPriority(item.priority);
  };

  const handleComplete = async (item: OverdueFollowUpItem) => {
    try {
      setActionLoading(item._id);
      const res = await fetch(`/api/customers/${item.customerId}/followups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpId: item._id, status: 'Completed' }),
      });

      if (res.ok) {
        toast.success('Follow-up marked as completed');
        await fetchOverdue(page);
      } else {
        toast.error('Failed to complete follow-up');
      }
    } catch {
      toast.error('Error completing follow-up');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    if (!editTitle.trim() || !editDate || !editTime) {
      toast.error('Title, date, and time are required');
      return;
    }

    try {
      setEditSubmitting(true);
      const res = await fetch(`/api/customers/${editTarget.customerId}/followups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUpId: editTarget._id,
          title: editTitle.trim(),
          date: editDate,
          time: editTime,
          remark: editRemark.trim(),
          priority: editPriority,
        }),
      });

      if (res.ok) {
        toast.success(editMode === 'reschedule' ? 'Follow-up rescheduled' : 'Follow-up updated');
        resetEditForm();
        await fetchOverdue(page);
      } else {
        toast.error('Failed to save follow-up');
      }
    } catch {
      toast.error('Error saving follow-up');
    } finally {
      setEditSubmitting(false);
    }
  };

  const priorityBadge = useMemo(
    () => ({
      High: 'bg-red-500/10 text-red-500',
      Medium: 'bg-amber-500/10 text-amber-500',
      Low: 'bg-slate-500/10 text-slate-500',
    }),
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Overdue Follow-ups</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {total === 0
                  ? 'All caught up — no pending overdue tasks'
                  : `${total} pending follow-up${total === 1 ? '' : 's'} past their scheduled date`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]/50 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search name or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All locations</option>
              {DEFAULT_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All purposes</option>
              {PURPOSE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={daysOverdue}
              onChange={(e) => setDaysOverdue(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DAYS_OVERDUE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Edit / Reschedule form */}
        {editTarget && editMode && (
          <div className="p-4 border-b border-[var(--border)] bg-blue-500/5 shrink-0">
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">
                  {editMode === 'reschedule' ? 'Reschedule Follow-up' : 'Edit Follow-up'} —{' '}
                  {editTarget.customer.fullName}
                </h4>
                <button
                  type="button"
                  onClick={resetEditForm}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Title"
                  className="px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg"
                  required
                />
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg"
                  required
                />
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg"
                  required
                />
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
              <textarea
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                placeholder="Remark / notes"
                rows={2}
                className="w-full px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg resize-none"
              />
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {editSubmitting ? 'Saving...' : editMode === 'reschedule' ? 'Reschedule' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500 mb-2" />
              <span className="text-xs text-[var(--muted)]">Loading overdue follow-ups...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-medium text-[var(--foreground)]">
                🎉 Great! There are no overdue follow-ups.
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {search || location || purpose || daysOverdue !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Your team is on top of all scheduled follow-ups.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const urgency = getUrgencyLevel(item.daysOverdue);
                const styles = getUrgencyStyles(urgency);
                const customerId =
                  typeof item.customerId === 'object'
                    ? (item.customerId as { _id: string })._id
                    : item.customerId;
                const locations = item.customer.preferredLocations?.join(', ') || '—';
                const isBusy = actionLoading === item._id;

                return (
                  <div
                    key={item._id}
                    className={`p-4 bg-[var(--background)] border rounded-xl ${styles.border}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-[var(--foreground)]">
                            {item.customer.fullName}
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${styles.badge}`}
                          >
                            {formatDaysOverdueLabel(item.daysOverdue)}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityBadge[item.priority]}`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
                          <p className="text-[var(--muted)]">
                            <span className="font-medium text-[var(--foreground)]">Mobile:</span>{' '}
                            {item.customer.mobileNumber}
                          </p>
                          <p className="text-[var(--muted)]">
                            <span className="font-medium text-[var(--foreground)]">Location:</span>{' '}
                            {locations}
                          </p>
                          <p className="text-[var(--muted)]">
                            <span className="font-medium text-[var(--foreground)]">Purpose:</span>{' '}
                            {item.customer.purpose}
                          </p>
                          <p className="text-[var(--muted)]">
                            <span className="font-medium text-[var(--foreground)]">Budget:</span>{' '}
                            {item.customer.budget}
                          </p>
                          <p className="text-[var(--muted)]">
                            <span className="font-medium text-[var(--foreground)]">Follow-up:</span>{' '}
                            {new Date(item.date).toLocaleDateString()} at {item.time}
                          </p>
                          <p className="text-[var(--muted)]">
                            <span className="font-medium text-[var(--foreground)]">Assigned:</span>{' '}
                            {item.assignedTo || 'Not assigned'}
                          </p>
                        </div>

                        <div className="text-[11px] text-[var(--muted)] bg-[var(--card)] border border-[var(--border)] rounded-lg p-2.5">
                          <span className="font-medium text-[var(--foreground)]">Task:</span>{' '}
                          {item.title}
                          {item.lastRemark && (
                            <>
                              <br />
                              <span className="font-medium text-[var(--foreground)]">Last remark:</span>{' '}
                              {item.lastRemark}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap lg:flex-col gap-1.5 shrink-0">
                        <a
                          href={`tel:${item.customer.mobileNumber}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20"
                        >
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                        <Link
                          href={`/dashboard/leads/${customerId}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Lead
                        </Link>
                        <button
                          onClick={() => openEditForm(item, 'edit')}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-500/10 text-[var(--foreground)] hover:bg-slate-500/20 border border-[var(--border)] cursor-pointer disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleComplete(item)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 cursor-pointer disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Complete
                        </button>
                        <button
                          onClick={() => openEditForm(item, 'reschedule')}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer disabled:opacity-50"
                        >
                          <Calendar className="h-3.5 w-3.5" /> Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] shrink-0">
            <span className="text-xs text-[var(--muted)]">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchOverdue(page - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => fetchOverdue(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
