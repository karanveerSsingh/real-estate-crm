import mongoose from 'mongoose';

const FollowUpSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // Format "HH:MM"
    title: { type: String, required: true },
    remark: { type: String, default: '' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Planned', 'Pending', 'Completed'], default: 'Pending' },
    type: { type: String, enum: ['Follow-up', 'Property Visit'], default: 'Follow-up' },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },
    propertyName: { type: String, default: '' },
    projectName: { type: String, default: '' },
    location: { type: String, default: '' },
    actualVisitAt: { type: Date, default: null },
    customerVisitId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerVisit', default: null }
  },
  { timestamps: true }
);

// Hot reload can retain the pre-visit schema in a running development server.
// Rebuild only that stale model so Planned visits and visit fields are validated.
if (mongoose.models.FollowUp && !mongoose.models.FollowUp.schema.path('type')) {
  mongoose.deleteModel('FollowUp');
}

export default mongoose.models.FollowUp || mongoose.model('FollowUp', FollowUpSchema);
