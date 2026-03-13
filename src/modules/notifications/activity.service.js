import AuditLog from './audit.model.js';

const ACTION_LABELS = {
  create_task: 'created task',
  update_task: 'updated task',
  delete_task: 'deleted task',
  create_project: 'created project',
  update_project: 'updated project',
  delete_project: 'deleted project',
  create_comments: 'added a comment',
  update_comments: 'updated a comment',
  delete_comments: 'deleted a comment',
  create_documents: 'uploaded a document',
  delete_documents: 'deleted a document',
};

function formatLog(log) {
  return {
    _id: log._id,
    actor: log.userId,
    action: ACTION_LABELS[log.action] || log.action.replace(/_/g, ' '),
    targetTitle: log.metadata?.body?.title || log.metadata?.body?.name || log.module,
    createdAt: log.createdAt,
  };
}

const ACTIVITY_MODULES = ['tasks', 'projects', 'comments', 'documents'];

class ActivityService {
  async getGlobal(query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const filter = { module: { $in: ACTIVITY_MODULES } };
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);
    return { activities: logs.map(formatLog), meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getByProject(projectId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const filter = {
      module: { $in: ACTIVITY_MODULES },
      $or: [
        { 'metadata.body.project': String(projectId) },
        { targetId: projectId },
      ],
    };
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);
    return { activities: logs.map(formatLog), meta: { total, page: Number(page), limit: Number(limit) } };
  }
}

export default new ActivityService();
