import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import SoldCustomer from '@/models/SoldCustomer';
import Activity from '@/models/Activity';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const record = await SoldCustomer.findById(id);
    if (!record) {
      return NextResponse.json({ error: 'Sold customer record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    if (
      body.squareYard !== undefined ||
      body.ratePerSquareYard !== undefined ||
      body.dlcRatePerSquareYard !== undefined ||
      body.registryAmount !== undefined ||
      body.loanAmount !== undefined ||
      body.chequeAmount !== undefined ||
      body.rtgsAmount !== undefined ||
      body.onlineAmount !== undefined ||
      body.otherWhitePayment !== undefined ||
      body.cashAmount !== undefined ||
      body.bookingAmount !== undefined ||
      body.downPayment !== undefined
    ) {
      const existing = await SoldCustomer.findById(id);
      if (!existing) {
        return NextResponse.json({ error: 'Sold customer record not found' }, { status: 404 });
      }

      const squareYard = Number(body.squareYard ?? existing.squareYard ?? 0);
      const ratePerSquareYard = Number(body.ratePerSquareYard ?? existing.ratePerSquareYard ?? 0);
      const demandAmount = squareYard * ratePerSquareYard;
      const dlcRatePerSquareYard = Number(body.dlcRatePerSquareYard ?? existing.dlcRatePerSquareYard ?? 0);
      const dlcAmount = squareYard * dlcRatePerSquareYard;
      const totalWhiteAmount =
        Number(body.registryAmount ?? existing.registryAmount ?? 0) +
        Number(body.loanAmount ?? existing.loanAmount ?? 0) +
        Number(body.chequeAmount ?? existing.chequeAmount ?? 0) +
        Number(body.rtgsAmount ?? existing.rtgsAmount ?? 0) +
        Number(body.onlineAmount ?? existing.onlineAmount ?? 0) +
        Number(body.otherWhitePayment ?? existing.otherWhitePayment ?? 0);
      const totalCashAmount = Number(body.cashAmount ?? existing.cashAmount ?? 0);
      const totalReceived =
        Number(body.bookingAmount ?? existing.bookingAmount ?? 0) +
        Number(body.downPayment ?? existing.downPayment ?? 0) +
        totalWhiteAmount +
        totalCashAmount;

      Object.assign(body, {
        totalAmount: demandAmount,
        demandAmount,
        dlcAmount,
        dlcDifference: demandAmount - dlcAmount,
        totalWhiteAmount,
        totalCashAmount,
        totalReceived,
        remainingAmount: Math.max(0, demandAmount - totalReceived),
      });
    }

    // Find and update Sold Customer Record
    const record = await SoldCustomer.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!record) {
      return NextResponse.json({ error: 'Sold customer record not found' }, { status: 404 });
    }

    // Log Activity
    await Activity.create({
      customerId: record.customerId,
      type: 'Negotiation',
      description: `Sold transaction details updated by Admin: Registry: ${record.registryStatus}, Payment: ${record.paymentStatus}.`
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const record = await SoldCustomer.findByIdAndDelete(id);
    if (!record) {
      return NextResponse.json({ error: 'Sold customer record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Sold customer record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
