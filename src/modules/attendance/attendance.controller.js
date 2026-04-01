import attendanceService from './attendance.service.js';
import { sendSuccess } from '../../utils/index.js';

// Strip suspicious fields for non-admin users
function sanitize(doc, userRole) {
  if (userRole === 'super_admin') return doc;
  const obj = doc.toJSON ? doc.toJSON() : { ...doc };
  delete obj.isSuspicious;
  delete obj.suspiciousReason;
  delete obj.ip;
  return obj;
}

function sanitizeMany(docs, userRole) {
  if (userRole === 'super_admin') return docs;
  return docs.map((d) => sanitize(d, userRole));
}

class AttendanceController {
  async checkIn(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || req.ip
        || 'unknown';
      const cleanIp = ip.replace(/^::ffff:/, '');
      const { notes } = req.body;
      const userId = req.user.id || req.user._id;

      const attendance = await attendanceService.checkIn(userId, cleanIp, notes || '');

      sendSuccess(res, {
        data: sanitize(attendance, req.user.role),
        message: 'Checked in successfully',
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req, res, next) {
    try {
      const attendance = await attendanceService.checkOut((req.user.id || req.user._id), req.body.notes);
      sendSuccess(res, { data: sanitize(attendance, req.user.role), message: 'Checked out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getToday(req, res, next) {
    try {
      const attendance = await attendanceService.getToday((req.user.id || req.user._id));
      sendSuccess(res, { data: attendance ? sanitize(attendance, req.user.role) : null });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const query = req.validQuery || req.query;
      const { records, meta } = await attendanceService.getAll(query, (req.user.id || req.user._id), req.user.role);
      sendSuccess(res, { data: sanitizeMany(records, req.user.role), meta });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlySummary(req, res, next) {
    try {
      const userId = req.query.userId && req.user.role === 'super_admin'
        ? req.query.userId
        : (req.user.id || req.user._id);
      const month = req.query.month || new Date().toISOString().slice(0, 7);
      const summary = await attendanceService.getMonthlySummary(userId, month);

      // Strip suspicious info for non-admins
      if (req.user.role !== 'super_admin') {
        summary.suspiciousDays = undefined;
        summary.records = sanitizeMany(summary.records, req.user.role);
      }

      sendSuccess(res, { data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getTodayAll(req, res, next) {
    try {
      const records = await attendanceService.getTodayAll();
      sendSuccess(res, { data: records });
    } catch (error) {
      next(error);
    }
  }

  async registerIp(req, res, next) {
    try {
      const user = await attendanceService.registerIp(req.body.userId, req.body.ip);
      sendSuccess(res, { data: user, message: 'IP registered' });
    } catch (error) {
      next(error);
    }
  }

  async removeIp(req, res, next) {
    try {
      const user = await attendanceService.removeIp(req.params.userId, req.params.ip);
      sendSuccess(res, { data: user, message: 'IP removed' });
    } catch (error) {
      next(error);
    }
  }
}

export default new AttendanceController();
