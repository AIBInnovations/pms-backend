import Activity from './activity.model.js';

class ActivityService {
  async log({ project, actor, action, targetType, targetId, targetTitle, metadata }) {
    return Activity.create({ project, actor, action, targetType, targetId, targetTitle, metadata });
  }

  async getByProject(projectId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      Activity.find({ project: projectId })
        .populate('actor', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({ project: projectId }),
    ]);
    return { activities, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }

  async getGlobal(query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      Activity.find()
        .populate('actor', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(),
    ]);
    return { activities, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } };
  }
}

export default new ActivityService();
