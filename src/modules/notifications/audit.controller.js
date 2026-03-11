import AuditLog from './audit.model.js';
import { sendSuccess, buildPaginationMeta } from '../../utils/index.js';

class AuditController {
  async getAll(req, res, next) {
    try {
      const query = req.validQuery || req.query;
      const { page = 1, limit = 50, module, userId, search } = query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (module) filter.module = module;
      if (userId) filter.userId = userId;
      if (search) {
        filter.action = { $regex: search, $options: 'i' };
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate('userId', 'name email avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        AuditLog.countDocuments(filter),
      ]);

      sendSuccess(res, {
        data: logs,
        meta: buildPaginationMeta(total, Number(page), Number(limit)),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuditController();
