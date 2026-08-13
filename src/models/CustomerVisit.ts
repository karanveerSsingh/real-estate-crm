import mongoose from 'mongoose';

const CustomerVisitSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    propertyName: { type: String, required: true },
    projectName: { type: String, default: '' },
    location: { type: String, default: '' },
    plannedVisitAt: { type: Date, default: null },
    actualVisitAt: { type: Date, default: null },
    status: { type: String, enum: ['Planned', 'Pending', 'Completed'], default: 'Completed' },
    followUpId: { type: mongoose.Schema.Types.ObjectId, ref: 'FollowUp', default: null },
    visitedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// A customer can visit the same property more than once, so every document is
// a separate historical visit rather than an upserted property record.
CustomerVisitSchema.index({ customerId: 1, visitedAt: -1 });

if (mongoose.models.CustomerVisit && !mongoose.models.CustomerVisit.schema.path('plannedVisitAt')) {
  mongoose.deleteModel('CustomerVisit');
}

export default mongoose.models.CustomerVisit || mongoose.model('CustomerVisit', CustomerVisitSchema);
