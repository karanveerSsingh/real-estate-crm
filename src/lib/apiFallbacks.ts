import { NextResponse } from 'next/server';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function createDashboardFallback() {
  return {
    stats: {
      totalLeads: 0,
      newLeads: 0,
      interestedLeads: 0,
      todayFollowups: 0,
      tomorrowFollowups: 0,
      overdueFollowups: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalBookings: 0,
      todayPlannedVisits: 0,
      todayCompletedVisits: 0,
      todayPendingVisits: 0
    },
    widgets: {
      upcomingSiteVisits: [],
      recentCustomers: [],
      recentlySold: [],
      pendingFollowups: [],
      highPriorityLeads: [],
      recentActivities: []
    },
    graphs: {
      monthlyLeads: months.map((month) => ({ name: month, Leads: 0 })),
      monthlySales: months.map((month) => ({ name: month, Sales: 0 })),
      locationWiseLeads: [
        { location: 'Agra Road', Leads: 0 },
        { location: 'Delhi Road', Leads: 0 },
        { location: 'Ajmer Road', Leads: 0 },
        { location: 'Diggi Road', Leads: 0 },
        { location: 'Tonk Road', Leads: 0 }
      ]
    },
    warning: 'Database unavailable. Showing empty CRM data.'
  };
}

export function createErrorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ error: message }, { status });
}
