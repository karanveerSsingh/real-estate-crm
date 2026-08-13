import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import SoldCustomer from '@/models/SoldCustomer';
import Customer from '@/models/Customer';
import Property from '@/models/Property';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';
import { createErrorResponse } from '@/lib/apiFallbacks';
import { formatINR } from '@/lib/crmOptions';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json([], { status: 200 });
    }

    const query: any = {};
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { salesExecutive: { $regex: search, $options: 'i' } }
      ];
    }

    const soldRecords = await SoldCustomer.find(query).sort({ createdAt: -1 });
    return NextResponse.json(soldRecords);
  } catch (error: unknown) {
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      projectName,
      societyName,
      location,
      road,
      squareYard,
      ratePerSquareYard,
      dlcRatePerSquareYard,
      totalAmount,
      bookingAmount,
      downPayment,
      paymentMode,
      loanAmount,
      remainingAmount,
      registryAmount,
      chequeAmount,
      rtgsAmount,
      onlineAmount,
      otherWhitePayment,
      cashAmount,
      cashReceivedDate,
      cashRemarks,
      registryNumber,
      registryPdfUrl,
      loanBankName,
      loanExecutive,
      processingFee,
      fileRemarks,
      paymentHistory,
      registryStatus,
      fileProcessingStatus,
      agreementStatus,
      paymentStatus,
      bookingDate,
      registryDate,
      salesExecutive,
      remarks
    } = body;

    if (!customerId || !projectName || !location || !totalAmount) {
      return NextResponse.json({ error: 'Customer ID, project name, location, and total amount are required' }, { status: 400 });
    }

    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // 1. Fetch Customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const demandAmount = Number(totalAmount || 0);
    const dlcAmount = Number(squareYard || 0) * Number(dlcRatePerSquareYard || 0);
    const totalWhiteAmount =
      Number(registryAmount || 0) +
      Number(loanAmount || 0) +
      Number(chequeAmount || 0) +
      Number(rtgsAmount || 0) +
      Number(onlineAmount || 0) +
      Number(otherWhitePayment || 0);
    const totalCashAmount = Number(cashAmount || 0);
    const totalReceived = Number(bookingAmount || 0) + Number(downPayment || 0) + totalWhiteAmount + totalCashAmount;
    const calculatedRemaining = Math.max(0, demandAmount - totalReceived);
    const initialPayments = Array.isArray(paymentHistory) ? paymentHistory : [];

    // 2. Create Sold Customer Record
    const soldCustomer = await SoldCustomer.create({
      customerId,
      customerName: customer.fullName,
      mobile: customer.mobileNumber,
      projectName,
      societyName,
      location,
      road,
      squareYard: Number(squareYard),
      ratePerSquareYard: Number(ratePerSquareYard),
      totalAmount: demandAmount,
      demandAmount,
      dlcRatePerSquareYard: Number(dlcRatePerSquareYard || 0),
      dlcAmount,
      dlcDifference: demandAmount - dlcAmount,
      bookingAmount: Number(bookingAmount),
      downPayment: Number(downPayment),
      paymentMode: paymentMode || 'Cash',
      loanAmount: Number(loanAmount || 0),
      registryAmount: Number(registryAmount || 0),
      chequeAmount: Number(chequeAmount || 0),
      rtgsAmount: Number(rtgsAmount || 0),
      onlineAmount: Number(onlineAmount || 0),
      otherWhitePayment: Number(otherWhitePayment || 0),
      totalWhiteAmount,
      cashAmount: Number(cashAmount || 0),
      cashReceivedDate: cashReceivedDate ? new Date(cashReceivedDate) : undefined,
      cashRemarks,
      totalCashAmount,
      totalReceived,
      remainingAmount: Number.isFinite(Number(remainingAmount)) ? Number(remainingAmount) : calculatedRemaining,
      registryStatus: registryStatus || 'Pending',
      registryNumber,
      registryPdfUrl,
      fileProcessingStatus: fileProcessingStatus || 'Pending',
      loanBankName,
      loanExecutive,
      processingFee: Number(processingFee || 0),
      fileRemarks,
      agreementStatus: agreementStatus || 'Pending',
      paymentStatus: paymentStatus || (calculatedRemaining === 0 ? 'Full' : 'Partial'),
      bookingDate: new Date(bookingDate),
      registryDate: registryDate ? new Date(registryDate) : undefined,
      salesExecutive,
      remarks,
      documents: [],
      paymentHistory: initialPayments
    });

    // 3. Update Customer Status to "Sold"
    customer.leadStatus = 'Sold';
    await customer.save(); // pre-save calculates new lead score!

    // 4. Try updating matching Property status to "Sold" in Inventory
    // Match by name if exact or location
    await Property.updateOne(
      { propertyName: { $regex: new RegExp(`^${projectName.trim()}$`, 'i') } },
      { $set: { status: 'Sold' } }
    );

    // 5. Log Activities
    await Activity.create({
      customerId,
      type: 'Booked',
      description: `Property booked: ${projectName} at ${location}. Amount: ${formatINR(demandAmount)}.`
    });

    await Activity.create({
      customerId,
      type: 'Sold',
      description: `Sale closed! Processed agreement status: ${agreementStatus || 'Pending'}.`
    });

    // 6. Create Notification
    await Notification.create({
      title: 'Deal Closed successfully',
      message: `Property sold to ${customer.fullName} - ${projectName} (${location}) for ${formatINR(demandAmount)}.`,
      type: 'Booking',
      customerId,
      date: new Date()
    });

    if (registryDate) {
      await Notification.create({
        title: 'Registry Milestone Scheduled',
        message: `Registry file processing for ${customer.fullName} is due on ${new Date(registryDate).toLocaleDateString()}.`,
        type: 'Registry',
        customerId,
        date: new Date(registryDate)
      });
    }

    return NextResponse.json(soldCustomer, { status: 201 });
  } catch (error: unknown) {
    return createErrorResponse(error);
  }
}
