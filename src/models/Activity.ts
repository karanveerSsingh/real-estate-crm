import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { 
      type: String, 
      enum: ['Lead Created', 'Called', 'WhatsApp Sent', 'Follow-up Done', 'Site Visit', 'Negotiation', 'Booked', 'Sold', 'Note Added', 'Document Uploaded'],
      required: true 
    },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
