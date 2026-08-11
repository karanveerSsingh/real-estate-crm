import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'Invest with Karanveer' },
    logoUrl: { type: String, default: '' },
    officeAddress: { type: String, default: '123 Business Park, Tonk Road, Jaipur' },
    phone: { type: String, default: '+919876543210' },
    whatsApp: { type: String, default: '+919876543210' },
    email: { type: String, default: 'info@InvestwithKaranveer.com' },
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' }
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
