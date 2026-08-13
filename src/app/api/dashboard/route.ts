import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import FollowUp from '@/models/FollowUp';
import SoldCustomer from '@/models/SoldCustomer';
import Activity from '@/models/Activity';
import { createDashboardFallback, createErrorResponse } from '@/lib/apiFallbacks';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json(createDashboardFallback(), { status: 200 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const endOfTomorrow = new Date(endOfToday);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

    // --- 1. CORE COUNTS & STATS ---
    const totalLeads = await Customer.countDocuments();
    const newLeads = await Customer.countDocuments({ leadStatus: 'New' });
    const interestedLeads = await Customer.countDocuments({ leadStatus: 'Interested' });
    // Follow-ups
    const todayFollowups = await FollowUp.countDocuments({
      status: 'Pending',
      date: { $gte: startOfToday, $lte: endOfToday }
    });
    const tomorrowFollowups = await FollowUp.countDocuments({
      status: 'Pending',
      date: { $gte: startOfTomorrow, $lte: endOfTomorrow }
    });
    const overdueFollowups = await FollowUp.countDocuments({
      status: 'Pending',
      date: { $lt: startOfToday }
    });
    const todayVisitQuery = { type: 'Property Visit', date: { $gte: startOfToday, $lte: endOfToday } };
    const todayPlannedVisits = await FollowUp.countDocuments(todayVisitQuery);
    const todayCompletedVisits = await FollowUp.countDocuments({ ...todayVisitQuery, status: 'Completed' });
    const todayPendingVisits = await FollowUp.countDocuments({ ...todayVisitQuery, status: { $in: ['Planned', 'Pending'] } });

    // Sales metrics
    const soldCustomers = await SoldCustomer.find();
    const totalSales = soldCustomers.length;
    const totalRevenue = soldCustomers.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalBookings = soldCustomers.reduce((acc, curr) => acc + (curr.bookingAmount || 0), 0);

    // --- 2. WIDGETS ---
    const upcomingSiteVisits = await Customer.find({ leadStatus: 'Site Visit' }).limit(5);
    const recentCustomers = await Customer.find().sort({ createdAt: -1 }).limit(5);
    const recentlySold = await SoldCustomer.find().sort({ createdAt: -1 }).limit(5);
    const pendingFollowupsList = await FollowUp.find({ status: 'Pending' })
      .populate('customerId', 'fullName mobileNumber')
      .sort({ date: 1, time: 1 })
      .limit(5);

    const highPriorityLeads = await Customer.find({ 
      leadStatus: { $in: ['Interested', 'Site Visit', 'Negotiation'] } 
    }).sort({ leadScore: -1 }).limit(5);

    const recentActivities = await Activity.find()
      .populate('customerId', 'fullName')
      .sort({ timestamp: -1 })
      .limit(8);

    // --- 3. GRAPH AGGREGATIONS ---
    // A. Monthly Leads & B. Monthly Sales (in-memory processing for 100% database compatibility)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Monthly Leads (current year)
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const leadsInYear = await Customer.find({
      createdAt: { $gte: startOfYear, $lte: endOfYear }
    }, 'createdAt');

    const monthlyLeadsCount = Array(12).fill(0);
    leadsInYear.forEach(lead => {
      const m = new Date(lead.createdAt).getMonth();
      monthlyLeadsCount[m]++;
    });

    const monthlyLeadsGraph = months.map((month, idx) => ({
      name: month,
      Leads: monthlyLeadsCount[idx]
    }));

    // Monthly Sales (current year)
    const salesInYear = await SoldCustomer.find({
      bookingDate: { $gte: startOfYear, $lte: endOfYear }
    }, 'totalAmount bookingDate');

    const monthlySalesCount = Array(12).fill(0);
    salesInYear.forEach(sale => {
      const m = new Date(sale.bookingDate).getMonth();
      monthlySalesCount[m] += sale.totalAmount;
    });

    const monthlySalesGraph = months.map((month, idx) => ({
      name: month,
      Sales: monthlySalesCount[idx]
    }));

    // C. Location Wise Leads
    // Get all leads preferred locations
    const allLeadsLocations = await Customer.find({}, 'preferredLocations');
    const locationCounts: { [key: string]: number } = {
      'Agra Road': 0,
      'Delhi Road': 0,
      'Ajmer Road': 0,
      'Diggi Road': 0,
      'Tonk Road': 0
    };

    allLeadsLocations.forEach(lead => {
      if (Array.isArray(lead.preferredLocations)) {
        lead.preferredLocations.forEach((loc: string) => {
          if (locationCounts[loc] !== undefined) {
            locationCounts[loc]++;
          }
        });
      }
    });

    const locationWiseLeadsGraph = Object.keys(locationCounts).map(loc => ({
      location: loc,
      Leads: locationCounts[loc]
    }));

    return NextResponse.json({
      stats: {
        totalLeads,
        newLeads,
        interestedLeads,
        todayFollowups,
        tomorrowFollowups,
        overdueFollowups,
        totalSales,
        totalRevenue,
        totalBookings,
        todayPlannedVisits,
        todayCompletedVisits,
        todayPendingVisits
      },
      widgets: {
        upcomingSiteVisits,
        recentCustomers,
        recentlySold,
        pendingFollowups: pendingFollowupsList,
        highPriorityLeads,
        recentActivities
      },
      graphs: {
        monthlyLeads: monthlyLeadsGraph,
        monthlySales: monthlySalesGraph,
        locationWiseLeads: locationWiseLeadsGraph
      }
    });
  } catch (error: unknown) {
    return createErrorResponse(error);
  }
}
export async function POST() {
  return GET();
}
