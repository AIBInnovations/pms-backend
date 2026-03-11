import AuditLog from './audit.model.js';
import { buildPaginationMeta } from '../../utils/index.js';

class AuditService {
  async log({ userId, action, module, targetId, targetModel, metadata, ipAddress }) {
    return AuditLog.create({
      userId,
      action,
      module,
      targetId,
      targetModel,
      metadata,
      ipAddress,
    });
  }

  async getByUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      AuditLog.countDocuments({ userId }),
    ]);
    return { logs, meta: buildPaginationMeta(total, page, limit) };
  }

  async getByModule(module, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find({ module })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      AuditLog.countDocuments({ module }),
    ]);
    return { logs, meta: buildPaginationMeta(total, page, limit) };
  }

  async getAll({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email'),
      AuditLog.countDocuments(),
    ]);
    return { logs, meta: buildPaginationMeta(total, page, limit) };
  }
}

export default new AuditService();
