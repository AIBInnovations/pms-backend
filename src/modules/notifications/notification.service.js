import Notification from './notification.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

class NotificationService {
  async create(data) {
    const notification = await Notification.create(data);
    return notification;
  }

  async createBulk(notifications) {
    const result = await Notification.insertMany(notifications);
    return result;
  }

  async getByUser(userId, query = {}) {
    const { page = 1, limit = 20, read, type } = query;

    const filter = { user: userId };
    if (read !== undefined) filter.read = read;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('actor', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    return { notifications, meta: buildPaginationMeta(total, page, limit) };
  }

  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({ user: userId, read: false });
    return count;
  }

  async markAsRead(userId, ids) {
    const result = await Notification.updateMany(
      { _id: { $in: ids }, user: userId },
      { $set: { read: true } }
    );
    return result;
  }

  async markAllRead(userId) {
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );
    return result;
  }

  async delete(id, userId) {
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    if (notification.user.toString() !== userId) {
      throw new AppError('You can only delete your own notifications', 403, 'FORBIDDEN');
    }

    await Notification.findByIdAndDelete(id);
    return notification;
  }
}

export default new NotificationService();
