import Attendance from './attendance.model.js';
import User from '../users/user.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

const OFFICE_SUBNET = process.env.OFFICE_SUBNET || '192.168.29';
const OFFICE_PUBLIC_IPS = (process.env.OFFICE_PUBLIC_IPS || '').split(',').map((s) => s.trim()).filter(Boolean);

class AttendanceService {
  /**
   * Check in for today.
   * Returns { attendance, warnings[] }
   */
  async checkIn(userId, ip, notes = '') {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Check if already checked in
    const existing = await Attendance.findOne({ user: userId, date: today });
    if (existing) {
      throw new AppError('Already checked in today', 400, 'ALREADY_CHECKED_IN');
    }

    // Determine suspicion based on IP
    let isSuspicious = false;
    let suspiciousReason = '';

    const user = await User.findById(userId).select('registeredIps');
    const isFirstCheckIn = !user?.registeredIps?.length;

    // Auto-register first IP — first time is always trusted
    if (isFirstCheckIn) {
      await User.updateOne({ _id: userId }, { $addToSet: { registeredIps: ip } });
    } else {
      // Check if IP is known (registered) for this user
      const isKnownIp = user.registeredIps.includes(ip);

      // Check if IP is on office network (local subnet or known public IPs)
      const isOfficeNetwork = ip.startsWith(OFFICE_SUBNET + '.')
        || ip === '127.0.0.1'
        || OFFICE_PUBLIC_IPS.includes(ip);

      if (!isKnownIp && !isOfficeNetwork) {
        isSuspicious = true;
        suspiciousReason = `Unregistered IP outside office network: ${ip}`;
      } else if (!isKnownIp) {
        // New IP but on office network — auto-register it
        await User.updateOne({ _id: userId }, { $addToSet: { registeredIps: ip } });
      }
    }

    const doc = {
      user: userId,
      date: today,
      checkIn: new Date(),
      ip: ip || 'unknown',
      isSuspicious,
      suspiciousReason,
      notes: notes || '',
    };
    console.log('[Attendance] Creating doc:', JSON.stringify(doc));

    const attendance = await Attendance.create(doc);

    return attendance;
  }

  /**
   * Check out for today
   */
  async checkOut(userId, notes) {
    const today = new Date().toISOString().slice(0, 10);
    const attendance = await Attendance.findOne({ user: userId, date: today });

    if (!attendance) {
      throw new AppError('Not checked in today', 400, 'NOT_CHECKED_IN');
    }
    if (attendance.checkOut) {
      throw new AppError('Already checked out', 400, 'ALREADY_CHECKED_OUT');
    }

    attendance.checkOut = new Date();
    if (notes) attendance.notes = notes;
    await attendance.save();

    return attendance;
  }

  /**
   * Get today's attendance status for a user
   */
  async getToday(userId) {
    const today = new Date().toISOString().slice(0, 10);
    return Attendance.findOne({ user: userId, date: today });
  }

  /**
   * Get attendance records (with filters)
   */
  async getAll(query = {}, userId, userRole) {
    const { page = 1, limit = 31, month, date, userId: filterUserId } = query;

    const filter = {};

    // Non-admins can only see their own
    if (userRole !== 'super_admin') {
      filter.user = userId;
    } else if (filterUserId) {
      filter.user = filterUserId;
    }

    if (date) {
      filter.date = date;
    } else if (month) {
      filter.date = { $regex: `^${month}` };
    }

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('user', 'name email avatar role')
        .sort({ date: -1, checkIn: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    return { records, meta: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Get monthly summary for a user
   */
  async getMonthlySummary(userId, month) {
    const records = await Attendance.find({
      user: userId,
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    let totalHours = 0;
    let presentDays = 0;
    let suspiciousDays = 0;

    for (const r of records) {
      presentDays++;
      if (r.isSuspicious) suspiciousDays++;
      if (r.checkIn && r.checkOut) {
        totalHours += (r.checkOut - r.checkIn) / (1000 * 60 * 60);
      }
    }

    return {
      month,
      presentDays,
      suspiciousDays,
      totalHours: Math.round(totalHours * 100) / 100,
      records,
    };
  }

  /**
   * Register an IP for a user (admin only)
   */
  async registerIp(targetUserId, ip) {
    await User.updateOne(
      { _id: targetUserId },
      { $addToSet: { registeredIps: ip } }
    );
    const user = await User.findById(targetUserId).select('name email registeredIps');
    return user;
  }

  /**
   * Remove a registered IP (admin only)
   */
  async removeIp(targetUserId, ip) {
    await User.updateOne(
      { _id: targetUserId },
      { $pull: { registeredIps: ip } }
    );
    const user = await User.findById(targetUserId).select('name email registeredIps');
    return user;
  }

  /**
   * Get all attendance for today (admin overview)
   */
  async getTodayAll() {
    const today = new Date().toISOString().slice(0, 10);
    return Attendance.find({ date: today })
      .populate('user', 'name email avatar role')
      .sort({ checkIn: 1 });
  }
}

export default new AttendanceService();
