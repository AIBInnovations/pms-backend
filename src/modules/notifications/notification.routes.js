import { Router } from 'express';
import notificationController from './notification.controller.js';
import preferenceService from './preference.service.js';
import { auth, validate } from '../../middleware/index.js';
import { sendSuccess } from '../../utils/index.js';
import {
  notificationQuerySchema,
  markReadSchema,
} from './notification.validation.js';

const router = Router();

router.use(auth);

// Get notifications for current user
router.get(
  '/',
  validate(notificationQuerySchema, 'query'),
  notificationController.getNotifications.bind(notificationController)
);

// Get unread count
router.get(
  '/unread-count',
  notificationController.getUnreadCount.bind(notificationController)
);

// Mark specific notifications as read
router.patch(
  '/read',
  validate(markReadSchema),
  notificationController.markAsRead.bind(notificationController)
);

// Mark all notifications as read
router.patch(
  '/read-all',
  notificationController.markAllRead.bind(notificationController)
);

// Delete a notification
router.delete(
  '/:id',
  notificationController.deleteNotification.bind(notificationController)
);

// Notification preferences
router.get('/preferences', async (req, res, next) => {
  try {
    const prefs = await preferenceService.getByUser(req.user.id);
    sendSuccess(res, { data: prefs });
  } catch (error) { next(error); }
});

router.patch('/preferences', async (req, res, next) => {
  try {
    const prefs = await preferenceService.update(req.user.id, req.body);
    sendSuccess(res, { data: prefs, message: 'Preferences updated' });
  } catch (error) { next(error); }
});

export default router;
