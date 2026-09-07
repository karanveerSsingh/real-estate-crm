import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    brandName: { type: String, required: true, default: 'Invest with Karanveer' },
    profileImage: { type: String, default: '' },
    role: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

if (mongoose.models.User && !mongoose.models.User.schema.path('brandName')) {
  mongoose.deleteModel('User');
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
