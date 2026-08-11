import mongoose from 'mongoose';

const FollowUpSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // Format "HH:MM"
    title: { type: String, required: true },
    remark: { type: String, default: '' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
  },
  { timestamps: true }
);

export default mongoose.models.FollowUp || mongoose.model('FollowUp', FollowUpSchema);
