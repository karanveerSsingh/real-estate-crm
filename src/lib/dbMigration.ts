import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Customer from '@/models/Customer';
import Property from '@/models/Property';
import SoldCustomer from '@/models/SoldCustomer';
import FollowUp from '@/models/FollowUp';
import CustomerVisit from '@/models/CustomerVisit';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';
import EventShare from '@/models/EventShare';
import Setting from '@/models/Setting';

let migrationDone = false;

export async function ensureDataMigration() {
  if (migrationDone) return;
  try {
    // 1. Ensure primary admin user exists
    let admin = await User.findOne({ email: 'admin123@gmail.com' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        name: 'Admin CRM',
        email: 'admin123@gmail.com',
        password: hashedPassword,
        brandName: 'Invest with Karanveer',
        profileImage: '/investWithKaranveer.jpeg',
        role: 'admin',
      });
    }

    const adminId = admin._id;

    // 2. Safely attach userId to any orphaned existing records
    await Customer.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });
    await Property.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });
    await SoldCustomer.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });
    await FollowUp.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });
    await CustomerVisit.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });
    await Activity.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });
    await Notification.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });
    await EventShare.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });
    await Setting.updateMany({ userId: { $exists: false } }, { $set: { userId: adminId } });

    migrationDone = true;
  } catch (err) {
    console.error('[dbMigration] Migration error:', err);
  }
}
