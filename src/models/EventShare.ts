import mongoose from 'mongoose';

const EventShareSchema = new mongoose.Schema(
  {
    customerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }],
    platforms: [{ type: String, enum: ['whatsapp', 'facebook', 'instagram', 'linkedin', 'x', 'other'], required: true }],
    message: { type: String, required: true, trim: true },
    files: [{ name: { type: String, required: true }, url: { type: String, required: true }, mimeType: { type: String, required: true }, size: { type: Number, required: true } }],
    status: { type: String, enum: ['ready', 'opened', 'failed'], default: 'ready' },
  },
  { timestamps: true }
);

export default mongoose.models.EventShare || mongoose.model('EventShare', EventShareSchema);
