import attendanceService from './attendance.service.js';
import { sendSuccess } from '../../utils/index.js';

class AttendanceController {
  async checkIn(req, res, next) {
    try {
      // Get IP from request — try multiple sources
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || req.ip
        || 'unknown';
      // Normalize IPv6-mapped IPv4 (::ffff:192.168.x.x → 192.168.x.x)
      const cleanIp = ip.replace(/^::ffff:/, '');
      const { notes } = req.body;

      console.log('[Attendance] checkIn attempt:', { userId: req.user._id, ip: cleanIp, headers: { xff: req.headers['x-forwarded-for'], xri: req.headers['x-real-ip'] } });

      const { attendance, warnings } = await attendanceService.checkIn(
        req.user._id, cleanIp, notes || ''
      );

      sendSuccess(res, {
        data: attendance,
        warnings,
        message: warnings.length > 0
          ? 'Checked in (with warnings)'
          : 'Checked in successfully',
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req, res, next) {
    try {
      const attendance = await attendanceService.checkOut(req.user._id, req.body.notes);
      sendSuccess(res, { data: attendance, message: 'Checked out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getToday(req, res, next) {
    try {
      const attendance = await attendanceService.getToday(req.user._id);
      sendSuccess(res, { data: attendance });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const query = req.validQuery || req.query;
      const { records, meta } = await attendanceService.getAll(query, req.user._id, req.user.role);
      sendSuccess(res, { data: records, meta });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlySummary(req, res, next) {
    try {
      const userId = req.query.userId && req.user.role === 'super_admin'
        ? req.query.userId
        : req.user._id;
      const month = req.query.month || new Date().toISOString().slice(0, 7);
      const summary = await attendanceService.getMonthlySummary(userId, month);
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
