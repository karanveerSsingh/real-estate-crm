import mongoose from 'mongoose';
import { PAYMENT_MODE_OPTIONS, ROAD_OPTIONS } from '@/lib/crmOptions';

const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, required: true }, // e.g. "PDF", "Image", "Aadhaar", "Receipt"
  uploadedAt: { type: Date, default: Date.now }
});

const PaymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  mode: { type: String, enum: PAYMENT_MODE_OPTIONS, default: 'Cash' },
  remarks: { type: String, default: '' },
  receiptUrl: { type: String, default: '' }
});

const SoldCustomerSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    mobile: { type: String, required: true },
    projectName: { type: String, required: true },
    societyName: { type: String, default: '' },
    location: { type: String, required: true },
    road: { type: String, enum: ROAD_OPTIONS },
    squareYard: { type: Number, required: true },
    ratePerSquareYard: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    demandAmount: { type: Number, default: 0 },
    dlcRatePerSquareYard: { type: Number, default: 0 },
    dlcAmount: { type: Number, default: 0 },
    dlcDifference: { type: Number, default: 0 },
    bookingAmount: { type: Number, required: true },
    downPayment: { type: Number, required: true },
    paymentMode: { type: String, enum: PAYMENT_MODE_OPTIONS, default: 'Cash' },
    registryAmount: { type: Number, default: 0 },
    loanAmount: { type: Number, default: 0 },
    chequeAmount: { type: Number, default: 0 },
    rtgsAmount: { type: Number, default: 0 },
    onlineAmount: { type: Number, default: 0 },
    otherWhitePayment: { type: Number, default: 0 },
    totalWhiteAmount: { type: Number, default: 0 },
    cashAmount: { type: Number, default: 0 },
    cashReceivedDate: { type: Date },
    cashRemarks: { type: String, default: '' },
    totalCashAmount: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    registryStatus: { type: String, enum: ['Pending', 'Done', 'In Progress'], default: 'Pending' },
    registryNumber: { type: String, default: '' },
    registryPdfUrl: { type: String, default: '' },
    fileProcessingStatus: { type: String, enum: ['Pending', 'Bank Processing', 'Approved', 'Rejected', 'Completed', 'In Progress', 'Submitted'], default: 'Pending' },
    loanBankName: { type: String, default: '' },
    loanExecutive: { type: String, default: '' },
    processingFee: { type: Number, default: 0 },
    fileRemarks: { type: String, default: '' },
    agreementStatus: { type: String, enum: ['Pending', 'Signed', 'In Progress'], default: 'Pending' },
    paymentStatus: { type: String, enum: ['Partial', 'Full', 'Overdue'], default: 'Partial' },
    bookingDate: { type: Date, required: true },
    registryDate: { type: Date },
    salesExecutive: { type: String, required: true },
    remarks: { type: String, default: '' },
    documents: { type: [DocumentSchema], default: [] },
    paymentHistory: { type: [PaymentHistorySchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.models.SoldCustomer || mongoose.model('SoldCustomer', SoldCustomerSchema);
