export type FollowUpPriority = 'Low' | 'Medium' | 'High';

export type UrgencyLevel = 'critical' | 'warning' | 'caution';

export function getStartOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getDaysOverdue(followUpDate: Date | string, now = new Date()): number {
  const startOfToday = getStartOfToday(now);
  const date = new Date(followUpDate);
  date.setHours(0, 0, 0, 0);
  const diffMs = startOfToday.getTime() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getUrgencyLevel(daysOverdue: number): UrgencyLevel {
  if (daysOverdue > 7) return 'critical';
  if (daysOverdue >= 3) return 'warning';
  return 'caution';
}

export function getUrgencyStyles(level: UrgencyLevel) {
  switch (level) {
    case 'critical':
      return {
        badge: 'bg-red-500/15 text-red-500 border-red-500/25',
        border: 'border-red-500/20',
        dot: 'bg-red-500',
      };
    case 'warning':
      return {
        badge: 'bg-orange-500/15 text-orange-500 border-orange-500/25',
        border: 'border-orange-500/20',
        dot: 'bg-orange-500',
      };
    default:
      return {
        badge: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/25',
        border: 'border-yellow-500/20',
        dot: 'bg-yellow-500',
      };
  }
}

export function formatDaysOverdueLabel(days: number): string {
  return days === 1 ? '1 Day Overdue' : `${days} Days Overdue`;
}

export function getPriorityOrder(priority: FollowUpPriority): number {
  switch (priority) {
    case 'High':
      return 3;
    case 'Medium':
      return 2;
    default:
      return 1;
  }
}

export function matchesDaysOverdueFilter(daysOverdue: number, filter: string): boolean {
  if (!filter || filter === 'all') return true;
  if (filter === '1-2') return daysOverdue >= 1 && daysOverdue <= 2;
  if (filter === '3-7') return daysOverdue >= 3 && daysOverdue <= 7;
  if (filter === '7+') return daysOverdue > 7;
  return true;
}
