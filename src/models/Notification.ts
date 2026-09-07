import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['FollowUp', 'Booking', 'Registry', 'System', 'Birthday'], 
      default: 'System' 
    },
    read: { type: Boolean, default: false },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
