import mongoose from 'mongoose';
import { PURPOSE_OPTIONS } from '@/lib/crmOptions';

const CustomerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    whatsAppNumber: { type: String, required: true },
    purpose: { type: String, enum: PURPOSE_OPTIONS, required: true },
    budget: { type: String, required: true },
    preferredLocations: { type: [String], default: [] },
    leadSource: { 
      type: String, 
      enum: ['Instagram', 'Facebook', 'Website', 'Reference', 'Magicbricks', '99acres', 'Housing', 'Walk-in', 'Cold Calling', 'Other'], 
      required: true 
    },
    leadStatus: { 
      type: String, 
      enum: ['New', 'Contacted', 'Follow-up', 'Interested', 'Site Visit', 'Negotiation', 'Booked', 'Sold', 'Lost'], 
      default: 'New' 
    },
    notes: { type: String, default: '' },
    requirement: { type: String, default: '' },
    leadScore: { type: Number, default: 0 },
    dateOfBirth: { type: Date, default: null }
  },
  { timestamps: true }
);

function calculateLeadScore(doc: any) {
  let score = 0;
  if (doc.fullName) score += 10;
  if (doc.mobileNumber) score += 10;
  if (doc.whatsAppNumber) score += 10;
  if (doc.purpose) score += 10;
  if (doc.budget) score += 10;
  if (doc.preferredLocations && doc.preferredLocations.length > 0) score += 10;
  if (doc.leadSource) score += 10;
  if (doc.notes && doc.notes.trim().length > 0) score += 10;
  if (doc.requirement && doc.requirement.trim().length > 0) score += 10;

  switch (doc.leadStatus) {
    case 'Contacted':
      score += 5;
      break;
    case 'Follow-up':
      score += 10;
      break;
    case 'Interested':
      score += 15;
      break;
    case 'Site Visit':
      score += 20;
      break;
    case 'Negotiation':
      score += 25;
      break;
    case 'Booked':
      score += 30;
      break;
    case 'Sold':
      score += 40;
      break;
  }
  return Math.min(score, 100);
}

CustomerSchema.pre('save', function () {
  this.leadScore = calculateLeadScore(this);
});

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export { calculateLeadScore };
