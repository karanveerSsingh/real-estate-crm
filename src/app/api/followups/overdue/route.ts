import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import FollowUp from '@/models/FollowUp';
import { createErrorResponse } from '@/lib/apiFallbacks';
import {
  getDaysOverdue,
  getStartOfToday,
  matchesDaysOverdueFilter,
  getPriorityOrder,
} from '@/lib/followUpUtils';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 50;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('countOnly') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10))
    );
    const search = (searchParams.get('search') || '').trim();
    const location = searchParams.get('location') || '';
    const purpose = searchParams.get('purpose') || '';
    const daysOverdueFilter = searchParams.get('daysOverdue') || 'all';

    await connectDB();

    const startOfToday = getStartOfToday();

    const matchStage: Record<string, unknown> = {
      status: 'Pending',
      date: { $lt: startOfToday },
    };

    const pipeline: object[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
    ];

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'customer.fullName': regex },
            { 'customer.mobileNumber': regex },
            { 'customer.whatsAppNumber': regex },
          ],
        },
      });
    }

    if (location) {
      pipeline.push({
        $match: { 'customer.preferredLocations': location },
      });
    }

    if (purpose) {
      pipeline.push({
        $match: { 'customer.purpose': purpose },
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        customerId: 1,
        date: 1,
        time: 1,
        title: 1,
        remark: 1,
        priority: 1,
        status: 1,
        createdAt: 1,
        customer: {
          fullName: '$customer.fullName',
          mobileNumber: '$customer.mobileNumber',
          whatsAppNumber: '$customer.whatsAppNumber',
          purpose: '$customer.purpose',
          budget: '$customer.budget',
          preferredLocations: '$customer.preferredLocations',
          notes: '$customer.notes',
          requirement: '$customer.requirement',
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allResults = await FollowUp.aggregate(pipeline as any[]);

    const enriched = allResults
      .map((item) => ({
        ...item,
        daysOverdue: getDaysOverdue(item.date),
        assignedTo: null as string | null,
        lastRemark: item.remark || item.customer?.notes || '',
      }))
      .filter((item) => matchesDaysOverdueFilter(item.daysOverdue, daysOverdueFilter))
      .sort((a, b) => {
        if (b.daysOverdue !== a.daysOverdue) {
          return b.daysOverdue - a.daysOverdue;
        }
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
      });

    const total = enriched.length;

    if (countOnly) {
      return NextResponse.json({ total });
    }

    const skip = (page - 1) * limit;
    const items = enriched.slice(skip, skip + limit);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    return createErrorResponse(error);
  }
}
