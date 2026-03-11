import notificationService from './notification.service.js';
import { sendSuccess } from '../../utils/index.js';

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const query = req.validQuery || req.query;
      const { notifications, meta } = await notificationService.getByUser(req.user.id, query);
      sendSuccess(res, { data: notifications, meta });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      sendSuccess(res, { data: { count } });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.user.id, req.body.ids);
      sendSuccess(res, { message: 'Notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      await notificationService.markAllRead(req.user.id);
      sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      await notificationService.delete(req.params.id, req.user.id);
      sendSuccess(res, { message: 'Notification deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
